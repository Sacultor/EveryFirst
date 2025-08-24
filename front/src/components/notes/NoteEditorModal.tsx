import { useState } from "react";
import { useNotes } from "../../stores/notes";
import ImageUploader from "./ImageUploader";
import MintDialog from "./MintDialog";

type Props = { onClose: () => void }

const NoteEditorModal = ({ onClose }: Props) => {
	const { addNote } = useNotes();
	const [title, setTitle] = useState("");
	const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
	const [content, setContent] = useState("");
	const [mood, setMood] = useState("");
	const [location, setLocation] = useState("");
	const [images, setImages] = useState<string[]>([]);
	const [showMint, setShowMint] = useState(false);
	const [mintArgs, setMintArgs] = useState({ tokenURI: '', digest: '', date: '', to: '' });

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

	async function handleMintClick() {
		if (!title.trim()) return;
		// save draft locally
		const note = {
			title,
			content,
			date: new Date(date).toISOString(),
			mood,
			location,
			images: images.length > 0 ? images : undefined,
		};
		const id = addNote(note);
		// call backend to pin metadata; fall back to local generation if backend not available
		const backend = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5175';
		let tokenURI = '';
		let digest = '';
		try {
			const resp = await fetch(`${backend}/api/notes/${id}/pin`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(note)
			});
			if (resp.ok) {
				const data = await resp.json();
				if (data?.tokenURI) {
					tokenURI = data.tokenURI;
					digest = data.digest || '';
				}
			}
		} catch (err) {
			// ignore and fall back to local metadata generation
		}
		if (!tokenURI) {
			// local metadata generation (so UX works without backend)
			try {
				// compute simple metadata and a keccak256 digest using ethers if available
				let json = JSON.stringify({
					name: note.title,
					description: note.content || '',
					image: note.images && note.images.length ? note.images[0] : undefined,
					attributes: [
						{ trait_type: 'date', value: note.date },
						{ trait_type: 'mood', value: note.mood || '' },
						{ trait_type: 'location', value: note.location || '' }
					].filter(a => a.value !== undefined && a.value !== '')
				});
				// create pseudo-cid by hashing
				const hashBuf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
				const hashArray = Array.from(new Uint8Array(hashBuf));
				const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
				tokenURI = `ipfs://${hex.slice(0,46)}`;
				// keccak256 digest using ethers if available, otherwise use sha256 as hex prefixed
				try {
					// eslint-disable-next-line @typescript-eslint/no-var-requires
					const { ethers } = require('ethers');
					digest = ethers.keccak256(ethers.toUtf8Bytes(json));
				} catch (e) {
					digest = '0x' + hex.slice(0,64);
				}
			} catch (e) {
				console.error('local metadata gen failed', e);
				alert('生成元数据失败（本地）：' + String(e));
				return;
			}
		}
		setMintArgs({ tokenURI, digest, date: note.date, to: '' });
		setShowMint(true);
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
					<button className="btn" onClick={handleMintClick}>生成并铸造</button>
				</div>
				<MintDialog open={showMint} onClose={() => setShowMint(false)} tokenURI={mintArgs.tokenURI} digest={mintArgs.digest} date={mintArgs.date} to={mintArgs.to} onMinted={(_tokenId, _txHash) => {
					// update note with tokenId/txHash in store - TODO
					setShowMint(false);
				}} />
			</div>
		</div>
	)
}

export default NoteEditorModal;


