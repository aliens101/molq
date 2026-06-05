// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { MolqDecisionLogger } from "../src/MolqDecisionLogger.sol";

contract MolqDecisionLoggerTest is Test {
    MolqDecisionLogger private logger;
    address private agent = address(0xA11CE);

    function setUp() public {
        logger = new MolqDecisionLogger(address(this));
        logger.setAgent(agent, true);
    }

    function testAgentCanLogDecision() public {
        vm.prank(agent);
        uint256 id = logger.logDecision(
            MolqDecisionLogger.ActionType.Harvest, 100 ether, 2500, keccak256("harvest alpha profit into shield")
        );

        assertEq(id, 1);
        (, address loggedAgent,, uint256 amount, uint256 riskScoreBps,,) = logger.decisions(id);
        assertEq(loggedAgent, agent);
        assertEq(amount, 100 ether);
        assertEq(riskScoreBps, 2500);
    }

    function testUnapprovedAccountCannotLogDecision() public {
        vm.expectRevert(MolqDecisionLogger.NotAgent.selector);
        logger.logDecision(MolqDecisionLogger.ActionType.AllocateShield, 0, 2000, bytes32(0));
    }

    function testRiskScoreCannotExceedTenThousand() public {
        vm.prank(agent);
        vm.expectRevert(MolqDecisionLogger.InvalidRiskScore.selector);
        logger.logDecision(MolqDecisionLogger.ActionType.Pause, 0, 10_001, bytes32(0));
    }
}
