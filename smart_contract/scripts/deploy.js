const hre = require("hardhat");

async function main() {
	const EveryFirst = await hre.ethers.getContractFactory("EveryFirst");
	const everyFirst = await EveryFirst.deploy();
	await everyFirst.deployed();
	console.log("EveryFirst deployed to:", everyFirst.address);
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
