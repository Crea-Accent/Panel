/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Download, File, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

const DOCUMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];

export default function Documents({ basePath, client }: { basePath: string; client: string }) {
	const [files, setFiles] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const load = async () => {
		setLoading(true);

		const docsPath = `${basePath}/${client}/documents`;
		const res = await fetch(`/api/files?view=${encodeURIComponent(docsPath)}`);

		const data: FileEntry[] = await res.json();

		const filtered = data.filter((f) => f.type === 'file' && DOCUMENT_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));

		setFiles(filtered);
		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	const upload = async (file: File) => {
		const fd = new FormData();
		fd.append('file', file);
		fd.append('client', client);
		fd.append('kind', 'documents');

		await fetch('/api/files/upload', {
			method: 'POST',
			body: fd,
		});

		await load();
	};

	const download = (path: string) => {
		const url = `/api/files/download?path=${encodeURIComponent(path)}`;
		const a = document.createElement('a');
		a.href = url;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const sectionBase = 'bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden';

	return (
		<section className='space-y-4'>
			<header className='flex items-center gap-3'>
				<div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600'>
					<File size={20} />
				</div>
				<div>
					<h2 className='text-xl font-semibold'>Documents</h2>
					<p className='text-sm text-zinc-500'>PDF, Word and Excel files</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='.pdf,.doc,.docx,.xls,.xlsx' className='hidden' onChange={(e) => e.target.files && upload(e.target.files[0])} />

			<div className={sectionBase}>
				{/* Header */}
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center p-5'>
					<span className='font-medium'>Files ({files.length})</span>
					{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className='px-5 pb-5 space-y-4'>
							{/* Upload */}
							<div className='flex justify-end'>
								<button onClick={() => inputRef.current?.click()} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:opacity-90 transition'>
									<Upload size={14} />
									Upload
								</button>
							</div>

							{/* Loading */}
							{loading && <div className='text-sm text-zinc-500'>Loading documents…</div>}

							{/* Empty */}
							{!loading && files.length === 0 && <div className='text-sm text-zinc-500 border border-dashed border-zinc-300 rounded-xl p-6 text-center'>No documents found.</div>}

							{/* Files */}
							{!loading &&
								files.length > 0 &&
								files.map((file, index) => (
									<motion.div
										key={file.path}
										initial={{
											opacity: 0,
											y: 5,
										}}
										animate={{
											opacity: 1,
											y: 0,
										}}
										transition={{
											delay: index * 0.03,
										}}
										className='flex justify-between items-center p-4 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-white hover:shadow-sm transition'>
										<div className='flex items-center gap-3 min-w-0'>
											<File size={16} className='text-zinc-500' />
											<span className='truncate text-sm'>{file.name}</span>
										</div>

										<button onClick={() => download(file.path)} className='flex items-center gap-1 text-sm text-zinc-600 hover:text-blue-600 transition'>
											<Download size={14} />
											Download
										</button>
									</motion.div>
								))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
