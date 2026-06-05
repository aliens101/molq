// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Script, console2 } from "forge-std/Script.sol";
import { MolqDecisionLogger } from "../src/MolqDecisionLogger.sol";
import { IERC20, MolqVault } from "../src/MolqVault.sol";
import { MockUSDe } from "../src/MockUSDe.sol";

contract DeployDemo is Script {
    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        vm.startBroadcast(privateKey);

        MockUSDe asset = new MockUSDe();
        MolqDecisionLogger logger = new MolqDecisionLogger(deployer);
        MolqVault vault = new MolqVault(IERC20(address(asset)), logger, deployer);

        vm.stopBroadcast();

        console2.log("MockUSDe:", address(asset));
        console2.log("MolqDecisionLogger:", address(logger));
        console2.log("MolqVault:", address(vault));
    }
}
