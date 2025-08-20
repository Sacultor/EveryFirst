import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BrowserProvider } from "ethers";

export type Web3State = {
	address: string | null;
	chainId: number | null;
	connecting: boolean;
	connect: () => Promise<void>;
	disconnect: () => void;
	switchAccount: () => Promise<void>;
};

const Web3Context = createContext<Web3State | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
	const [address, setAddress] = useState<string | null>(null);
	const [chainId, setChainId] = useState<number | null>(null);
	const [connecting, setConnecting] = useState(false);

	const connect = useCallback(async () => {
		if (typeof window === 'undefined') return;
		const eth = (window as any).ethereum;
		if (!eth) {
			alert('未检测到 MetaMask。请先安装浏览器扩展。');
			return;
		}
		try {
			setConnecting(true);
			// 每次连接都触发权限确认弹窗，避免静默复用上次授权
			await eth.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
			const provider = new BrowserProvider(eth);
			const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
			const network = await provider.getNetwork();
			setAddress(accounts?.[0] ?? null);
			setChainId(Number(network.chainId));
			// 监听账号/网络变更
			eth.on?.('accountsChanged', (accs: string[]) => setAddress(accs?.[0] ?? null));
			eth.on?.('chainChanged', () => window.location.reload());
		} catch (err) {
			console.error(err);
			alert('连接失败，请重试。');
		} finally {
			setConnecting(false);
		}
	}, []);

	const disconnect = useCallback(() => {
		setAddress(null);
		setChainId(null);
	}, []);

	const switchAccount = useCallback(async () => {
		if (typeof window === 'undefined') return;
		const eth = (window as any).ethereum;
		if (!eth) return;
		try {
			await eth.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
			const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
			setAddress(accounts?.[0] ?? null);
		} catch (e) {
			console.error(e);
		}
	}, []);

	const value: Web3State = useMemo(() => ({ address, chainId, connecting, connect, disconnect, switchAccount }), [address, chainId, connecting, connect, disconnect, switchAccount]);
	return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export function useWeb3(): Web3State {
	const ctx = useContext(Web3Context);
	if (!ctx) throw new Error('useWeb3 must be used within Web3Provider');
	return ctx;
}


