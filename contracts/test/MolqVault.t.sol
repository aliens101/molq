// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MolqDecisionLogger } from "../src/MolqDecisionLogger.sol";
import { IERC20, MolqVault } from "../src/MolqVault.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";

contract MolqVaultTest is Test {
    MockERC20 private asset;
    MolqDecisionLogger private logger;
    MolqVault private vault;
    address private user = address(0xBEEF);

    function setUp() public {
        asset = new MockERC20();
        logger = new MolqDecisionLogger(address(this));
        vault = new MolqVault(IERC20(address(asset)), logger, address(this));

        asset.mint(user, 1000 ether);
        vm.prank(user);
        asset.approve(address(vault), type(uint256).max);
    }

    function testDepositUsesEightyFiveFifteenAllocation() public {
        vm.prank(user);
        uint256 shares = vault.deposit(1000 ether);

        assertEq(shares, 1000 ether);
        assertEq(vault.sharesOf(user), 1000 ether);
        assertEq(vault.shieldBalance(), 850 ether);
        assertEq(vault.alphaBalance(), 150 ether);
        assertEq(vault.totalAssets(), 1000 ether);
    }

    function testProfitCanBeRecordedAndHardened() public {
        vm.prank(user);
        vault.deposit(1000 ether);

        asset.mint(address(this), 20 ether);
        asset.approve(address(vault), 20 ether);
        vault.recordProfit(20 ether);
        vault.hardenProfit(16 ether);

        assertEq(vault.totalAssets(), 1020 ether);
        assertEq(vault.shieldBalance(), 866 ether);
        assertEq(vault.alphaBalance(), 154 ether);
    }

    function testWithdrawReturnsProRataProfit() public {
        vm.prank(user);
        vault.deposit(1000 ether);

        asset.mint(address(this), 20 ether);
        asset.approve(address(vault), 20 ether);
        vault.recordProfit(20 ether);

        vm.prank(user);
        uint256 assets = vault.withdraw(500 ether);

        assertEq(assets, 510 ether);
        assertEq(asset.balanceOf(user), 510 ether);
        assertEq(vault.totalAssets(), 510 ether);
        assertEq(vault.totalShares(), 500 ether);
    }

    function testNonOwnerCannotRecordProfit() public {
        vm.prank(user);
        vm.expectRevert(MolqVault.NotOwner.selector);
        vault.recordProfit(1 ether);
    }
}
