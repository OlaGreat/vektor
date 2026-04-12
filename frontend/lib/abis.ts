export const VAULT_ABI = [
  "function deposit(uint256 amount) external returns (uint256 minted)",
  "function withdraw(uint256 shareAmount) external returns (uint256 returned)",
  "function totalAssets() view returns (uint256)",
  "function totalShares() view returns (uint256)",
  "function shares(address user) view returns (uint256)",
  "function userStrategy(address user) view returns (string)",
  "function setStrategy(string calldata strategy) external",
  "function FEE_BPS() view returns (uint256)",
  "function EXEC_FEE_BPS() view returns (uint256)",
  "event Deposited(address indexed user, uint256 amount, uint256 shares)",
  "event Withdrawn(address indexed user, uint256 shares, uint256 amount)",
] as const;

export const EXECUTOR_ABI = [
  "function getUserPositions(address user) view returns (tuple(string rollup, uint256 stakedAmount, uint256 lpAmount, uint256 esInitAccrued, uint256 lastUpdated, string positionType)[])",
  "function getUserActions(address user) view returns (tuple(uint8 actionType, string reasoning, uint256 timestamp, bool executed)[])",
  "function getUserGaugeVotes(address user) view returns (tuple(string rollup, uint256 weightBps, uint256 timestamp)[])",
  "function getPrices(string[] memory pairs) view returns (uint256[] memory prices, uint256[] memory timestamps)",
] as const;

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
] as const;
