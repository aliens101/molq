// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IInitLendingPool {
    function underlyingToken() external view returns (address);
    function getSupplyRate_e18() external view returns (uint256);
    function cash() external view returns (uint256);
    function totalAssets() external view returns (uint256);
    function totalDebt() external view returns (uint256);
    function totalSupply() external view returns (uint256);
}

contract InitUsdeShieldReader {
    address public constant INIT_USDE_LENDING_POOL = 0x3282437C436eE6AA9861a6A46ab0822d82581b1c;

    struct Snapshot {
        address pool;
        address underlyingToken;
        uint256 supplyRateE18;
        uint256 availableLiquidity;
        uint256 totalAssets;
        uint256 totalDebt;
        uint256 totalSupply;
        uint256 timestamp;
    }

    function snapshot() external view returns (Snapshot memory data) {
        return snapshotFor(INIT_USDE_LENDING_POOL);
    }

    function snapshotFor(address pool) public view returns (Snapshot memory data) {
        IInitLendingPool lendingPool = IInitLendingPool(pool);
        data = Snapshot({
            pool: pool,
            underlyingToken: lendingPool.underlyingToken(),
            supplyRateE18: lendingPool.getSupplyRate_e18(),
            availableLiquidity: lendingPool.cash(),
            totalAssets: lendingPool.totalAssets(),
            totalDebt: lendingPool.totalDebt(),
            totalSupply: lendingPool.totalSupply(),
            timestamp: block.timestamp
        });
    }
}
