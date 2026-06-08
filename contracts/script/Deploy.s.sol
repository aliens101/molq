// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IAavePool } from "../src/interfaces/IAavePool.sol";
import { MolqVault } from "../src/MolqVault.sol";

contract Deploy is Script {
    address private constant USDE = 0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34;
    address private constant AAVE_POOL = 0x458F293454fE0d67EC0655f3672301301DD51422;
    address private constant AAVE_USDE = 0xb9aCA933C9c0aa854a6DBb7b12f0CC3FdaC15ee7;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        address keeper = vm.envOr("KEEPER", deployer);
        address treasury = vm.envOr("TREASURY", deployer);

        vm.startBroadcast(privateKey);
        MolqVault vault = new MolqVault({
            asset_: IERC20(USDE),
            aavePool_: IAavePool(AAVE_POOL),
            aToken_: IERC20(AAVE_USDE),
            owner_: deployer,
            keeper_: keeper,
            shieldTargetBps_: 8500,
            treasury_: treasury,
            performanceFeeBps_: 1000
        });
        vm.stopBroadcast();

        console2.log("MolqVault:", address(vault));
        console2.log("Owner:", deployer);
        console2.log("Keeper:", keeper);
        console2.log("Treasury:", treasury);
        console2.log("Performance fee (bps):", 1000);
    }
}
