// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ERC4626 } from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { IAavePool } from "./interfaces/IAavePool.sol";

contract MolqVaultV2 is ERC4626, Ownable2Step, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant BPS = 10_000;
    uint256 public constant AAVE_ROUNDING_TOLERANCE = 10;

    IAavePool public immutable AAVE_POOL;
    IERC20 public immutable A_TOKEN;

    address public keeper;
    uint256 public shieldTargetBps;

    event KeeperUpdated(address indexed previousKeeper, address indexed newKeeper);
    event ShieldTargetUpdated(uint256 previousTargetBps, uint256 newTargetBps);
    event ShieldInvested(uint256 assets);
    event ShieldRedeemed(uint256 assets);
    event Rebalanced(uint256 shieldAssets, uint256 liquidAssets);
    event EmergencyExit(uint256 shares, uint256 assets);

    error NotKeeper();
    error InvalidAddress();
    error InvalidTarget();
    error SlippageExceeded();
    error InsufficientAaveLiquidity();

    constructor(
        IERC20 asset_,
        IAavePool aavePool_,
        IERC20 aToken_,
        address owner_,
        address keeper_,
        uint256 shieldTargetBps_
    ) ERC20("MolQ USDe Vault", "mqUSDe") ERC4626(asset_) Ownable(owner_) {
        if (address(aavePool_) == address(0) || address(aToken_) == address(0) || keeper_ == address(0)) {
            revert InvalidAddress();
        }
        if (shieldTargetBps_ > BPS) revert InvalidTarget();

        AAVE_POOL = aavePool_;
        A_TOKEN = aToken_;
        keeper = keeper_;
        shieldTargetBps = shieldTargetBps_;
        asset_.forceApprove(address(aavePool_), type(uint256).max);
    }

    modifier onlyKeeper() {
        _checkKeeper();
        _;
    }

    function _checkKeeper() internal view {
        if (msg.sender != keeper && msg.sender != owner()) revert NotKeeper();
    }

    function totalAssets() public view override returns (uint256) {
        uint256 idleAssets = IERC20(asset()).balanceOf(address(this));
        return idleAssets + A_TOKEN.balanceOf(address(this));
    }

    function shieldAssets() public view returns (uint256) {
        return A_TOKEN.balanceOf(address(this));
    }

    function liquidAssets() public view returns (uint256) {
        return IERC20(asset()).balanceOf(address(this));
    }

    function setKeeper(address newKeeper) external onlyOwner {
        if (newKeeper == address(0)) revert InvalidAddress();
        emit KeeperUpdated(keeper, newKeeper);
        keeper = newKeeper;
    }

    function setShieldTarget(uint256 newTargetBps) external onlyOwner {
        if (newTargetBps > BPS) revert InvalidTarget();
        emit ShieldTargetUpdated(shieldTargetBps, newTargetBps);
        shieldTargetBps = newTargetBps;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function rebalance(uint256 minAssetsOut) external onlyKeeper nonReentrant whenNotPaused {
        uint256 total = totalAssets();
        uint256 desiredShield = (total * shieldTargetBps) / BPS;
        uint256 currentShield = shieldAssets();

        if (currentShield < desiredShield) {
            _investShield(desiredShield - currentShield);
        } else if (currentShield > desiredShield) {
            _redeemShieldAssets(currentShield - desiredShield, minAssetsOut);
        }

        emit Rebalanced(shieldAssets(), liquidAssets());
    }

    function emergencyExit(uint256 minAssetsOut) external onlyOwner nonReentrant {
        uint256 assets = shieldAssets();
        uint256 assetsOut = _redeemShieldAssets(assets, minAssetsOut);
        _pause();
        emit EmergencyExit(assets, assetsOut);
    }

    function _deposit(address caller, address receiver, uint256 assets, uint256 shares)
        internal
        override
        nonReentrant
        whenNotPaused
    {
        super._deposit(caller, receiver, assets, shares);
        _investShield((assets * shieldTargetBps) / BPS);
    }

    function _withdraw(address caller, address receiver, address owner_, uint256 assets, uint256 shares)
        internal
        override
        nonReentrant
    {
        uint256 liquid = liquidAssets();
        if (liquid < assets) {
            _redeemShieldAssets(assets - liquid, assets - liquid);
        }
        super._withdraw(caller, receiver, owner_, assets, shares);
    }

    function _investShield(uint256 assets) internal {
        if (assets == 0) return;

        uint256 balanceBefore = A_TOKEN.balanceOf(address(this));
        AAVE_POOL.supply(asset(), assets, address(this), 0);
        uint256 received = A_TOKEN.balanceOf(address(this)) - balanceBefore;
        if (received + AAVE_ROUNDING_TOLERANCE < assets) revert SlippageExceeded();
        emit ShieldInvested(assets);
    }

    function _redeemShieldAssets(uint256 assets, uint256 minAssetsOut) internal returns (uint256 assetsOut) {
        if (assets == 0) return 0;
        if (IERC20(asset()).balanceOf(address(A_TOKEN)) < assets) revert InsufficientAaveLiquidity();

        assetsOut = AAVE_POOL.withdraw(asset(), assets, address(this));
        if (assetsOut < minAssetsOut) revert SlippageExceeded();
        emit ShieldRedeemed(assetsOut);
    }
}
