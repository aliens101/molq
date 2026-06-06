// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import { Test } from "forge-std/Test.sol";
import { InitUsdeShieldReader } from "../src/integrations/InitUsdeShieldReader.sol";
import { MockInitLendingPool } from "./mocks/MockInitLendingPool.sol";

contract InitUsdeShieldReaderTest is Test {
    InitUsdeShieldReader private reader;
    MockInitLendingPool private pool;
    address private underlying = address(0x1234);

    function setUp() public {
        reader = new InitUsdeShieldReader();
        pool = new MockInitLendingPool(underlying);
        pool.setSnapshot({
            supplyRateE18_: 1_700_000_000,
            cash_: 100_000 ether,
            totalAssets_: 125_000 ether,
            totalDebt_: 25_000 ether,
            totalSupply_: 124_000 ether
        });
    }

    function testReadsPoolSnapshot() public view {
        InitUsdeShieldReader.Snapshot memory snapshot = reader.snapshotFor(address(pool));

        assertEq(snapshot.pool, address(pool));
        assertEq(snapshot.underlyingToken, underlying);
        assertEq(snapshot.supplyRateE18, 1_700_000_000);
        assertEq(snapshot.availableLiquidity, 100_000 ether);
        assertEq(snapshot.totalAssets, 125_000 ether);
        assertEq(snapshot.totalDebt, 25_000 ether);
        assertEq(snapshot.totalSupply, 124_000 ether);
    }
}
