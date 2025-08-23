require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
	solidity: "0.8.20",
	networks: {
		hardhat: {},
		sepolia: {
			url: process.env.RPC_URL || "",
			accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
		}
	}
};
