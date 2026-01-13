// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IiPredict Interface
 * @notice Interface for the iPredict decentralized prediction market
 * @dev Defines all structs, events, errors, and function signatures
 */
interface IiPredict {
    // ============ Structs ============

    struct Market {
        uint256 id;
        string question;
        string imageUrl;
        string category;
        uint256 endTime;
        uint256 totalYesBets;
        uint256 totalNoBets;
        uint256 yesCount;
        uint256 noCount;
        bool resolved;
        bool outcome;
        bool cancelled;
        address creator;
        uint256 createdAt;
    }

    struct Bet {
        uint256 amount;
        bool isYes;
        bool claimed;
        uint256 timestamp;
    }

    struct UserStats {
        uint256 totalPoints;
        uint256 totalBets;
        uint256 correctBets;
        uint256 totalWinnings;
    }

    // ============ Events ============

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string category,
        uint256 endTime,
        address indexed creator
    );
    event MarketResolved(uint256 indexed marketId, bool outcome, uint256 totalPool, uint256 platformFee);
    event MarketCancelled(uint256 indexed marketId, uint256 totalRefundable);
    event BetPlaced(uint256 indexed marketId, address indexed user, bool isYes, uint256 amount, uint256 newTotal);
    event WinningsClaimed(uint256 indexed marketId, address indexed user, uint256 amount, uint256 points);
    event RefundClaimed(uint256 indexed marketId, address indexed user, uint256 amount);
    event PointsEarned(address indexed user, uint256 points, uint256 totalPoints);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed admin, uint256 amount);
    event AdminTransferInitiated(address indexed currentAdmin, address indexed pendingAdmin);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);
    event Paused(address indexed admin);
    event Unpaused(address indexed admin);

    // ============ Errors ============

    error NotAdmin();
    error MarketDoesNotExist();
    error MarketNotActive();
    error MarketNotResolved();
    error MarketAlreadyResolved();
    error MarketIsCancelled();
    error AlreadyBet();
    error AlreadyClaimed();
    error NoBetFound();
    error BetTooSmall();
    error YouLost();
    error TransferFailed();
    error InvalidFee();
    error ContractPaused();
    error InvalidDuration();
    error EmptyQuestion();
    error ZeroAddress();

    // ============ Admin Functions ============

    function createMarket(
        string calldata question,
        string calldata imageUrl,
        string calldata category,
        uint256 duration
    ) external returns (uint256);

    function resolveMarket(uint256 marketId, bool outcome) external;
    function cancelMarket(uint256 marketId) external;
    function setFee(uint256 newFee) external;
    function withdrawFees() external;
    function transferAdmin(address newAdmin) external;
    function acceptAdmin() external;
    function pause() external;
    function unpause() external;

    // ============ User Functions ============

    function placeBet(uint256 marketId, bool isYes) external payable;
    function claimWinnings(uint256 marketId) external;
    function claimRefund(uint256 marketId) external;
    function batchClaim(uint256[] calldata marketIds) external;

    // ============ View Functions ============

    function getMarket(uint256 marketId) external view returns (Market memory);
    function getMarkets(uint256 offset, uint256 limit) external view returns (Market[] memory);
    function getUserBet(uint256 marketId, address user) external view returns (Bet memory);
    function getUserStats(address user) external view returns (UserStats memory);
    function getUserMarkets(address user) external view returns (uint256[] memory);
    function getMarketOdds(uint256 marketId) external view returns (uint256 yesPercent, uint256 noPercent);
    function calculatePotentialWin(uint256 marketId, uint256 amount, bool isYes) external view returns (uint256);
    function getActiveMarkets() external view returns (uint256[] memory);
    function getClaimableMarkets(address user) external view returns (uint256[] memory);
}
