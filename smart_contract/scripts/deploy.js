const hre = require("hardhat");

async function main() {
	const EveryFirst = await hre.ethers.getContractFactory("EveryFirst");
	const everyFirst = await EveryFirst.deploy();
	// 在 ethers v6 中不再需要 .deployed()
	console.log("EveryFirst 部署中...");
	// 等待区块确认
	await everyFirst.waitForDeployment();
	// 获取合约地址
	const contractAddress = await everyFirst.getAddress();
	console.log("EveryFirst 已部署到地址:", contractAddress);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
