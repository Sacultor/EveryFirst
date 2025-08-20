type Props = {
	onAdd?: () => void
}

const Navbar = ({ onAdd }: Props) => {
	return (
		<div className="navbar">
			<div className="brand">EveryFirst</div>
			<div style={{ display: 'flex', gap: 8 }}>
				<button className="btn ghost" onClick={onAdd}>+ 新建便条</button>
				<button className="btn">连接钱包</button>
			</div>
		</div>
	)
}

export default Navbar;