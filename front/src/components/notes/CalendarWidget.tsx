import { useMemo } from "react";
import { useNotes } from "../../stores/notes.tsx";

const WEEK_HEAD = ["日","一","二","三","四","五","六"];

const CalendarWidget = () => {
	const { month, setMonth, notes, selectedDate, setSelectedDate } = useNotes();

	// Sakura falling effect overlay
	// 仅在日历侧边渲染一个轻量的樱花飘落层

	const view = useMemo(() => {
		const start = new Date(month.getFullYear(), month.getMonth(), 1);
		const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
		const firstIndex = start.getDay();
		const days: { date: Date; inMonth: boolean; count: number }[] = [];
		// prev padding
		for (let i = 0; i < firstIndex; i++) {
			const d = new Date(start);
			d.setDate(d.getDate() - (firstIndex - i));
			days.push({ date: d, inMonth: false, count: 0 });
		}
		// current month
		const counts = new Map<string, number>();
		notes.forEach(n => {
			const d = new Date(n.date);
			if (d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear()) {
				const key = d.toDateString();
				counts.set(key, (counts.get(key) || 0) + 1);
			}
		});
		for (let d = 1; d <= end.getDate(); d++) {
			const cur = new Date(month.getFullYear(), month.getMonth(), d);
			const key = cur.toDateString();
			days.push({ date: cur, inMonth: true, count: counts.get(key) || 0 });
		}
		// next padding
		while (days.length % 7 !== 0) {
			const last = days[days.length - 1].date;
			const nxt = new Date(last);
			nxt.setDate(nxt.getDate() + 1);
			days.push({ date: nxt, inMonth: false, count: 0 });
		}
		return days;
	}, [month, notes]);

	const monthText = `${month.getFullYear()}年 ${month.getMonth() + 1}月`;

	return (
		<div className="calendar" style={{ position: 'relative', overflow: 'hidden' }}>
			<header>
				<button className="btn secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>{"<"}</button>
				<h3>{monthText}</h3>
				<button className="btn secondary" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>{">"}</button>
			</header>
			<div className="calendar-grid">
				{WEEK_HEAD.map(w => (
					<div className="calendar-head" key={w}>{w}</div>
				))}
				{view.map((cell, idx) => {
					const isSame = selectedDate && new Date(selectedDate).toDateString() === cell.date.toDateString();
					return (
						<div
							key={idx}
							className={`calendar-cell ${cell.inMonth ? '' : 'muted'} ${isSame ? 'selected' : ''}`}
							onClick={() => setSelectedDate(cell.date)}
						>
							{cell.date.getDate()}
							{cell.count > 0 && <div className="dot" />}
						</div>
					)
				})}
			</div>
			<SakuraLayer />
		</div>
	)
}

export default CalendarWidget;

// 轻量樱花飘落层，实现十几片花瓣下落循环
const SakuraLayer = () => {
    const petals = new Array(14).fill(0);
    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {petals.map((_, i) => {
                const duration = 8 + (i % 6);
                const delay = (i % 8) * 0.6;
                const left = Math.random() * 100;
                const size = 6 + (i % 6);
                const style: React.CSSProperties = {
                    position: 'absolute',
                    left: `${left}%`,
                    top: -10,
                    width: size,
                    height: size,
                    background: 'radial-gradient(circle at 30% 30%, #ffd1dc 0%, #ff9db6 60%, #ff7aa2 100%)',
                    borderRadius: '60% 40% 60% 40% / 60% 40% 60% 40%',
                    filter: 'blur(0.2px)',
                    animation: `petalFall ${duration}s linear ${delay}s infinite`,
                };
                return <span key={i} style={style} />
            })}
            <style>{`
                @keyframes petalFall {
                    0% { transform: translate3d(0,-5px,0) rotate(0deg); opacity: .9; }
                    50% { transform: translate3d(-30px,200px,0) rotate(120deg); opacity: .8; }
                    100% { transform: translate3d(30px,420px,0) rotate(260deg); opacity: .0; }
                }
            `}</style>
        </div>
    );
}


