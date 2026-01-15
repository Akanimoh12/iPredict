// iPredict Contract Configuration

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

// Contract ABI - matches the deployed iPredict contract
export const CONTRACT_ABI = [
  // Read Functions
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "marketCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "platformFee",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "paused",
    inputs: [],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accumulatedFees",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMarket",
    inputs: [{ name: "marketId", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IiPredict.Market",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "question", type: "string", internalType: "string" },
          { name: "imageUrl", type: "string", internalType: "string" },
          { name: "category", type: "string", internalType: "string" },
          { name: "endTime", type: "uint256", internalType: "uint256" },
          { name: "totalYesBets", type: "uint256", internalType: "uint256" },
          { name: "totalNoBets", type: "uint256", internalType: "uint256" },
          { name: "yesCount", type: "uint256", internalType: "uint256" },
          { name: "noCount", type: "uint256", internalType: "uint256" },
          { name: "resolved", type: "bool", internalType: "bool" },
          { name: "outcome", type: "bool", internalType: "bool" },
          { name: "cancelled", type: "bool", internalType: "bool" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMarkets",
    inputs: [
      { name: "offset", type: "uint256", internalType: "uint256" },
      { name: "limit", type: "uint256", internalType: "uint256" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        internalType: "struct IiPredict.Market[]",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "question", type: "string", internalType: "string" },
          { name: "imageUrl", type: "string", internalType: "string" },
          { name: "category", type: "string", internalType: "string" },
          { name: "endTime", type: "uint256", internalType: "uint256" },
          { name: "totalYesBets", type: "uint256", internalType: "uint256" },
          { name: "totalNoBets", type: "uint256", internalType: "uint256" },
          { name: "yesCount", type: "uint256", internalType: "uint256" },
          { name: "noCount", type: "uint256", internalType: "uint256" },
          { name: "resolved", type: "bool", internalType: "bool" },
          { name: "outcome", type: "bool", internalType: "bool" },
          { name: "cancelled", type: "bool", internalType: "bool" },
          { name: "creator", type: "address", internalType: "address" },
          { name: "createdAt", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMarketOdds",
    inputs: [{ name: "marketId", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "yesPercent", type: "uint256", internalType: "uint256" },
      { name: "noPercent", type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserBet",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IiPredict.Bet",
        components: [
          { name: "amount", type: "uint256", internalType: "uint256" },
          { name: "isYes", type: "bool", internalType: "bool" },
          { name: "claimed", type: "bool", internalType: "bool" },
          { name: "timestamp", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserStats",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IiPredict.UserStats",
        components: [
          { name: "totalPoints", type: "uint256", internalType: "uint256" },
          { name: "totalBets", type: "uint256", internalType: "uint256" },
          { name: "correctBets", type: "uint256", internalType: "uint256" },
          { name: "totalWinnings", type: "uint256", internalType: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUserMarkets",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getClaimableMarkets",
    inputs: [{ name: "user", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "uint256[]", internalType: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "calculateWinnings",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "user", type: "address", internalType: "address" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  // Write Functions
  {
    type: "function",
    name: "placeBet",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "isYes", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "claimWinnings",
    inputs: [{ name: "marketId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimRefund",
    inputs: [{ name: "marketId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "batchClaim",
    inputs: [{ name: "marketIds", type: "uint256[]", internalType: "uint256[]" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Admin Write Functions
  {
    type: "function",
    name: "createMarket",
    inputs: [
      { name: "question", type: "string", internalType: "string" },
      { name: "imageUrl", type: "string", internalType: "string" },
      { name: "category", type: "string", internalType: "string" },
      { name: "duration", type: "uint256", internalType: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "resolveMarket",
    inputs: [
      { name: "marketId", type: "uint256", internalType: "uint256" },
      { name: "outcome", type: "bool", internalType: "bool" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "cancelMarket",
    inputs: [{ name: "marketId", type: "uint256", internalType: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "pause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unpause",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "withdrawFees",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  // Events
  {
    type: "event",
    name: "MarketCreated",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "question", type: "string", indexed: false, internalType: "string" },
      { name: "category", type: "string", indexed: false, internalType: "string" },
      { name: "endTime", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "creator", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "BetPlaced",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "isYes", type: "bool", indexed: false, internalType: "bool" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "newTotal", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "MarketResolved",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "outcome", type: "bool", indexed: false, internalType: "bool" },
      { name: "totalPool", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "platformFee", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WinningsClaimed",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "points", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RefundClaimed",
    inputs: [
      { name: "marketId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "amount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PointsEarned",
    inputs: [
      { name: "user", type: "address", indexed: true, internalType: "address" },
      { name: "points", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "totalPoints", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;

// Contract constants (matching the smart contract)
export const CONTRACT_CONSTANTS = {
  MAX_FEE: 1000, // 10% in basis points
  MIN_BET: BigInt("10000000000000000"), // 0.01 ether in wei
  POINTS_MULTIPLIER: 10,
  MAX_DURATION: 365 * 24 * 60 * 60, // 365 days in seconds
  DEFAULT_PLATFORM_FEE: 200, // 2% in basis points
};
