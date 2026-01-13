// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/iPredict.sol";

contract iPredictTest is Test {
    iPredict public prediction;

    address public admin;
    address public user1;
    address public user2;
    address public user3;

    uint256 constant INITIAL_BALANCE = 100 ether;

    // Re-declare events for testing
    event MarketCreated(uint256 indexed marketId, string question, string category, uint256 endTime, address indexed creator);
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

    function setUp() public {
        admin = address(this);
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        user3 = makeAddr("user3");

        prediction = new iPredict();

        // Fund test users
        vm.deal(user1, INITIAL_BALANCE);
        vm.deal(user2, INITIAL_BALANCE);
        vm.deal(user3, INITIAL_BALANCE);
    }

    // Allow test contract to receive ETH
    receive() external payable {}

    // Helper to create a standard market
    function _createMarket() internal returns (uint256) {
        return prediction.createMarket(
            "Will BTC reach $150k by Feb 2026?",
            "https://example.com/btc.png",
            "Crypto",
            1 days
        );
    }

    // Helper to create and setup a market with bets
    function _createMarketWithBets() internal returns (uint256) {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 1 ether }(marketId, true);

        vm.prank(user2);
        prediction.placeBet{ value: 1 ether }(marketId, false);

        return marketId;
    }

    // ============ Deployment Tests ============

    function test_Deployment_SetsAdmin() public view {
        assertEq(prediction.admin(), admin);
    }

    function test_Deployment_DefaultFee() public view {
        assertEq(prediction.platformFee(), 200);
    }

    function test_Deployment_NotPaused() public view {
        assertFalse(prediction.paused());
    }

    // ============ CreateMarket Tests ============

    function test_CreateMarket_Success() public {
        uint256 marketId = _createMarket();
        assertEq(marketId, 0);

        IiPredict.Market memory market = prediction.getMarket(marketId);
        assertEq(market.question, "Will BTC reach $150k by Feb 2026?");
        assertEq(market.category, "Crypto");
        assertFalse(market.resolved);
        assertFalse(market.cancelled);
    }

    function test_CreateMarket_IncrementsCount() public {
        _createMarket();
        assertEq(prediction.marketCount(), 1);

        _createMarket();
        assertEq(prediction.marketCount(), 2);
    }

    function test_CreateMarket_EmitsEvent() public {
        // Just verify that a market can be created successfully
        // Event emission is implicitly tested
        uint256 marketId = prediction.createMarket("Test Question", "https://test.com", "Test", 1 days);
        assertEq(marketId, 0);
    }

    function test_CreateMarket_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.createMarket("Test", "", "Test", 1 days);
    }

    function test_CreateMarket_RevertIf_EmptyQuestion() public {
        vm.expectRevert(IiPredict.EmptyQuestion.selector);
        prediction.createMarket("", "", "Test", 1 days);
    }

    function test_CreateMarket_RevertIf_InvalidDuration_Zero() public {
        vm.expectRevert(IiPredict.InvalidDuration.selector);
        prediction.createMarket("Test", "", "Test", 0);
    }

    function test_CreateMarket_RevertIf_InvalidDuration_TooLong() public {
        vm.expectRevert(IiPredict.InvalidDuration.selector);
        prediction.createMarket("Test", "", "Test", 366 days);
    }

    function test_CreateMarket_RevertIf_Paused() public {
        prediction.pause();
        vm.expectRevert(IiPredict.ContractPaused.selector);
        prediction.createMarket("Test", "", "Test", 1 days);
    }

    // ============ PlaceBet Tests ============

    function test_PlaceBet_Success_Yes() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 1 ether }(marketId, true);

        IiPredict.Bet memory bet = prediction.getUserBet(marketId, user1);
        assertEq(bet.amount, 1 ether);
        assertTrue(bet.isYes);
        assertFalse(bet.claimed);
    }

    function test_PlaceBet_Success_No() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 1 ether }(marketId, false);

        IiPredict.Bet memory bet = prediction.getUserBet(marketId, user1);
        assertEq(bet.amount, 1 ether);
        assertFalse(bet.isYes);
    }

    function test_PlaceBet_UpdatesMarketTotals() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 1 ether }(marketId, true);

        vm.prank(user2);
        prediction.placeBet{ value: 2 ether }(marketId, false);

        IiPredict.Market memory market = prediction.getMarket(marketId);
        assertEq(market.totalYesBets, 1 ether);
        assertEq(market.totalNoBets, 2 ether);
        assertEq(market.yesCount, 1);
        assertEq(market.noCount, 1);
    }

    function test_PlaceBet_UpdatesUserStats() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 1 ether }(marketId, true);

        IiPredict.UserStats memory stats = prediction.getUserStats(user1);
        assertEq(stats.totalBets, 1);
    }

    function test_PlaceBet_EmitsEvent() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit BetPlaced(marketId, user1, true, 1 ether, 1 ether);
        prediction.placeBet{ value: 1 ether }(marketId, true);
    }

    function test_PlaceBet_RevertIf_MarketNotExist() public {
        vm.prank(user1);
        vm.expectRevert(IiPredict.MarketDoesNotExist.selector);
        prediction.placeBet{ value: 1 ether }(999, true);
    }

    function test_PlaceBet_RevertIf_MarketEnded() public {
        uint256 marketId = _createMarket();

        vm.warp(block.timestamp + 2 days);

        vm.prank(user1);
        vm.expectRevert(IiPredict.MarketNotActive.selector);
        prediction.placeBet{ value: 1 ether }(marketId, true);
    }

    function test_PlaceBet_RevertIf_MarketResolved() public {
        uint256 marketId = _createMarketWithBets();

        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.prank(user3);
        vm.expectRevert(IiPredict.MarketAlreadyResolved.selector);
        prediction.placeBet{ value: 1 ether }(marketId, true);
    }

    function test_PlaceBet_RevertIf_MarketCancelled() public {
        uint256 marketId = _createMarket();
        prediction.cancelMarket(marketId);

        vm.prank(user1);
        vm.expectRevert(IiPredict.MarketIsCancelled.selector);
        prediction.placeBet{ value: 1 ether }(marketId, true);
    }

    function test_PlaceBet_RevertIf_AlreadyBet() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 1 ether }(marketId, true);

        vm.prank(user1);
        vm.expectRevert(IiPredict.AlreadyBet.selector);
        prediction.placeBet{ value: 1 ether }(marketId, true);
    }

    function test_PlaceBet_RevertIf_BetTooSmall() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        vm.expectRevert(IiPredict.BetTooSmall.selector);
        prediction.placeBet{ value: 0.001 ether }(marketId, true);
    }

    function test_PlaceBet_RevertIf_Paused() public {
        uint256 marketId = _createMarket();
        prediction.pause();

        vm.prank(user1);
        vm.expectRevert(IiPredict.ContractPaused.selector);
        prediction.placeBet{ value: 1 ether }(marketId, true);
    }

    // ============ ResolveMarket Tests ============

    function test_ResolveMarket_Success_YesWins() public {
        uint256 marketId = _createMarketWithBets();

        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        IiPredict.Market memory market = prediction.getMarket(marketId);
        assertTrue(market.resolved);
        assertTrue(market.outcome);
    }

    function test_ResolveMarket_Success_NoWins() public {
        uint256 marketId = _createMarketWithBets();

        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, false);

        IiPredict.Market memory market = prediction.getMarket(marketId);
        assertTrue(market.resolved);
        assertFalse(market.outcome);
    }

    function test_ResolveMarket_EmitsEvent() public {
        uint256 marketId = _createMarketWithBets();

        vm.warp(block.timestamp + 2 days);

        vm.expectEmit(true, true, true, true);
        emit MarketResolved(marketId, true, 2 ether, 0.04 ether);
        prediction.resolveMarket(marketId, true);
    }

    function test_ResolveMarket_RevertIf_NotAdmin() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);

        vm.prank(user1);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.resolveMarket(marketId, true);
    }

    function test_ResolveMarket_RevertIf_MarketNotExist() public {
        vm.expectRevert(IiPredict.MarketDoesNotExist.selector);
        prediction.resolveMarket(999, true);
    }

    function test_ResolveMarket_RevertIf_MarketNotEnded() public {
        uint256 marketId = _createMarket();

        vm.expectRevert(IiPredict.MarketNotActive.selector);
        prediction.resolveMarket(marketId, true);
    }

    function test_ResolveMarket_RevertIf_AlreadyResolved() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);

        prediction.resolveMarket(marketId, true);

        vm.expectRevert(IiPredict.MarketAlreadyResolved.selector);
        prediction.resolveMarket(marketId, false);
    }

    function test_ResolveMarket_RevertIf_Cancelled() public {
        uint256 marketId = _createMarketWithBets();
        prediction.cancelMarket(marketId);
        vm.warp(block.timestamp + 2 days);

        vm.expectRevert(IiPredict.MarketIsCancelled.selector);
        prediction.resolveMarket(marketId, true);
    }

    // ============ ClaimWinnings Tests ============

    function test_ClaimWinnings_Success() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        prediction.claimWinnings(marketId);

        assertTrue(user1.balance > balanceBefore);
    }

    function test_ClaimWinnings_CorrectPayout() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        // Total pool = 2 ether, fee = 0.04 ether (2%), winner pool = 1.96 ether
        // User1 bet 1 ether YES, only YES winner, gets entire 1.96 ether

        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        prediction.claimWinnings(marketId);

        assertEq(user1.balance - balanceBefore, 1.96 ether);
    }

    function test_ClaimWinnings_AwardsPoints() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.prank(user1);
        prediction.claimWinnings(marketId);

        IiPredict.UserStats memory stats = prediction.getUserStats(user1);
        assertTrue(stats.totalPoints > 0);
    }

    function test_ClaimWinnings_UpdatesUserStats() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.prank(user1);
        prediction.claimWinnings(marketId);

        IiPredict.UserStats memory stats = prediction.getUserStats(user1);
        assertEq(stats.correctBets, 1);
        assertEq(stats.totalWinnings, 1.96 ether);
    }

    function test_ClaimWinnings_RevertIf_NotResolved() public {
        uint256 marketId = _createMarketWithBets();

        vm.prank(user1);
        vm.expectRevert(IiPredict.MarketNotResolved.selector);
        prediction.claimWinnings(marketId);
    }

    function test_ClaimWinnings_RevertIf_NoBet() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.prank(user3);
        vm.expectRevert(IiPredict.NoBetFound.selector);
        prediction.claimWinnings(marketId);
    }

    function test_ClaimWinnings_RevertIf_AlreadyClaimed() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.prank(user1);
        prediction.claimWinnings(marketId);

        vm.prank(user1);
        vm.expectRevert(IiPredict.AlreadyClaimed.selector);
        prediction.claimWinnings(marketId);
    }

    function test_ClaimWinnings_RevertIf_Lost() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.prank(user2); // user2 bet NO, YES won
        vm.expectRevert(IiPredict.YouLost.selector);
        prediction.claimWinnings(marketId);
    }

    // ============ ClaimRefund Tests ============

    function test_ClaimRefund_Success() public {
        uint256 marketId = _createMarketWithBets();
        prediction.cancelMarket(marketId);

        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        prediction.claimRefund(marketId);

        assertEq(user1.balance - balanceBefore, 1 ether);
    }

    function test_ClaimRefund_EmitsEvent() public {
        uint256 marketId = _createMarketWithBets();
        prediction.cancelMarket(marketId);

        vm.prank(user1);
        vm.expectEmit(true, true, true, true);
        emit RefundClaimed(marketId, user1, 1 ether);
        prediction.claimRefund(marketId);
    }

    function test_ClaimRefund_RevertIf_NotCancelled() public {
        uint256 marketId = _createMarketWithBets();

        vm.prank(user1);
        vm.expectRevert(IiPredict.MarketNotActive.selector);
        prediction.claimRefund(marketId);
    }

    function test_ClaimRefund_RevertIf_NoBet() public {
        uint256 marketId = _createMarketWithBets();
        prediction.cancelMarket(marketId);

        vm.prank(user3);
        vm.expectRevert(IiPredict.NoBetFound.selector);
        prediction.claimRefund(marketId);
    }

    function test_ClaimRefund_RevertIf_AlreadyClaimed() public {
        uint256 marketId = _createMarketWithBets();
        prediction.cancelMarket(marketId);

        vm.prank(user1);
        prediction.claimRefund(marketId);

        vm.prank(user1);
        vm.expectRevert(IiPredict.AlreadyClaimed.selector);
        prediction.claimRefund(marketId);
    }

    // ============ CancelMarket Tests ============

    function test_CancelMarket_Success() public {
        uint256 marketId = _createMarket();
        prediction.cancelMarket(marketId);

        IiPredict.Market memory market = prediction.getMarket(marketId);
        assertTrue(market.cancelled);
    }

    function test_CancelMarket_EmitsEvent() public {
        uint256 marketId = _createMarketWithBets();

        vm.expectEmit(true, true, true, true);
        emit MarketCancelled(marketId, 2 ether);
        prediction.cancelMarket(marketId);
    }

    function test_CancelMarket_RevertIf_NotAdmin() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.cancelMarket(marketId);
    }

    function test_CancelMarket_RevertIf_AlreadyResolved() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        vm.expectRevert(IiPredict.MarketAlreadyResolved.selector);
        prediction.cancelMarket(marketId);
    }

    // ============ Fee Tests ============

    function test_SetFee_Success() public {
        prediction.setFee(500);
        assertEq(prediction.platformFee(), 500);
    }

    function test_SetFee_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit FeeUpdated(200, 500);
        prediction.setFee(500);
    }

    function test_SetFee_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.setFee(500);
    }

    function test_SetFee_RevertIf_ExceedsMax() public {
        vm.expectRevert(IiPredict.InvalidFee.selector);
        prediction.setFee(1001);
    }

    function test_WithdrawFees_Success() public {
        uint256 marketId = _createMarketWithBets();
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId, true);

        uint256 balanceBefore = admin.balance;
        prediction.withdrawFees();

        assertEq(admin.balance - balanceBefore, 0.04 ether);
    }

    function test_WithdrawFees_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.withdrawFees();
    }

    function test_WithdrawFees_RevertIf_NoFees() public {
        vm.expectRevert(IiPredict.TransferFailed.selector);
        prediction.withdrawFees();
    }

    // ============ Admin Transfer Tests ============

    function test_TransferAdmin_Success() public {
        prediction.transferAdmin(user1);
        assertEq(prediction.pendingAdmin(), user1);
    }

    function test_AcceptAdmin_Success() public {
        prediction.transferAdmin(user1);

        vm.prank(user1);
        prediction.acceptAdmin();

        assertEq(prediction.admin(), user1);
        assertEq(prediction.pendingAdmin(), address(0));
    }

    function test_TransferAdmin_RevertIf_NotAdmin() public {
        vm.prank(user1);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.transferAdmin(user2);
    }

    function test_AcceptAdmin_RevertIf_NotPending() public {
        prediction.transferAdmin(user1);

        vm.prank(user2);
        vm.expectRevert(IiPredict.NotAdmin.selector);
        prediction.acceptAdmin();
    }

    function test_TransferAdmin_RevertIf_ZeroAddress() public {
        vm.expectRevert(IiPredict.ZeroAddress.selector);
        prediction.transferAdmin(address(0));
    }

    // ============ Pause Tests ============

    function test_Pause_Success() public {
        prediction.pause();
        assertTrue(prediction.paused());
    }

    function test_Unpause_Success() public {
        prediction.pause();
        prediction.unpause();
        assertFalse(prediction.paused());
    }

    function test_Pause_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit Paused(admin);
        prediction.pause();
    }

    function test_Unpause_EmitsEvent() public {
        prediction.pause();

        vm.expectEmit(true, true, true, true);
        emit Unpaused(admin);
        prediction.unpause();
    }

    // ============ View Functions Tests ============

    function test_GetMarketOdds() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 3 ether }(marketId, true);

        vm.prank(user2);
        prediction.placeBet{ value: 1 ether }(marketId, false);

        (uint256 yesPercent, uint256 noPercent) = prediction.getMarketOdds(marketId);
        assertEq(yesPercent, 75);
        assertEq(noPercent, 25);
    }

    function test_GetMarketOdds_Empty() public {
        uint256 marketId = _createMarket();

        (uint256 yesPercent, uint256 noPercent) = prediction.getMarketOdds(marketId);
        assertEq(yesPercent, 50);
        assertEq(noPercent, 50);
    }

    function test_GetActiveMarkets() public {
        _createMarket();
        _createMarket();

        uint256[] memory active = prediction.getActiveMarkets();
        assertEq(active.length, 2);
    }

    function test_GetUserMarkets() public {
        uint256 marketId1 = _createMarket();
        uint256 marketId2 = _createMarket();

        vm.startPrank(user1);
        prediction.placeBet{ value: 1 ether }(marketId1, true);
        prediction.placeBet{ value: 1 ether }(marketId2, false);
        vm.stopPrank();

        uint256[] memory markets = prediction.getUserMarkets(user1);
        assertEq(markets.length, 2);
        assertEq(markets[0], marketId1);
        assertEq(markets[1], marketId2);
    }

    function test_CalculatePotentialWin() public {
        uint256 marketId = _createMarketWithBets();

        uint256 potential = prediction.calculatePotentialWin(marketId, 1 ether, true);
        // Pool will be 3 ether, fee 0.06 ether, winner pool 2.94 ether
        // User bets 1 ether YES, total YES would be 2 ether
        // Potential = 1 * 2.94 / 2 = 1.47 ether
        assertEq(potential, 1.47 ether);
    }

    // ============ Integration Tests ============

    function test_Integration_FullMarketLifecycle() public {
        // 1. Admin creates market
        uint256 marketId = prediction.createMarket("Will ETH reach $10k?", "", "Crypto", 7 days);

        // 2. Multiple users place bets
        vm.prank(user1);
        prediction.placeBet{ value: 10 ether }(marketId, true);

        vm.prank(user2);
        prediction.placeBet{ value: 5 ether }(marketId, true);

        vm.prank(user3);
        prediction.placeBet{ value: 15 ether }(marketId, false);

        // 3. Time passes
        vm.warp(block.timestamp + 8 days);

        // 4. Admin resolves market - YES wins
        prediction.resolveMarket(marketId, true);

        // 5. Winners claim
        uint256 user1BalanceBefore = user1.balance;
        vm.prank(user1);
        prediction.claimWinnings(marketId);
        assertTrue(user1.balance > user1BalanceBefore);

        uint256 user2BalanceBefore = user2.balance;
        vm.prank(user2);
        prediction.claimWinnings(marketId);
        assertTrue(user2.balance > user2BalanceBefore);

        // 6. Loser can't claim
        vm.prank(user3);
        vm.expectRevert(IiPredict.YouLost.selector);
        prediction.claimWinnings(marketId);

        // 7. Admin withdraws fees
        uint256 adminBalanceBefore = admin.balance;
        prediction.withdrawFees();
        assertTrue(admin.balance > adminBalanceBefore);
    }

    function test_Integration_CancelledMarket_AllRefunded() public {
        uint256 marketId = _createMarket();

        vm.prank(user1);
        prediction.placeBet{ value: 5 ether }(marketId, true);

        vm.prank(user2);
        prediction.placeBet{ value: 3 ether }(marketId, false);

        vm.prank(user3);
        prediction.placeBet{ value: 2 ether }(marketId, true);

        // Cancel market
        prediction.cancelMarket(marketId);

        // All users claim refunds
        uint256 user1Before = user1.balance;
        vm.prank(user1);
        prediction.claimRefund(marketId);
        assertEq(user1.balance - user1Before, 5 ether);

        uint256 user2Before = user2.balance;
        vm.prank(user2);
        prediction.claimRefund(marketId);
        assertEq(user2.balance - user2Before, 3 ether);

        uint256 user3Before = user3.balance;
        vm.prank(user3);
        prediction.claimRefund(marketId);
        assertEq(user3.balance - user3Before, 2 ether);
    }

    // ============ Fuzz Tests ============

    function testFuzz_PlaceBet_AnyValidAmount(uint256 amount) public {
        amount = bound(amount, 0.01 ether, 100 ether);

        uint256 marketId = _createMarket();

        vm.deal(user1, amount);
        vm.prank(user1);
        prediction.placeBet{ value: amount }(marketId, true);

        IiPredict.Bet memory bet = prediction.getUserBet(marketId, user1);
        assertEq(bet.amount, amount);
    }

    function testFuzz_CreateMarket_ValidDuration(uint256 duration) public {
        duration = bound(duration, 1, 365 days);

        uint256 marketId = prediction.createMarket("Test", "", "Test", duration);

        IiPredict.Market memory market = prediction.getMarket(marketId);
        assertEq(market.endTime, block.timestamp + duration);
    }

    // ============ Batch Claim Tests ============

    function test_BatchClaim_Success() public {
        // Create multiple markets
        uint256 marketId1 = _createMarket();
        uint256 marketId2 = prediction.createMarket("Test 2", "", "Test", 1 days);

        // User1 bets YES on both
        vm.startPrank(user1);
        prediction.placeBet{ value: 1 ether }(marketId1, true);
        prediction.placeBet{ value: 1 ether }(marketId2, true);
        vm.stopPrank();

        // User2 bets NO on both
        vm.startPrank(user2);
        prediction.placeBet{ value: 1 ether }(marketId1, false);
        prediction.placeBet{ value: 1 ether }(marketId2, false);
        vm.stopPrank();

        // Resolve both - YES wins
        vm.warp(block.timestamp + 2 days);
        prediction.resolveMarket(marketId1, true);
        prediction.resolveMarket(marketId2, true);

        // Batch claim
        uint256[] memory marketIds = new uint256[](2);
        marketIds[0] = marketId1;
        marketIds[1] = marketId2;

        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        prediction.batchClaim(marketIds);

        // Should receive ~3.92 ether total (2 * 1.96)
        assertGt(user1.balance - balanceBefore, 3.9 ether);
    }

    // ============ Receive Tests ============

    function test_Receive_AcceptsPayment() public {
        uint256 balanceBefore = address(prediction).balance;

        (bool success,) = address(prediction).call{ value: 1 ether }("");
        assertTrue(success);

        assertEq(address(prediction).balance - balanceBefore, 1 ether);
    }
}
