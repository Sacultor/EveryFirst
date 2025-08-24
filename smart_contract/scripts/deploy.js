const hre = require("hardhat");

async function main() {
	const EveryFirst = await hre.ethers.getContractFactory("EveryFirst");
	const everyFirst = await EveryFirst.deploy();
	console.log("EveryFirst 部署中...");
	await everyFirst.waitForDeployment();
	const contractAddress = await everyFirst.getAddress();
	console.log("EveryFirst 已部署到地址:", contractAddress);
	
	// 自动授予测试账户 MINTER_ROLE 权限
	const MINTER_ROLE = hre.ethers.id("MINTER_ROLE");
	const [deployer] = await hre.ethers.getSigners();
	const testAccounts = [
		"0xd0c27979aa49d0391C3Be2A2Afcd496c8798027", // 修改为你的钱包地址
	];
	
	for (const account of testAccounts) {
		console.log(`授予地址 ${account} MINTER_ROLE 权限...`);
		await everyFirst.grantRole(MINTER_ROLE, account);
		console.log(`已授权完成`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
