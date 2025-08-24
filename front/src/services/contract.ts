import { ethers } from 'ethers';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let contract: ethers.Contract | null = null;
let EveryFirstAbi: any = null;

// 新增一个异步函数加载 ABI
async function loadAbi() {
  if (!EveryFirstAbi) {
    try {
      // 使用动态 import 加载 ABI 文件
      const module = await import('../../../smart_contract/artifacts/contracts/everyfirst.sol/EveryFirst.json');
      EveryFirstAbi = module.default;
    } catch (error) {
      console.error('Failed to load contract ABI:', error);
      throw new Error('Failed to load contract ABI');
    }
  }
  return EveryFirstAbi;
}

export function connectProvider(externalProvider?: any) {
  if (externalProvider) {
    provider = new ethers.BrowserProvider(externalProvider);
  } else {
    if ((window as any).ethereum) {
      provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      throw new Error('No injected Ethereum provider found');
    }
  }
  return provider;
}

export async function getSigner() {
  if (!provider) connectProvider();
  signer = await (provider as ethers.BrowserProvider).getSigner();
  return signer;
}

export async function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS not set');
  
  // 确保 ABI 已加载
  if (!EveryFirstAbi) {
    await loadAbi();
  }
  
  // 使用 Interface 来确保 ABI 被正确解析
  const contractInterface = new ethers.Interface(EveryFirstAbi.abi);
  
  if (signerOrProvider) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, contractInterface, signerOrProvider);
  } else if (signer) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, contractInterface, signer);
  } else if (provider) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, contractInterface, provider);
  } else {
    throw new Error('No provider or signer available');
  }
  return contract;
}

// 导出 loadAbi 函数供外部使用
export { loadAbi };
export async function estimateGasMint(to: string, tokenURI: string, digest: string, date: number) {
  const signerLocal = await getSigner();
  const contractWithSigner = await getContract(signerLocal);
  return await contractWithSigner.mintWithURI.estimateGas(
    to, 
    tokenURI, 
    digest, 
    BigInt(date)
  );
}

export async function mintWithURI(to: string, tokenURI: string, digest: string, date: number) {
  if (!CONTRACT_ADDRESS) {
    const mockHash = '0x' + Math.floor(Math.random() * 1e16).toString(16).padStart(64, '0');
    const tx = {
      hash: mockHash,
      wait: async () => ({ status: 1, transactionHash: mockHash }),
    } as any;
    
    setTimeout(() => {
      if ((window as any).__everyfirst_onNoteMinted) {
        (window as any).__everyfirst_onNoteMinted(1, to, digest, date);
      }
    }, 500);
    return tx;
  }

  console.log('开始铸造流程，参数：', { to, tokenURI, digest, date });

  try {
    const signerLocal = await getSigner();
    const c = await getContract(signerLocal);
    const address = await signerLocal.getAddress();
    const MINTER_ROLE = ethers.id("MINTER_ROLE");
  
    console.log('检查权限，参数：', { 
      role: MINTER_ROLE,
      address,
      contractAddress: CONTRACT_ADDRESS 
    });

    // 检查权限 - 使用合约实例直接调用
    const hasMinterRole = await c.hasRole(MINTER_ROLE, address).catch(async () => {
      // 如果直接调用失败，使用低级调用
      const hasRoleData = c.interface.encodeFunctionData('hasRole', [MINTER_ROLE, address]);
      const provider = signerLocal.provider;
      if (!provider) throw new Error('No provider available');
      const result = await provider.call({
        to: CONTRACT_ADDRESS,
        data: hasRoleData
      });
      return result !== '0x' && result !== '0x0000000000000000000000000000000000000000000000000000000000000000';
    });

    console.log('权限检查结果:', hasMinterRole);
    
    if (!hasMinterRole) {
      throw new Error('当前钱包地址没有铸造权限 (MINTER_ROLE)');
    }
    
    console.log('开始调用 mintWithURI...');
    
    // 尝试直接调用合约方法
    const tx = await c.mintWithURI(
      to,                 // address
      tokenURI,          // string
      digest,            // bytes32
      BigInt(date)       // uint256
    ).catch(async (error) => {
      console.error('合约方法调用失败，尝试低级调用:', error);
      
      // 如果直接调用失败，使用低级调用
      const mintData = c.interface.encodeFunctionData('mintWithURI', [
        to, 
        tokenURI,
        digest,
        BigInt(date)
      ]);

      return signerLocal.sendTransaction({
        to: CONTRACT_ADDRESS,
        data: mintData,
        value: ethers.parseEther('0') // 明确指定 value 为 0
      });
    });

    console.log('铸造交易已发送:', tx);
    return tx;
  } catch (error: any) {
    console.error('铸造过程中出错:', error);
    if (error.message.includes('MINTER_ROLE')) {
      throw new Error('当前钱包地址没有铸造权限 (MINTER_ROLE)');
    } else if (error.message.includes('user rejected')) {
      throw new Error('用户取消了交易');
    } else {
      throw new Error(`铸造失败: ${error.message}`);
    }
  }
}

export async function onNoteMinted(callback: (tokenId: number, owner: string, digest: string, date: number) => void) {
  const c = await getContract();
  if (!c) throw new Error('Contract not initialized');
  c.on('NoteMinted', (tokenId: any, owner: string, digest: string, date: any) => {
    callback(Number(tokenId.toString()), owner, digest, Number(date.toString()));
  });
}

export async function offNoteMinted() {
  const c = await getContract();
  if (!c) return;
  c.removeAllListeners('NoteMinted');
}

// provide a fallback global registration when contract not available
export function __registerOnNoteMinted(callback: (tokenId: number, owner: string, digest: string, date: number) => void) {
  (window as any).__everyfirst_onNoteMinted = callback;
}

export function __unregisterOnNoteMinted() {
  delete (window as any).__everyfirst_onNoteMinted;
}
