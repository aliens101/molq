// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";

contract MolqDecisionLoggerV2 is Ownable2Step {
    enum ActionType {
        Deposit,
        Withdraw,
        AllocateShield,
        AllocateAlpha,
        Harvest,
        Harden,
        Pause,
        Hold,
        Rebalance,
        Hedge,
        RebalanceAndHedge
    }

    struct Decision {
        uint256 id;
        address agent;
        ActionType actionType;
        uint256 amount;
        uint256 riskScoreBps;
        bytes32 reasonHash;
        uint256 timestamp;
    }

    uint256 public nextDecisionId = 1;
    mapping(address => bool) public agents;
    mapping(uint256 => Decision) public decisions;

    event AgentSet(address indexed agent, bool allowed);
    event DecisionLogged(
        uint256 indexed id,
        address indexed agent,
        ActionType actionType,
        uint256 amount,
        uint256 riskScoreBps,
        bytes32 reasonHash
    );

    error NotAgent();
    error InvalidAddress();
    error InvalidRiskScore();

    constructor(address initialOwner, address initialAgent) Ownable(initialOwner) {
        if (initialAgent == address(0)) revert InvalidAddress();
        agents[initialAgent] = true;
        emit AgentSet(initialAgent, true);
    }

    function setAgent(address agent, bool allowed) external onlyOwner {
        if (agent == address(0)) revert InvalidAddress();
        agents[agent] = allowed;
        emit AgentSet(agent, allowed);
    }

    function logDecision(ActionType actionType, uint256 amount, uint256 riskScoreBps, bytes32 reasonHash)
        external
        returns (uint256 id)
    {
        if (!agents[msg.sender]) revert NotAgent();
        if (riskScoreBps > 10_000) revert InvalidRiskScore();

        id = nextDecisionId++;
        decisions[id] = Decision({
            id: id,
            agent: msg.sender,
            actionType: actionType,
            amount: amount,
            riskScoreBps: riskScoreBps,
            reasonHash: reasonHash,
            timestamp: block.timestamp
        });

        emit DecisionLogged(id, msg.sender, actionType, amount, riskScoreBps, reasonHash);
    }
}
