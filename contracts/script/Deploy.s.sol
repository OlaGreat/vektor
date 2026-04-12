// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {VektorVault} from "../src/VektorVault.sol";
import {StrategyExecutor} from "../src/StrategyExecutor.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

contract Deploy is Script {
    function run() external {
        address oracleAddress = vm.envAddress("CONNECT_ORACLE_ADDRESS");

        vm.startBroadcast();

        // 1. Deploy mock USDC
        MockUSDC usdc = new MockUSDC();
        console.log("MockUSDC deployed at:", address(usdc));

        // 2. Deploy vault with deployer as fee recipient
        address deployer = msg.sender;
        VektorVault vault = new VektorVault(address(usdc), deployer);
        console.log("VektorVault deployed at:", address(vault));

        // 3. Deploy executor with deployer as session key (update later)
        StrategyExecutor executor = new StrategyExecutor(oracleAddress, deployer);
        console.log("StrategyExecutor deployed at:", address(executor));

        // 4. Wire vault to executor
        vault.setAgent(address(executor));

        // 5. Mint 10,000 USDC to deployer for testing
        usdc.mint(deployer, 10_000 * 1e6);
        console.log("Minted 10,000 USDC to deployer");

        vm.stopBroadcast();

        console.log("\n=== Add to .env ===");
        console.log("DEPOSIT_TOKEN_ADDRESS=%s", address(usdc));
        console.log("NEXT_PUBLIC_VAULT_ADDRESS=%s", address(vault));
        console.log("NEXT_PUBLIC_EXECUTOR_ADDRESS=%s", address(executor));
    }
}
