// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./interfaces/IiPredict.sol";

/**
 * @title iPredict
 * @notice Decentralized prediction market on Injective EVM
 * @dev Users bet YES/NO on markets, winners split the loser pool minus platform fee
 */
contract iPredict is IiPredict {
    // ============ Constants ============

    uint256 public constant MAX_FEE = 1000; // 10% max (basis points)
    uint256 public constant POINTS_MULTIPLIER = 10; // Points per 0.1 INJ won
    uint256 public constant MIN_BET = 0.01 ether; // Minimum bet amount
    uint256 public constant MAX_DURATION = 365 days; // Maximum market duration

    // ============ State Variables ============

    address public admin;
    address public pendingAdmin;
    uint256 public platformFee = 200; // 2% default (basis points)
    uint256 public marketCount;
    uint256 public accumulatedFees;
    bool public paused;

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(address => UserStats) public userStats;
    mapping(address => uint256[]) public userMarkets;

    // ============ Modifiers ============

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    modifier marketExists(uint256 _marketId) {
        if (_marketId >= marketCount) revert MarketDoesNotExist();
        _;
    }

    modifier marketActive(uint256 _marketId) {
        Market storage market = markets[_marketId];
        if (market.resolved) revert MarketAlreadyResolved();
        if (market.cancelled) revert MarketIsCancelled();
        if (block.timestamp >= market.endTime) revert MarketNotActive();
        _;
    }

    modifier marketEnded(uint256 _marketId) {
        if (block.timestamp < markets[_marketId].endTime) revert MarketNotActive();
        _;
    }

    // ============ Constructor ============

    constructor() {
        admin = msg.sender;
        emit AdminTransferred(address(0), msg.sender);
    }

    // ============ Admin Functions ============

    /// @notice Creates a new prediction market
    /// @param question The prediction question
    /// @param imageUrl URL for market image
    /// @param category Market category (e.g., "Crypto", "Sports")
    /// @param duration Duration in seconds until market ends
    /// @return marketId The ID of the newly created market
    function createMarket(
        string calldata question,
        string calldata imageUrl,
        string calldata category,
        uint256 duration
    ) external onlyAdmin whenNotPaused returns (uint256) {
        if (bytes(question).length == 0) revert EmptyQuestion();
        if (duration == 0 || duration > MAX_DURATION) revert InvalidDuration();

        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];

        market.id = marketId;
        market.question = question;
        market.imageUrl = imageUrl;
        market.category = category;
        market.endTime = block.timestamp + duration;
        market.creator = msg.sender;
        market.createdAt = block.timestamp;

        emit MarketCreated(marketId, question, category, market.endTime, msg.sender);

        return marketId;
    }

    /// @notice Resolves a market with the final outcome
    /// @param marketId The market to resolve
    /// @param outcome True for YES wins, false for NO wins
    function resolveMarket(uint256 marketId, bool outcome)
        external
        onlyAdmin
        marketExists(marketId)
        marketEnded(marketId)
    {
        Market storage market = markets[marketId];
        if (market.resolved) revert MarketAlreadyResolved();
        if (market.cancelled) revert MarketIsCancelled();

        market.resolved = true;
        market.outcome = outcome;

        uint256 totalPool = market.totalYesBets + market.totalNoBets;
        uint256 fee = (totalPool * platformFee) / 10000;
        accumulatedFees += fee;

        emit MarketResolved(marketId, outcome, totalPool, fee);
    }

    /// @notice Cancels a market, allowing refunds
    /// @param marketId The market to cancel
    function cancelMarket(uint256 marketId) external onlyAdmin marketExists(marketId) {
        Market storage market = markets[marketId];
        if (market.resolved) revert MarketAlreadyResolved();
        if (market.cancelled) revert MarketIsCancelled();

        market.cancelled = true;

        uint256 totalRefundable = market.totalYesBets + market.totalNoBets;
        emit MarketCancelled(marketId, totalRefundable);
    }

    /// @notice Updates the platform fee
    /// @param newFee New fee in basis points (e.g., 200 = 2%)
    function setFee(uint256 newFee) external onlyAdmin {
        if (newFee > MAX_FEE) revert InvalidFee();

        uint256 oldFee = platformFee;
        platformFee = newFee;

        emit FeeUpdated(oldFee, newFee);
    }

    /// @notice Withdraws accumulated platform fees
    function withdrawFees() external onlyAdmin {
        uint256 amount = accumulatedFees;
        if (amount == 0) revert TransferFailed();

        accumulatedFees = 0;

        (bool success,) = admin.call{ value: amount }("");
        if (!success) revert TransferFailed();

        emit FeesWithdrawn(admin, amount);
    }

    /// @notice Initiates admin transfer (two-step process)
    /// @param newAdmin Address of the new admin
    function transferAdmin(address newAdmin) external onlyAdmin {
        if (newAdmin == address(0)) revert ZeroAddress();

        pendingAdmin = newAdmin;
        emit AdminTransferInitiated(admin, newAdmin);
    }

    /// @notice Completes admin transfer
    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert NotAdmin();

        address oldAdmin = admin;
        admin = pendingAdmin;
        pendingAdmin = address(0);

        emit AdminTransferred(oldAdmin, admin);
    }

    /// @notice Pauses contract operations
    function pause() external onlyAdmin {
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Unpauses contract operations
    function unpause() external onlyAdmin {
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ============ User Functions ============

    /// @notice Places a bet on a market
    /// @param marketId The market to bet on
    /// @param isYes True to bet YES, false to bet NO
    function placeBet(uint256 marketId, bool isYes)
        external
        payable
        whenNotPaused
        marketExists(marketId)
        marketActive(marketId)
    {
        if (msg.value < MIN_BET) revert BetTooSmall();
        if (bets[marketId][msg.sender].amount > 0) revert AlreadyBet();

        Market storage market = markets[marketId];
        Bet storage bet = bets[marketId][msg.sender];

        bet.amount = msg.value;
        bet.isYes = isYes;
        bet.timestamp = block.timestamp;

        if (isYes) {
            market.totalYesBets += msg.value;
            market.yesCount++;
        } else {
            market.totalNoBets += msg.value;
            market.noCount++;
        }

        userMarkets[msg.sender].push(marketId);
        userStats[msg.sender].totalBets++;

        uint256 newTotal = isYes ? market.totalYesBets : market.totalNoBets;
        emit BetPlaced(marketId, msg.sender, isYes, msg.value, newTotal);
    }

    /// @notice Claims winnings from a resolved market
    /// @param marketId The market to claim from
    function claimWinnings(uint256 marketId) external marketExists(marketId) {
        Market storage market = markets[marketId];
        Bet storage bet = bets[marketId][msg.sender];

        if (!market.resolved) revert MarketNotResolved();
        if (market.cancelled) revert MarketIsCancelled();
        if (bet.amount == 0) revert NoBetFound();
        if (bet.claimed) revert AlreadyClaimed();
        if (bet.isYes != market.outcome) revert YouLost();

        bet.claimed = true;

        uint256 payout = _calculatePayout(marketId, msg.sender);
        uint256 points = (payout * POINTS_MULTIPLIER) / 0.1 ether;

        UserStats storage stats = userStats[msg.sender];
        stats.totalPoints += points;
        stats.correctBets++;
        stats.totalWinnings += payout;

        (bool success,) = msg.sender.call{ value: payout }("");
        if (!success) revert TransferFailed();

        emit WinningsClaimed(marketId, msg.sender, payout, points);
        emit PointsEarned(msg.sender, points, stats.totalPoints);
    }

    /// @notice Claims refund from a cancelled market
    /// @param marketId The market to claim refund from
    function claimRefund(uint256 marketId) external marketExists(marketId) {
        Market storage market = markets[marketId];
        Bet storage bet = bets[marketId][msg.sender];

        if (!market.cancelled) revert MarketNotActive();
        if (bet.amount == 0) revert NoBetFound();
        if (bet.claimed) revert AlreadyClaimed();

        bet.claimed = true;
        uint256 amount = bet.amount;

        (bool success,) = msg.sender.call{ value: amount }("");
        if (!success) revert TransferFailed();

        emit RefundClaimed(marketId, msg.sender, amount);
    }

    /// @notice Claims winnings from multiple markets in one transaction
    /// @param marketIds Array of market IDs to claim from
    function batchClaim(uint256[] calldata marketIds) external {
        uint256 totalPayout;
        uint256 totalPoints;

        for (uint256 i; i < marketIds.length;) {
            uint256 marketId = marketIds[i];
            if (marketId >= marketCount) {
                unchecked { ++i; }
                continue;
            }

            Market storage market = markets[marketId];
            Bet storage bet = bets[marketId][msg.sender];

            if (market.resolved && !market.cancelled && bet.amount > 0 && !bet.claimed && bet.isYes == market.outcome) {
                bet.claimed = true;
                uint256 payout = _calculatePayout(marketId, msg.sender);
                uint256 points = (payout * POINTS_MULTIPLIER) / 0.1 ether;

                totalPayout += payout;
                totalPoints += points;

                userStats[msg.sender].correctBets++;
                userStats[msg.sender].totalWinnings += payout;

                emit WinningsClaimed(marketId, msg.sender, payout, points);
            }

            unchecked { ++i; }
        }

        if (totalPayout > 0) {
            userStats[msg.sender].totalPoints += totalPoints;
            emit PointsEarned(msg.sender, totalPoints, userStats[msg.sender].totalPoints);

            (bool success,) = msg.sender.call{ value: totalPayout }("");
            if (!success) revert TransferFailed();
        }
    }

    // ============ View Functions ============

    /// @notice Gets a single market by ID
    function getMarket(uint256 marketId) external view returns (Market memory) {
        return markets[marketId];
    }

    /// @notice Gets paginated list of markets
    function getMarkets(uint256 offset, uint256 limit) external view returns (Market[] memory) {
        if (offset >= marketCount) {
            return new Market[](0);
        }

        uint256 remaining = marketCount - offset;
        uint256 count = limit > remaining ? remaining : limit;
        Market[] memory result = new Market[](count);

        for (uint256 i; i < count;) {
            result[i] = markets[offset + i];
            unchecked { ++i; }
        }

        return result;
    }

    /// @notice Gets a user's bet on a specific market
    function getUserBet(uint256 marketId, address user) external view returns (Bet memory) {
        return bets[marketId][user];
    }

    /// @notice Gets a user's overall statistics
    function getUserStats(address user) external view returns (UserStats memory) {
        return userStats[user];
    }

    /// @notice Gets all market IDs a user has bet on
    function getUserMarkets(address user) external view returns (uint256[] memory) {
        return userMarkets[user];
    }

    /// @notice Gets current odds for a market
    function getMarketOdds(uint256 marketId) external view returns (uint256 yesPercent, uint256 noPercent) {
        Market storage market = markets[marketId];
        uint256 total = market.totalYesBets + market.totalNoBets;

        if (total == 0) {
            return (50, 50);
        }

        yesPercent = (market.totalYesBets * 100) / total;
        noPercent = 100 - yesPercent;
    }

    /// @notice Calculates potential winnings for a hypothetical bet
    function calculatePotentialWin(uint256 marketId, uint256 amount, bool isYes) external view returns (uint256) {
        Market storage market = markets[marketId];

        uint256 totalPool = market.totalYesBets + market.totalNoBets + amount;
        uint256 fee = (totalPool * platformFee) / 10000;
        uint256 winnerPool = totalPool - fee;

        uint256 winningBets = isYes ? market.totalYesBets + amount : market.totalNoBets + amount;

        if (winningBets == 0) return 0;

        return (amount * winnerPool) / winningBets;
    }

    /// @notice Gets all active (non-resolved, non-cancelled) market IDs
    function getActiveMarkets() external view returns (uint256[] memory) {
        uint256 count;
        for (uint256 i; i < marketCount;) {
            Market storage market = markets[i];
            if (!market.resolved && !market.cancelled && block.timestamp < market.endTime) {
                count++;
            }
            unchecked { ++i; }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index;
        for (uint256 i; i < marketCount;) {
            Market storage market = markets[i];
            if (!market.resolved && !market.cancelled && block.timestamp < market.endTime) {
                result[index++] = i;
            }
            unchecked { ++i; }
        }

        return result;
    }

    /// @notice Gets markets where user has unclaimed winnings
    function getClaimableMarkets(address user) external view returns (uint256[] memory) {
        uint256[] storage userMkts = userMarkets[user];
        uint256 count;

        for (uint256 i; i < userMkts.length;) {
            uint256 marketId = userMkts[i];
            Market storage market = markets[marketId];
            Bet storage bet = bets[marketId][user];

            if (market.resolved && !market.cancelled && !bet.claimed && bet.isYes == market.outcome) {
                count++;
            }
            unchecked { ++i; }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index;
        for (uint256 i; i < userMkts.length;) {
            uint256 marketId = userMkts[i];
            Market storage market = markets[marketId];
            Bet storage bet = bets[marketId][user];

            if (market.resolved && !market.cancelled && !bet.claimed && bet.isYes == market.outcome) {
                result[index++] = marketId;
            }
            unchecked { ++i; }
        }

        return result;
    }

    // ============ Internal Functions ============

    /// @dev Calculates payout for a winning bet
    function _calculatePayout(uint256 marketId, address user) internal view returns (uint256) {
        Market storage market = markets[marketId];
        Bet storage bet = bets[marketId][user];

        uint256 totalPool = market.totalYesBets + market.totalNoBets;
        uint256 fee = (totalPool * platformFee) / 10000;
        uint256 winnerPool = totalPool - fee;

        uint256 winningBets = market.outcome ? market.totalYesBets : market.totalNoBets;

        return (bet.amount * winnerPool) / winningBets;
    }

    /// @dev Checks if user won their bet
    function _isWinner(uint256 marketId, address user) internal view returns (bool) {
        Market storage market = markets[marketId];
        Bet storage bet = bets[marketId][user];
        return bet.amount > 0 && market.resolved && bet.isYes == market.outcome;
    }

    // ============ Receive ============

    /// @notice Accept direct INJ transfers
    receive() external payable { }
}
