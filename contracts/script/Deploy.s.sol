// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script } from "forge-std/Script.sol";
import { MolqDecisionLogger } from "../src/MolqDecisionLogger.sol";
import { IERC20, MolqVault } from "../src/MolqVault.sol";

contract Deploy is Script {
    function run() external {
        address asset = vm.envAddress("ASSET");
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);
        MolqDecisionLogger logger = new MolqDecisionLogger(deployer);
        new MolqVault(IERC20(asset), logger, deployer);
        vm.stopBroadcast();
    }
}
