// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/iPredict.sol";

contract DeployiPredict is Script {
    function run() external returns (iPredict) {
        // Load private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get deployer address for logging
        address deployer = vm.addr(deployerPrivateKey);

        console.log("========================================");
        console.log("Deploying iPredict...");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("========================================");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy contract
        iPredict ipredict = new iPredict();

        vm.stopBroadcast();

        // Log deployment info
        console.log("");
        console.log("========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("========================================");
        console.log("iPredict deployed to:", address(ipredict));
        console.log("Admin:", ipredict.admin());
        console.log("Platform Fee:", ipredict.platformFee(), "basis points (2%)");
        console.log("========================================");

        return ipredict;
    }
}
