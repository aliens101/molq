// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockAToken is ERC20 {
    using SafeERC20 for IERC20;

    address public immutable POOL;
    IERC20 public immutable UNDERLYING;

    constructor(address pool_, IERC20 underlying_) ERC20("Mock Aave USDe", "aUSDe") {
        POOL = pool_;
        UNDERLYING = underlying_;
    }

    function mint(address receiver, uint256 amount) external {
        require(msg.sender == POOL, "only pool");
        _mint(receiver, amount);
    }

    function burn(address owner, uint256 amount) external {
        require(msg.sender == POOL, "only pool");
        _burn(owner, amount);
    }

    function transferUnderlyingTo(address receiver, uint256 amount) external {
        require(msg.sender == POOL, "only pool");
        UNDERLYING.safeTransfer(receiver, amount);
    }
}

contract MockAavePool {
    using SafeERC20 for IERC20;

    IERC20 public immutable ASSET;
    MockAToken public immutable A_TOKEN;

    constructor(IERC20 asset_) {
        ASSET = asset_;
        A_TOKEN = new MockAToken(address(this), asset_);
    }

    function supply(address asset, uint256 amount, address onBehalfOf, uint16) external {
        require(asset == address(ASSET), "invalid asset");
        ASSET.safeTransferFrom(msg.sender, address(A_TOKEN), amount);
        A_TOKEN.mint(onBehalfOf, amount);
    }

    function withdraw(address asset, uint256 amount, address to) external returns (uint256 withdrawn) {
        require(asset == address(ASSET), "invalid asset");
        A_TOKEN.burn(msg.sender, amount);
        A_TOKEN.transferUnderlyingTo(to, amount);
        return amount;
    }

    function accrueYield(address receiver, uint256 amount) external {
        A_TOKEN.mint(receiver, amount);
    }
}
