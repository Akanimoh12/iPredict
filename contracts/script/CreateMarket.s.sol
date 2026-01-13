// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/iPredict.sol";

/**
 * @title CreateTestMarket
 * @notice Script to create a test market after deployment
 */
contract CreateTestMarket is Script {
    function run(address _ipredict) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        iPredict ipredict = iPredict(payable(_ipredict));

        console.log("========================================");
        console.log("Creating test market...");
        console.log("Contract:", _ipredict);
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        uint256 marketId = ipredict.createMarket(
            "Will Bitcoin reach $150,000 by February 2026?",
            "https://cryptologos.cc/logos/bitcoin-btc-logo.png",
            "Crypto",
            30 days
        );

        vm.stopBroadcast();

        console.log("");
        console.log("========================================");
        console.log("MARKET CREATED!");
        console.log("========================================");
        console.log("Market ID:", marketId);

        IiPredict.Market memory market = ipredict.getMarket(marketId);
        console.log("Question:", market.question);
        console.log("Category:", market.category);
        console.log("End Time:", market.endTime);
        console.log("========================================");
    }
}
