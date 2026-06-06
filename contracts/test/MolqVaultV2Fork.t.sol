// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAavePool } from "../src/interfaces/IAavePool.sol";
import { MolqVaultV2 } from "../src/MolqVaultV2.sol";

contract MolqVaultV2ForkTest is Test {
    address private constant USDE = 0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34;
    address private constant AAVE_POOL = 0x458F293454fE0d67EC0655f3672301301DD51422;
    address private constant AAVE_USDE = 0xb9aCA933C9c0aa854a6DBb7b12f0CC3FdaC15ee7;

    address private user = address(0xBEEF);
    MolqVaultV2 private vault;

    function setUp() public {
        vm.createSelectFork(vm.envOr("MANTLE_RPC_URL", string("https://rpc.mantle.xyz")));
        vault = new MolqVaultV2({
            asset_: IERC20(USDE),
            aavePool_: IAavePool(AAVE_POOL),
            aToken_: IERC20(AAVE_USDE),
            owner_: address(this),
            keeper_: address(this),
            shieldTargetBps_: 8500
        });

        deal(USDE, user, 100 ether);
        vm.prank(user);
        IERC20(USDE).approve(address(vault), type(uint256).max);
    }

    function testRealAaveDepositAndWithdraw() public {
        vm.prank(user);
        uint256 shares = vault.deposit(100 ether, user);

        assertEq(shares, 100 ether);
        assertApproxEqAbs(vault.shieldAssets(), 85 ether, 2);
        assertEq(vault.liquidAssets(), 15 ether);

        vm.prank(user);
        uint256 assets = vault.redeem(shares, user, user);

        assertApproxEqAbs(assets, 100 ether, 2);
        assertApproxEqAbs(IERC20(USDE).balanceOf(user), 100 ether, 2);
    }
}
