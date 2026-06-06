// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockInitLendingPool {
    address public underlyingToken;
    uint256 public supplyRateE18;
    uint256 public cash;
    uint256 public totalAssets;
    uint256 public totalDebt;
    uint256 public totalSupply;

    constructor(address underlyingToken_) {
        underlyingToken = underlyingToken_;
    }

    function setSnapshot(
        uint256 supplyRateE18_,
        uint256 cash_,
        uint256 totalAssets_,
        uint256 totalDebt_,
        uint256 totalSupply_
    ) external {
        supplyRateE18 = supplyRateE18_;
        cash = cash_;
        totalAssets = totalAssets_;
        totalDebt = totalDebt_;
        totalSupply = totalSupply_;
    }

    function getSupplyRate_e18() external view returns (uint256) {
        return supplyRateE18;
    }
}
