// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { MolqDecisionLoggerV2 } from "../src/MolqDecisionLoggerV2.sol";

contract DeployDecisionLoggerV2 is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address safeOwner = vm.envAddress("SAFE_OWNER");
        address agent = vm.envAddress("AGENT");

        vm.startBroadcast(privateKey);
        MolqDecisionLoggerV2 logger = new MolqDecisionLoggerV2(safeOwner, agent);
        vm.stopBroadcast();

        console2.log("MolqDecisionLoggerV2:", address(logger));
        console2.log("Safe owner:", safeOwner);
        console2.log("Initial agent:", agent);
    }
}
