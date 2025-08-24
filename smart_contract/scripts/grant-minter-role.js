const hre = require("hardhat");

async function main() {
    // 合约地址
    const CONTRACT_ADDRESS = "0x19c51B19ce4dD343199324a0BF3a50208396D4d7";
    
    // 要授权的钱包地址
    const WALLET_TO_GRANT = "0xd0c27979aa49d0391C3Be2A2Afcd496c8798027";
    
    try {
        // 获取合约实例
        const EveryFirst = await hre.ethers.getContractFactory("EveryFirst");
        const contract = await EveryFirst.attach(CONTRACT_ADDRESS);
        
        // 计算 MINTER_ROLE 的 hash
        const MINTER_ROLE = hre.ethers.id("MINTER_ROLE");
        console.log("MINTER_ROLE hash:", MINTER_ROLE);
        
        // 检查当前地址是否已有权限
        const hasRole = await contract.hasRole(MINTER_ROLE, WALLET_TO_GRANT);
        if (hasRole) {
            console.log(`地址 ${WALLET_TO_GRANT} 已经拥有 MINTER_ROLE 权限`);
            return;
        }
        
        // 授予权限
        console.log(`正在授予地址 ${WALLET_TO_GRANT} MINTER_ROLE 权限...`);
        const tx = await contract.grantRole(MINTER_ROLE, WALLET_TO_GRANT);
        console.log("交易已发送，等待确认...");
        console.log("交易哈希:", tx.hash);
        
        // 等待交易确认
        await tx.wait();
        console.log("交易已确认！权限授予成功！");
        
        // 再次检查权限
        const hasRoleAfter = await contract.hasRole(MINTER_ROLE, WALLET_TO_GRANT);
        console.log(`最终权限检查结果: ${hasRoleAfter}`);
        
    } catch (error) {
        console.error("执行过程中出错:", error);
        if (error.message.includes("access control")) {
            console.error("错误原因: 当前账户没有管理员权限，无法授予 MINTER_ROLE");
        }
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
