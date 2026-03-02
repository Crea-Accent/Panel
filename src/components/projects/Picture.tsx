/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Download, Image as ImageIcon, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export default function Pictures({ basePath, client }: { basePath: string; client: string }) {
	const [images, setImages] = useState<FileEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [open, setOpen] = useState(true);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const load = async () => {
		setLoading(true);

		const picsPath = `${basePath}/${client}/pictures`;

		const res = await fetch(`/api/files?view=${encodeURIComponent(picsPath)}`);

		const data: FileEntry[] = await res.json();

		const filtered = data.filter((f) => f.type === 'file' && IMAGE_EXTENSIONS.some((ext) => f.name.toLowerCase().endsWith(ext)));

		setImages(filtered);
		setLoading(false);
	};

	useEffect(() => {
		(() => {
			load();
		})();
	}, [basePath, client]);

	const upload = async (files: FileList) => {
		for (const file of Array.from(files)) {
			const fd = new FormData();
			fd.append('file', file);
			fd.append('client', client);
			fd.append('kind', 'pictures');

			await fetch('/api/files/upload', {
				method: 'POST',
				body: fd,
			});
		}

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
				<div className='w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600'>
					<ImageIcon size={20} />
				</div>
				<div>
					<h2 className='text-xl font-semibold'>Foto’s</h2>
					<p className='text-sm text-zinc-500'>Site images and documentation</p>
				</div>
			</header>

			<input ref={inputRef} type='file' accept='image/*' multiple className='hidden' onChange={(e) => e.target.files && upload(e.target.files)} />

			<div className={sectionBase}>
				{/* Header */}
				<button onClick={() => setOpen(!open)} className='w-full flex justify-between items-center p-5'>
					<span className='font-medium'>Images ({images.length})</span>
					{open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</button>

				<AnimatePresence>
					{open && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className='px-5 pb-5 space-y-4'>
							{/* Upload */}
							<div className='flex justify-end'>
								<button onClick={() => inputRef.current?.click()} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:opacity-90 transition'>
									<Upload size={14} />
									Upload
								</button>
							</div>

							{/* Loading */}
							{loading && <div className='text-sm text-zinc-500'>Loading images…</div>}

							{/* Empty */}
							{!loading && images.length === 0 && <div className='text-sm text-zinc-500 border border-dashed border-zinc-300 rounded-xl p-6 text-center'>No images found.</div>}

							{/* Grid */}
							{!loading && images.length > 0 && (
								<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
									{images.map((img, index) => (
										<motion.div
											key={img.path}
											initial={{
												opacity: 0,
												y: 10,
											}}
											animate={{
												opacity: 1,
												y: 0,
											}}
											transition={{
												delay: index * 0.03,
											}}
											className='group relative rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-50 hover:shadow-md transition'>
											<img src={`/api/files/download?path=${encodeURIComponent(img.path)}`} alt={img.name} className='w-full h-40 object-cover transition group-hover:scale-105' />

											{/* Overlay */}
											<div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end'>
												<div className='w-full p-3 flex justify-between items-center opacity-0 group-hover:opacity-100 transition'>
													<span className='text-xs text-white truncate'>{img.name}</span>

													<button onClick={() => download(img.path)} className='text-white hover:text-emerald-300 transition'>
														<Download size={16} />
													</button>
												</div>
											</div>
										</motion.div>
									))}
								</div>
							)}
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
