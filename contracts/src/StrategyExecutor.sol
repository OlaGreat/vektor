// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IConnectOracle} from "./interfaces/IConnectOracle.sol";

/// @title StrategyExecutor
/// @notice Called by the AI agent via auto-sign session key.
///         Records agent actions onchain, reads oracle prices, tracks positions.
contract StrategyExecutor {
    // ─── Errors ───────────────────────────────────────────────────────────────
    error NotAuthorized();
    error NotOwner();
    error ZeroAddress();
    error StalePrice();

    // ─── Events ───────────────────────────────────────────────────────────────
    event ActionExecuted(
        address indexed user,
        ActionType indexed actionType,
        string reasoning,
        uint256 timestamp
    );
    event PositionUpdated(address indexed user, string rollup, uint256 amount, string positionType);
    event GaugeVoteRecorded(address indexed user, string rollup, uint256 weightBps);
    event OracleRead(string pair, uint256 price, uint256 timestamp);

    // ─── Types ────────────────────────────────────────────────────────────────
    enum ActionType {
        ANALYZE,
        BRIDGE_RECOMMEND,
        STAKE,
        UNSTAKE,
        GAUGE_VOTE,
        COMPOUND,
        REBALANCE
    }

    struct Position {
        string  rollup;
        uint256 stakedAmount;
        uint256 lpAmount;
        uint256 esInitAccrued;
        uint256 lastUpdated;
        string  positionType; // "lp_stake" | "direct_stake" | "liquidity"
    }

    struct GaugeVote {
        string  rollup;
        uint256 weightBps;  // basis points, sum must equal 10000
        uint256 timestamp;
    }

    struct AgentAction {
        ActionType  actionType;
        string      reasoning;
        uint256     timestamp;
        bool        executed;
    }

    // ─── State ────────────────────────────────────────────────────────────────
    address public owner;
    address public sessionKey;              // auto-sign session key (agent)
    IConnectOracle public oracle;

    uint256 public constant PRICE_STALENESS = 5 minutes;

    mapping(address => Position[])   public userPositions;
    mapping(address => GaugeVote[])  public userGaugeVotes;
    mapping(address => AgentAction[]) public userActions;

    // Gauge weight state per rollup (basis points, for display)
    mapping(string => uint256) public gaugeWeights;
    string[] public trackedRollups;

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyAuthorized() {
        if (msg.sender != sessionKey && msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor(address _oracle, address _sessionKey) {
        if (_oracle == address(0)) revert ZeroAddress();
        owner      = msg.sender;
        oracle     = IConnectOracle(_oracle);
        sessionKey = _sessionKey;
    }

    // ─── Agent Execution Functions ────────────────────────────────────────────

    /// @notice Record an agent action with its reasoning (called via auto-sign)
    function recordAction(
        address user,
        ActionType actionType,
        string calldata reasoning
    ) external onlyAuthorized {
        userActions[user].push(AgentAction({
            actionType: actionType,
            reasoning:  reasoning,
            timestamp:  block.timestamp,
            executed:   true
        }));

        emit ActionExecuted(user, actionType, reasoning, block.timestamp);
    }

    /// @notice Update user position after agent rebalance
    function updatePosition(
        address user,
        string calldata rollup,
        uint256 stakedAmount,
        uint256 lpAmount,
        uint256 esInitAccrued,
        string calldata positionType
    ) external onlyAuthorized {
        // Find existing position for rollup or create new
        bool found = false;
        for (uint256 i = 0; i < userPositions[user].length; i++) {
            if (keccak256(bytes(userPositions[user][i].rollup)) == keccak256(bytes(rollup))) {
                userPositions[user][i].stakedAmount  = stakedAmount;
                userPositions[user][i].lpAmount      = lpAmount;
                userPositions[user][i].esInitAccrued = esInitAccrued;
                userPositions[user][i].lastUpdated   = block.timestamp;
                userPositions[user][i].positionType  = positionType;
                found = true;
                break;
            }
        }

        if (!found) {
            userPositions[user].push(Position({
                rollup:       rollup,
                stakedAmount: stakedAmount,
                lpAmount:     lpAmount,
                esInitAccrued: esInitAccrued,
                lastUpdated:  block.timestamp,
                positionType: positionType
            }));
        }

        emit PositionUpdated(user, rollup, stakedAmount + lpAmount, positionType);
    }

    /// @notice Record gauge vote recommendation for a user
    function recordGaugeVote(
        address user,
        string calldata rollup,
        uint256 weightBps
    ) external onlyAuthorized {
        userGaugeVotes[user].push(GaugeVote({
            rollup:    rollup,
            weightBps: weightBps,
            timestamp: block.timestamp
        }));

        emit GaugeVoteRecorded(user, rollup, weightBps);
    }

    /// @notice Update global gauge weights (from L1 data, read by agent)
    function updateGaugeWeights(
        string[] calldata rollups,
        uint256[] calldata weights
    ) external onlyAuthorized {
        require(rollups.length == weights.length, "length mismatch");
        for (uint256 i = 0; i < rollups.length; i++) {
            if (gaugeWeights[rollups[i]] == 0) {
                trackedRollups.push(rollups[i]);
            }
            gaugeWeights[rollups[i]] = weights[i];
        }
    }

    // ─── Oracle Functions ─────────────────────────────────────────────────────

    /// @notice Get current price from Connect Oracle
    function getPrice(string memory pair) external returns (uint256 price, uint256 timestamp) {
        IConnectOracle.Price memory p = oracle.get_price(pair);
        if (block.timestamp - p.timestamp > PRICE_STALENESS) revert StalePrice();
        emit OracleRead(pair, p.price, p.timestamp);
        return (p.price, p.timestamp);
    }

    /// @notice Get multiple prices from Connect Oracle
    function getPrices(string[] memory pairs)
        external
        view
        returns (uint256[] memory prices, uint256[] memory timestamps)
    {
        IConnectOracle.Price[] memory ps = oracle.get_prices(pairs);
        prices     = new uint256[](ps.length);
        timestamps = new uint256[](ps.length);
        for (uint256 i = 0; i < ps.length; i++) {
            prices[i]     = ps[i].price;
            timestamps[i] = ps[i].timestamp;
        }
    }

    // ─── View Functions ───────────────────────────────────────────────────────

    function getUserPositions(address user) external view returns (Position[] memory) {
        return userPositions[user];
    }

    function getUserActions(address user) external view returns (AgentAction[] memory) {
        return userActions[user];
    }

    function getUserGaugeVotes(address user) external view returns (GaugeVote[] memory) {
        return userGaugeVotes[user];
    }

    function getTrackedRollups() external view returns (string[] memory) {
        return trackedRollups;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setSessionKey(address _sessionKey) external onlyOwner {
        sessionKey = _sessionKey;
    }

    function setOracle(address _oracle) external onlyOwner {
        if (_oracle == address(0)) revert ZeroAddress();
        oracle = IConnectOracle(_oracle);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
}
