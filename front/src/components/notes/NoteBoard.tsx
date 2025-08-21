import { useMemo } from "react";
import { useNotes } from "../../stores/notes.tsx";
import type { Note } from "../../stores/notes.tsx";
import { FiImage } from "react-icons/fi";

type Props = {
	onAdd?: () => void
}

const NoteBoard = ({ onAdd }: Props) => {
	const { notes, selectedDate, selectedNoteId, setSelectedNoteId } = useNotes();

	const filtered = useMemo(() => {
		if (!selectedDate) return notes;
		const target = new Date(selectedDate);
		return notes.filter((n: Note) => {
			const d = new Date(n.date);
			return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate();
		});
	}, [notes, selectedDate]);

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
				<h2 style={{ margin: 0, fontSize: 18 }}>我的便签</h2>
				<button className="btn" onClick={onAdd}>+ 新建便条</button>
			</div>
			<div className="note-grid">
				{filtered.map((note: Note) => (
					<div
						className="card note-card"
						key={note.id}
						onMouseEnter={() => setSelectedNoteId(note.id)}
						onMouseLeave={() => setSelectedNoteId(null)}
						onClick={() => setSelectedNoteId(note.id)}
						style={{ position: 'relative', background: 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255, 244, 248, 0.9))' }}
					>
						{selectedNoteId === note.id && (
							<div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
								<ParticleHalo />
							</div>
						)}
						<div className="note-date">{new Date(note.date).toLocaleDateString()}</div>
						<h3 className="note-title">{note.title}</h3>
						{note.images && note.images.length > 0 && (
							<div className="note-images">
								{note.images.slice(0, 2).map((img, idx) => (
									<div key={idx} className="note-image-container">
										<img src={img} alt={`附件 ${idx + 1}`} className="note-image" />
									</div>
								))}
								{note.images.length > 2 && (
									<div className="image-counter">
										<FiImage /> +{note.images.length - 2}
									</div>
								)}
							</div>
						)}
						<p className="note-content">{note.content}</p>
					</div>
				))}
				{filtered.length === 0 && (
					<div className="card note-card" style={{ gridColumn: '1/-1', textAlign: 'center' }}>
						暂无记录，点击右上角「新建便条」开始记录你的第一次。
					</div>
				)}
			</div>
		</div>
	)
}

export default NoteBoard;

// 简单的悬浮粒子效果（CSS 动画）
const ParticleHalo = () => {
    const dots = new Array(24).fill(0);
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {dots.map((_, i) => {
                const delay = (i % 12) * 0.12;
                const size = 3 + (i % 4);
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const anim = {
                    position: 'absolute' as const,
                    left: `${left}%`,
                    top: `${top}%`,
                    width: size,
                    height: size,
                    background: 'rgba(255,122,162,.6)',
                    borderRadius: 999,
                    filter: 'blur(0.5px)',
                    animation: `float ${4 + (i % 5)}s ease-in-out ${delay}s infinite alternate`
                };
                return <span key={i} style={anim} />
            })}
            <style>{`@keyframes float { from { transform: translate3d(-6px,-6px,0) } to { transform: translate3d(6px,6px,0) } }`}</style>
        </div>
    )
}
