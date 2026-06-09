// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { MolqDecisionLogger } from "../src/MolqDecisionLogger.sol";

contract DeployDecisionLogger is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);

        vm.startBroadcast(privateKey);
        MolqDecisionLogger logger = new MolqDecisionLogger(deployer);
        logger.setAgent(deployer, true);
        vm.stopBroadcast();

        console2.log("MolqDecisionLogger:", address(logger));
        console2.log("Owner and initial agent:", deployer);
    }
}
