import { useState } from "react";
import { useWeb3 } from "../stores/web3";

type Props = {
	onAdd?: () => void
}

const Navbar = ({ onAdd }: Props) => {
	const { address, connect, connecting, disconnect } = useWeb3();
	const [menuOpen, setMenuOpen] = useState(false);
	const short = address ? `${address.slice(0,6)}...${address.slice(-4)}` : null;

	function onMainButtonClick() {
		if (!address) {
			void connect();
		} else {
			setMenuOpen(v => !v);
		}
	}

	return (
		<div className="navbar" style={{ position: 'relative' }}>
			<div className="brand">EveryFirst</div>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
				<button className="btn ghost" onClick={onAdd}>+ 新建便条</button>
				<button
					type="button"
					className={`btn glow ${menuOpen ? 'active' : ''}`}
					onClick={onMainButtonClick}
					disabled={connecting}
				>
					{address ? short : (connecting ? '连接中...' : '连接钱包')}
				</button>
				{menuOpen && address && (
					<div className="menu card" style={{ position: 'absolute', right: 16, top: 58 }}>
						<button className="menu-item" onClick={() => { disconnect(); setMenuOpen(false); }}>退出连接</button>
					</div>
				)}
			</div>
		</div>
	)
}

export default Navbar;