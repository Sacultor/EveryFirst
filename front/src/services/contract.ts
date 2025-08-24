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
  // If no contract address configured, return a mock tx and emit NoteMinted locally
  if (!CONTRACT_ADDRESS) {
    const mockHash = '0x' + Math.floor(Math.random() * 1e16).toString(16).padStart(64, '0');
    // simulate ethers transaction-like object
    const tx = {
      hash: mockHash,
      wait: async () => ({ status: 1, transactionHash: mockHash }),
    } as any;
    // trigger fake NoteMinted event after a short delay
    setTimeout(() => {
      // prefer calling global registered handler for mock events
      if ((window as any).__everyfirst_onNoteMinted) {
        (window as any).__everyfirst_onNoteMinted(1, to, digest, date);
      } else {
        // as a last resort, try to emit on contract if available
        try {
          const c = getContract();
          if (c && c.emit) c.emit('NoteMinted', 1, to, digest, date);
        } catch (e) {}
      }
    }, 500);
    return tx;
  }
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

// provide a fallback global registration when contract not available
export function __registerOnNoteMinted(callback: (tokenId: number, owner: string, digest: string, date: number) => void) {
  (window as any).__everyfirst_onNoteMinted = callback;
}

export function __unregisterOnNoteMinted() {
  delete (window as any).__everyfirst_onNoteMinted;
}
