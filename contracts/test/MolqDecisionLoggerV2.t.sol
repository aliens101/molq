// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MolqDecisionLoggerV2 } from "../src/MolqDecisionLoggerV2.sol";

contract MolqDecisionLoggerV2Test is Test {
    MolqDecisionLoggerV2 private logger;
    address private safe = address(0x5AFE);
    address private nextSafe = address(0xBEEF);
    address private agent = address(0xA11CE);

    function setUp() public {
        logger = new MolqDecisionLoggerV2(safe, agent);
    }

    function testInitialAgentCanLogDecision() public {
        vm.prank(agent);
        uint256 id = logger.logDecision(MolqDecisionLoggerV2.ActionType.Hold, 0, 2500, keccak256("hold"));
        assertEq(id, 1);
    }

    function testSafeCanRotateAgent() public {
        address replacement = address(0xCAFE);
        vm.prank(safe);
        logger.setAgent(replacement, true);
        assertTrue(logger.agents(replacement));
    }

    function testOwnershipUsesTwoStepTransfer() public {
        vm.prank(safe);
        logger.transferOwnership(nextSafe);
        assertEq(logger.owner(), safe);
        assertEq(logger.pendingOwner(), nextSafe);

        vm.prank(nextSafe);
        logger.acceptOwnership();
        assertEq(logger.owner(), nextSafe);
    }
}
