// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "../lib/forge-std/src/interfaces/IERC20.sol";

/// @title VektorVault
/// @notice User deposit vault. Issues shares, tracks positions, collects protocol fees.
contract VektorVault {
    // ─── Errors ───────────────────────────────────────────────────────────────
    error ZeroAmount();
    error InsufficientShares();
    error NotAgent();
    error NotOwner();
    error ZeroAddress();

    // ─── Events ───────────────────────────────────────────────────────────────
    event Deposited(address indexed user, uint256 amount, uint256 shares);
    event Withdrawn(address indexed user, uint256 shares, uint256 amount);
    event AgentUpdated(address indexed agent);
    event StrategySet(address indexed user, string strategy);
    event FeeCollected(uint256 amount);

    // ─── State ────────────────────────────────────────────────────────────────
    address public owner;
    address public agent;                   // AI agent executor address
    address public feeRecipient;
    IERC20 public depositToken;             // accepted deposit token

    uint256 public totalShares;
    uint256 public totalAssets;
    uint256 public constant FEE_BPS = 1000; // 10% of yield
    uint256 public constant EXEC_FEE_BPS = 30; // 0.3% on executions

    mapping(address => uint256) public shares;
    mapping(address => string)  public userStrategy;  // natural language strategy
    mapping(address => uint256) public lastActionTime;

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAgent() {
        if (msg.sender != agent) revert NotAgent();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _depositToken, address _feeRecipient) {
        if (_depositToken == address(0) || _feeRecipient == address(0)) revert ZeroAddress();
        owner        = msg.sender;
        depositToken = IERC20(_depositToken);
        feeRecipient = _feeRecipient;
    }

    // ─── User Functions ───────────────────────────────────────────────────────

    /// @notice Deposit tokens and receive vault shares
    function deposit(uint256 amount) external returns (uint256 minted) {
        if (amount == 0) revert ZeroAmount();
        bool ok1 = depositToken.transferFrom(msg.sender, address(this), amount);
        require(ok1, "transferFrom failed");

        minted = totalShares == 0
            ? amount
            : (amount * totalShares) / totalAssets;

        shares[msg.sender] += minted;
        totalShares         += minted;
        totalAssets         += amount;

        emit Deposited(msg.sender, amount, minted);
    }

    /// @notice Burn shares and withdraw underlying tokens
    function withdraw(uint256 shareAmount) external returns (uint256 returned) {
        if (shareAmount == 0) revert ZeroAmount();
        if (shares[msg.sender] < shareAmount) revert InsufficientShares();

        returned = (shareAmount * totalAssets) / totalShares;

        shares[msg.sender] -= shareAmount;
        totalShares         -= shareAmount;
        totalAssets         -= returned;

        bool ok2 = depositToken.transfer(msg.sender, returned);
        require(ok2, "transfer failed");
        emit Withdrawn(msg.sender, shareAmount, returned);
    }

    /// @notice Set your strategy in plain English — agent reads this
    function setStrategy(string calldata strategy) external {
        userStrategy[msg.sender] = strategy;
        emit StrategySet(msg.sender, strategy);
    }

    // ─── Agent Functions ──────────────────────────────────────────────────────

    /// @notice Agent records yield earned; takes 10% protocol fee
    function recordYield(uint256 yieldAmount) external onlyAgent {
        if (yieldAmount == 0) return;

        uint256 fee = (yieldAmount * FEE_BPS) / 10_000;
        uint256 net = yieldAmount - fee;

        totalAssets += net;

        // Pull fee from contract balance (agent must have deposited yield first)
        require(depositToken.transfer(feeRecipient, fee), "fee transfer failed");
        emit FeeCollected(fee);
    }

    /// @notice Agent takes execution fee on swap/bridge actions
    function takeExecutionFee(uint256 amount) external onlyAgent returns (uint256 fee) {
        fee = (amount * EXEC_FEE_BPS) / 10_000;
        require(depositToken.transfer(feeRecipient, fee), "fee transfer failed");
        emit FeeCollected(fee);
    }

    /// @notice Agent updates total assets (e.g. after rebalance)
    function updateTotalAssets(uint256 newTotal) external onlyAgent {
        totalAssets = newTotal;
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function shareValue(address user) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[user] * totalAssets) / totalShares;
    }

    function pricePerShare() external view returns (uint256) {
        if (totalShares == 0) return 1e18;
        return (totalAssets * 1e18) / totalShares;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setAgent(address _agent) external onlyOwner {
        if (_agent == address(0)) revert ZeroAddress();
        agent = _agent;
        emit AgentUpdated(_agent);
    }

    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        if (_feeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = _feeRecipient;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
}
