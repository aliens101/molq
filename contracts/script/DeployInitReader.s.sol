// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { InitUsdeShieldReader } from "../src/integrations/InitUsdeShieldReader.sol";

contract DeployInitReader is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(privateKey);
        InitUsdeShieldReader reader = new InitUsdeShieldReader();
        vm.stopBroadcast();

        console2.log("InitUsdeShieldReader:", address(reader));
    }
}
