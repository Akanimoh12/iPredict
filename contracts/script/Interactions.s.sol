// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/iPredict.sol";

/**
 * @title PlaceBetScript
 * @notice Script to place a bet on a market
 */
contract PlaceBetScript is Script {
    function run(address _ipredict, uint256 _marketId, bool _isYes) external payable {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 betAmount = vm.envOr("BET_AMOUNT", uint256(0.1 ether));

        iPredict ipredict = iPredict(payable(_ipredict));

        console.log("========================================");
        console.log("Placing bet...");
        console.log("Contract:", _ipredict);
        console.log("Market ID:", _marketId);
        console.log("Betting:", _isYes ? "YES" : "NO");
        console.log("Amount:", betAmount);
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        ipredict.placeBet{value: betAmount}(_marketId, _isYes);

        vm.stopBroadcast();

        console.log("");
        console.log("BET PLACED SUCCESSFULLY!");

        (uint256 yesPercent, uint256 noPercent) = ipredict.getMarketOdds(_marketId);
        console.log("New Odds - YES:", yesPercent);
        console.log("New Odds - NO:", noPercent);
        console.log("========================================");
    }
}

/**
 * @title ResolveMarketScript
 * @notice Script to resolve a market with an outcome
 */
contract ResolveMarketScript is Script {
    function run(address _ipredict, uint256 _marketId, bool _outcome) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        iPredict ipredict = iPredict(payable(_ipredict));

        console.log("========================================");
        console.log("Resolving market...");
        console.log("Contract:", _ipredict);
        console.log("Market ID:", _marketId);
        console.log("Outcome:", _outcome ? "YES wins" : "NO wins");
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        ipredict.resolveMarket(_marketId, _outcome);

        vm.stopBroadcast();

        console.log("");
        console.log("MARKET RESOLVED!");
        console.log("========================================");
    }
}

/**
 * @title ClaimWinningsScript
 * @notice Script to claim winnings from a resolved market
 */
contract ClaimWinningsScript is Script {
    function run(address _ipredict, uint256 _marketId) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address claimer = vm.addr(deployerPrivateKey);

        iPredict ipredict = iPredict(payable(_ipredict));

        console.log("========================================");
        console.log("Claiming winnings...");
        console.log("Contract:", _ipredict);
        console.log("Market ID:", _marketId);
        console.log("Claimer:", claimer);
        console.log("========================================");

        uint256 balanceBefore = claimer.balance;

        vm.startBroadcast(deployerPrivateKey);

        ipredict.claimWinnings(_marketId);

        vm.stopBroadcast();

        uint256 balanceAfter = claimer.balance;

        console.log("");
        console.log("WINNINGS CLAIMED!");
        console.log("Amount received:", balanceAfter - balanceBefore);

        IiPredict.UserStats memory stats = ipredict.getUserStats(claimer);
        console.log("Total Points:", stats.totalPoints);
        console.log("Total Winnings:", stats.totalWinnings);
        console.log("========================================");
    }
}

/**
 * @title CheckMarketScript
 * @notice Script to check market details
 */
contract CheckMarketScript is Script {
    function run(address _ipredict, uint256 _marketId) external view {
        iPredict ipredict = iPredict(payable(_ipredict));

        console.log("========================================");
        console.log("MARKET DETAILS");
        console.log("========================================");

        IiPredict.Market memory market = ipredict.getMarket(_marketId);

        console.log("Market ID:", market.id);
        console.log("Question:", market.question);
        console.log("Category:", market.category);
        console.log("End Time:", market.endTime);
        console.log("Total YES Bets:", market.totalYesBets);
        console.log("Total NO Bets:", market.totalNoBets);
        console.log("YES Bettors:", market.yesCount);
        console.log("NO Bettors:", market.noCount);
        console.log("Resolved:", market.resolved);
        console.log("Cancelled:", market.cancelled);

        if (market.resolved) {
            console.log("Outcome:", market.outcome ? "YES" : "NO");
        }

        (uint256 yesPercent, uint256 noPercent) = ipredict.getMarketOdds(_marketId);
        console.log("Odds - YES:", yesPercent);
        console.log("Odds - NO:", noPercent);
        console.log("========================================");
    }
}

/**
 * @title CheckContractScript
 * @notice Script to check overall contract status
 */
contract CheckContractScript is Script {
    function run(address _ipredict) external view {
        iPredict ipredict = iPredict(payable(_ipredict));

        console.log("========================================");
        console.log("CONTRACT STATUS");
        console.log("========================================");
        console.log("Address:", _ipredict);
        console.log("Admin:", ipredict.admin());
        console.log("Platform Fee:", ipredict.platformFee(), "basis points");
        console.log("Market Count:", ipredict.marketCount());
        console.log("Accumulated Fees:", ipredict.accumulatedFees());
        console.log("Paused:", ipredict.paused());
        console.log("Contract Balance:", _ipredict.balance);
        console.log("========================================");

        uint256[] memory activeMarkets = ipredict.getActiveMarkets();
        console.log("Active Markets:", activeMarkets.length);
        console.log("========================================");
    }
}
