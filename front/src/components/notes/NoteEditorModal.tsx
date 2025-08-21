import { useState, useCallback } from "react";
import { useNotes } from "../../stores/notes";
import ImageUploader from "./ImageUploader";

type Props = { onClose: () => void }

const NoteEditorModal = ({ onClose }: Props) => {
	const { addNote } = useNotes();
	const [title, setTitle] = useState("");
	const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
	const [content, setContent] = useState("");
	const [mood, setMood] = useState("");
	const [location, setLocation] = useState("");
	const [images, setImages] = useState<string[]>([]);

	function save() {
		if (!title.trim()) return;
		addNote({
			title,
			content,
			date: new Date(date).toISOString(),
			mood,
			location,
			images: images.length > 0 ? images : undefined,
		});
		onClose();
	}

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div className="modal" onClick={e => e.stopPropagation()}>
				<h3>新建便条</h3>
				<div className="form-row">
					<input className="input" placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} />
				</div>
				<div className="form-row double">
					<input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
					<input className="input" placeholder="心情（可选）" value={mood} onChange={e => setMood(e.target.value)} />
				</div>
				<div className="form-row">
					<input className="input" placeholder="地点（可选）" value={location} onChange={e => setLocation(e.target.value)} />
				</div>
				<div className="form-row">
					<textarea className="textarea" placeholder="写点什么吧..." value={content} onChange={e => setContent(e.target.value)} />
				</div>
				<ImageUploader 
					onImagesChange={setImages}
					initialImages={images}
				/>
				<div className="modal-actions">
					<button className="btn secondary" onClick={onClose}>取消</button>
					<button className="btn" onClick={save}>保存</button>
				</div>
			</div>
		</div>
	)
}

export default NoteEditorModal;


