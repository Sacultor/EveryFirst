import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Note = {
	id: string;
	title: string;
	content: string;
	date: string; // ISO string
	mood?: string;
	location?: string;
	images?: string[]; // Array of image URLs or base64 strings
};

type NotesCtx = {
	notes: Note[];
	addNote: (input: Omit<Note, "id">) => void;
	month: Date;
	setMonth: (d: Date) => void;
	selectedDate: Date | null;
	setSelectedDate: (d: Date | null) => void;
	selectedNoteId: string | null;
	setSelectedNoteId: (id: string | null) => void;
};

const NotesContext = createContext<NotesCtx | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
	const [notes, setNotes] = useState<Note[]>(() => loadNotes());
	const [month, setMonth] = useState<Date>(new Date());
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

	useEffect(() => {
		saveNotes(notes);
	}, [notes]);

	function addNote(input: Omit<Note, "id">) {
		const id = Math.random().toString(36).slice(2);
		const newNote: Note = { id, ...input };
		setNotes((prev) => [newNote, ...prev]);
		setSelectedNoteId(id);
		setSelectedDate(new Date(input.date));
		return id;
	}

	const value: NotesCtx = useMemo(
		() => ({
			notes,
			addNote,
			month,
			setMonth,
			selectedDate,
			setSelectedDate,
			selectedNoteId,
			setSelectedNoteId,
		}),
		[notes, month, selectedDate, selectedNoteId]
	);

	return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesCtx {
	const ctx = useContext(NotesContext);
	if (!ctx) throw new Error("useNotes must be used within NotesProvider");
	return ctx;
}

function loadNotes(): Note[] {
	try {
		const raw = localStorage.getItem("ef_notes");
		if (raw) return JSON.parse(raw) as Note[];
		return demoNotes;
	} catch {
		return demoNotes;
	}
}

function saveNotes(list: Note[]) {
	try {
		localStorage.setItem("ef_notes", JSON.stringify(list));
	} catch {}
}

const demoNotes: Note[] = [
	{
		id: "1",
		title: "第一次潜水",
		content: "在巴厘岛，水很蓝。",
		date: new Date().toISOString(),
		mood: "Excited",
		location: "Bali",
	},
	{
		id: "2",
		title: "第一次写 DApp",
		content: "Hello Web3！",
		date: new Date(Date.now() - 86400000 * 3).toISOString(),
	},
	{
		id: "3",
		title: "第一次爬雪山",
		content: "很冷但很爽。",
		date: new Date(Date.now() - 86400000 * 10).toISOString(),
	},
];


