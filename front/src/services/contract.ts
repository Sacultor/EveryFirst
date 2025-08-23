import { ethers } from 'ethers';
const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.Signer | null = null;
let contract: ethers.Contract | null = null;
let EveryFirstAbi: any = null;

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

export function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  if (!CONTRACT_ADDRESS) throw new Error('VITE_CONTRACT_ADDRESS not set');
  // lazy-load ABI from build artifacts if not loaded
  if (!EveryFirstAbi) {
    // try dynamic require relative to project root
    // this will work in dev environment where artifacts are present
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    EveryFirstAbi = require('../../../smart_contract/artifacts/contracts/everyfirst.sol/EveryFirst.json');
  }
  if (signerOrProvider) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, EveryFirstAbi.abi, signerOrProvider as any);
  } else if (signer) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, EveryFirstAbi.abi, signer as any);
  } else if (provider) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, EveryFirstAbi.abi, provider as any);
  } else {
    throw new Error('No provider or signer available');
  }
  return contract;
}

export async function estimateGasMint(to: string, tokenURI: string, digest: string, date: number) {
  const signerLocal = await getSigner();
  const contractWithSigner = getContract(signerLocal) as ethers.Contract;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (contractWithSigner.estimateGas as any)['mintWithURI'](to, tokenURI, digest, date);
}

export async function mintWithURI(to: string, tokenURI: string, digest: string, date: number) {
  const signerLocal = await getSigner();
  const c = getContract(signerLocal);
  const tx = await c.mintWithURI(to, tokenURI, digest, date);
  return tx;
}

export function onNoteMinted(callback: (tokenId: number, owner: string, digest: string, date: number) => void) {
  const c = getContract();
  if (!c) throw new Error('Contract not initialized');
  c.on('NoteMinted', (tokenId: any, owner: string, digest: string, date: any) => {
    callback(Number(tokenId.toString()), owner, digest, Number(date.toString()));
  });
}

export function offNoteMinted() {
  const c = getContract();
  if (!c) return;
  c.removeAllListeners('NoteMinted');
}
