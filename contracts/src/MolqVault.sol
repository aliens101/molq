// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { MolqDecisionLogger } from "./MolqDecisionLogger.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
}

contract MolqVault {
    IERC20 public immutable ASSET;
    MolqDecisionLogger public immutable LOGGER;
    address public owner;

    uint256 public totalShares;
    uint256 public shieldBalance;
    uint256 public alphaBalance;
    mapping(address => uint256) public sharesOf;

    event Deposited(address indexed user, uint256 assets, uint256 shares);
    event Withdrawn(address indexed user, uint256 assets, uint256 shares);
    event ProfitRecorded(uint256 amount);
    event BucketsUpdated(uint256 shieldBalance, uint256 alphaBalance);

    error NotOwner();
    error InvalidAmount();
    error TransferFailed();
    error InsufficientShares();

    constructor(IERC20 asset_, MolqDecisionLogger logger_, address owner_) {
        ASSET = asset_;
        LOGGER = logger_;
        owner = owner_;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() private view {
        if (msg.sender != owner) revert NotOwner();
    }

    function totalAssets() public view returns (uint256) {
        return shieldBalance + alphaBalance;
    }

    function deposit(uint256 assets) external returns (uint256 shares) {
        if (assets == 0) revert InvalidAmount();

        uint256 supply = totalShares;
        uint256 total = totalAssets();
        shares = supply == 0 || total == 0 ? assets : (assets * supply) / total;

        if (!ASSET.transferFrom(msg.sender, address(this), assets)) revert TransferFailed();

        totalShares += shares;
        sharesOf[msg.sender] += shares;
        shieldBalance += (assets * 8500) / 10_000;
        alphaBalance += assets - ((assets * 8500) / 10_000);

        emit Deposited(msg.sender, assets, shares);
        emit BucketsUpdated(shieldBalance, alphaBalance);
    }

    function withdraw(uint256 shares) external returns (uint256 assets) {
        if (shares == 0) revert InvalidAmount();
        if (sharesOf[msg.sender] < shares) revert InsufficientShares();

        uint256 totalBefore = totalAssets();
        assets = (shares * totalBefore) / totalShares;
        uint256 shieldDebit = (shieldBalance * assets) / totalBefore;
        uint256 alphaDebit = assets - shieldDebit;

        sharesOf[msg.sender] -= shares;
        totalShares -= shares;
        shieldBalance -= shieldDebit;
        alphaBalance -= alphaDebit;

        if (!ASSET.transfer(msg.sender, assets)) revert TransferFailed();

        emit Withdrawn(msg.sender, assets, shares);
        emit BucketsUpdated(shieldBalance, alphaBalance);
    }

    function hardenProfit(uint256 amount) external onlyOwner {
        if (amount == 0 || amount > alphaBalance) revert InvalidAmount();
        alphaBalance -= amount;
        shieldBalance += amount;
        emit BucketsUpdated(shieldBalance, alphaBalance);
    }

    function recordProfit(uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();
        if (!ASSET.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
        alphaBalance += amount;
        emit ProfitRecorded(amount);
        emit BucketsUpdated(shieldBalance, alphaBalance);
    }
}
