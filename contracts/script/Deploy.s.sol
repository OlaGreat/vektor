// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "../lib/forge-std/src/Script.sol";
import {VektorVault} from "../src/VektorVault.sol";
import {StrategyExecutor} from "../src/StrategyExecutor.sol";

contract Deploy is Script {
    function run() external {
        address deployer      = vm.envAddress("DEPLOYER_ADDRESS");
        address feeRecipient  = vm.envOr("FEE_RECIPIENT", deployer);
        address depositToken  = vm.envAddress("DEPOSIT_TOKEN_ADDRESS");
        address oracleAddress = vm.envAddress("CONNECT_ORACLE_ADDRESS");
        address sessionKey    = vm.envOr("SESSION_KEY_ADDRESS", deployer);

        vm.startBroadcast();

        VektorVault vault = new VektorVault(depositToken, feeRecipient);
        console.log("VektorVault deployed at:", address(vault));

        StrategyExecutor executor = new StrategyExecutor(oracleAddress, sessionKey);
        console.log("StrategyExecutor deployed at:", address(executor));

        // Wire vault to executor
        vault.setAgent(address(executor));
        console.log("Agent set on vault:", address(executor));

        vm.stopBroadcast();

        console.log("\n--- Add to .env ---");
        console.log("NEXT_PUBLIC_VAULT_ADDRESS=%s", address(vault));
        console.log("NEXT_PUBLIC_EXECUTOR_ADDRESS=%s", address(executor));
    }
}
