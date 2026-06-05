// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MolqDecisionLogger {
    enum ActionType {
        Deposit,
        Withdraw,
        AllocateShield,
        AllocateAlpha,
        Harvest,
        Harden,
        Pause
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
    address public owner;
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

    error NotOwner();
    error NotAgent();
    error InvalidRiskScore();

    constructor(address initialOwner) {
        owner = initialOwner;
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function _checkOwner() private view {
        if (msg.sender != owner) revert NotOwner();
    }

    function setAgent(address agent, bool allowed) external onlyOwner {
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
