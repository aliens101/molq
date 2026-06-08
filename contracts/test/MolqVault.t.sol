// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAavePool } from "../src/interfaces/IAavePool.sol";
import { MolqVault } from "../src/MolqVault.sol";
import { MockERC20 } from "./mocks/MockERC20.sol";
import { MockAToken, MockAavePool } from "./mocks/MockAavePool.sol";

contract MolqVaultTest is Test {
    MockERC20 private asset;
    MockAavePool private pool;
    MockAToken private aToken;
    MolqVault private vault;

    address private user = address(0xBEEF);
    address private keeper = address(0xCAFE);
    address private treasury = address(0xFEE);

    function setUp() public {
        asset = new MockERC20();
        pool = new MockAavePool(IERC20(address(asset)));
        aToken = pool.A_TOKEN();
        vault = new MolqVault({
            asset_: IERC20(address(asset)),
            aavePool_: IAavePool(address(pool)),
            aToken_: IERC20(address(aToken)),
            owner_: address(this),
            keeper_: keeper,
            shieldTargetBps_: 8500,
            treasury_: treasury,
            performanceFeeBps_: 1000
        });

        asset.mint(user, 1000 ether);
        vm.prank(user);
        asset.approve(address(vault), type(uint256).max);
    }

    function testDepositInvestsShieldIntoAave() public {
        vm.prank(user);
        uint256 shares = vault.deposit(1000 ether, user);

        assertEq(shares, 1000 ether);
        assertEq(vault.balanceOf(user), 1000 ether);
        assertEq(vault.liquidAssets(), 150 ether);
        assertEq(vault.shieldAssets(), 850 ether);
        assertEq(vault.totalAssets(), 1000 ether);
    }

    function testWithdrawRedeemsAaveWhenLiquidAssetsAreInsufficient() public {
        vm.prank(user);
        vault.deposit(1000 ether, user);

        vm.prank(user);
        uint256 assets = vault.redeem(500 ether, user, user);

        assertEq(assets, 500 ether);
        assertEq(asset.balanceOf(user), 500 ether);
        assertEq(vault.totalAssets(), 500 ether);
    }

    function testAaveYieldAccruesToVaultShareholders() public {
        vm.prank(user);
        vault.deposit(1000 ether, user);

        asset.mint(address(aToken), 85 ether);
        pool.accrueYield(address(vault), 85 ether);

        assertEq(vault.totalAssets(), 1085 ether);
        assertApproxEqAbs(vault.convertToAssets(1000 ether), 1085 ether, 1);
    }

    function testHardenedProfitChargesFeeAndIncreasesShareValue() public {
        vm.prank(user);
        vault.deposit(1000 ether, user);
        asset.mint(keeper, 100 ether);
        vm.prank(keeper);
        asset.approve(address(vault), 100 ether);

        vm.prank(keeper);
        vault.hardenProfit(100 ether);

        assertEq(asset.balanceOf(treasury), 10 ether);
        assertEq(vault.totalAssets(), 1090 ether);
        assertApproxEqAbs(vault.convertToAssets(1000 ether), 1090 ether, 1);
        assertEq(vault.shieldAssets(), 926.5 ether);
        assertEq(vault.liquidAssets(), 163.5 ether);
    }

    function testPrincipalDepositsDoNotPayPerformanceFee() public {
        vm.prank(user);
        vault.deposit(1000 ether, user);

        assertEq(asset.balanceOf(treasury), 0);
        assertEq(vault.totalAssets(), 1000 ether);
    }

    function testPerformanceFeeCannotExceedTwentyPercent() public {
        vm.expectRevert(MolqVault.InvalidFee.selector);
        vault.setPerformanceFee(2001);
    }

    function testKeeperCanRebalanceToUpdatedTarget() public {
        vm.prank(user);
        vault.deposit(1000 ether, user);
        vault.setShieldTarget(9000);

        vm.prank(keeper);
        vault.rebalance(0);

        assertEq(vault.shieldAssets(), 900 ether);
        assertEq(vault.liquidAssets(), 100 ether);
    }

    function testEmergencyExitRedeemsAllAaveAssetsAndPauses() public {
        vm.prank(user);
        vault.deposit(1000 ether, user);

        vault.emergencyExit(849 ether);

        assertEq(vault.shieldAssets(), 0);
        assertEq(vault.liquidAssets(), 1000 ether);
        assertTrue(vault.paused());
    }
}
