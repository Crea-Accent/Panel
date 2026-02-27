/** @format */
'use client';

import { Clock, Folder, Search, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

type Settings = {
	basePath: string;
	requiredFolders: string[];
};

export default function Home() {
	const [settings, setSettings] = useState<Settings | null>(null);
	const [clients, setClients] = useState<FileEntry[]>([]);
	const [query, setQuery] = useState('');

	useEffect(() => {
		(async () => {
			const s = await fetch('/api/settings/projects').then((r) => r.json());
			setSettings(s);

			if (!s.basePath) return;

			const res = await fetch(`/api/files?view=${encodeURIComponent(s.basePath)}`);
			const data = await res.json();

			const foldersOnly = data.filter((f: FileEntry) => f.type === 'directory');

			setClients(foldersOnly);
		})();
	}, []);

	const filteredClients = useMemo(() => {
		const q = query.toLowerCase().trim();
		if (!q) return [];
		return clients.filter((c) => c.name.toLowerCase().includes(q));
	}, [clients, query]);

	return (
		<div className='w-full max-w-7xl mx-auto space-y-10'>
			{/* HERO SEARCH */}
			<motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='bg-white border border-zinc-200 rounded-xl shadow-sm p-6 md:p-8 space-y-4'>
				<h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>Find a project</h1>

				<div className='relative max-w-xl'>
					<Search size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' />
					<input
						placeholder='Search clients…'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>
				</div>

				{query && filteredClients.length > 0 && (
					<div className='mt-4 border border-zinc-200 rounded-lg divide-y'>
						{filteredClients.slice(0, 5).map((c) => (
							<Link key={c.path} href={`/clients/${encodeURIComponent(c.name)}`} className='block px-4 py-2 hover:bg-zinc-50'>
								{c.name}
							</Link>
						))}
					</div>
				)}

				{query && filteredClients.length === 0 && <p className='text-sm text-zinc-500'>No matching clients.</p>}
			</motion.section>

			{/* DASHBOARD ROW */}
			<motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				{/* CLIENT COUNT */}
				<div className='bg-white border border-zinc-200 rounded-xl shadow-sm p-5'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600'>
							<Users size={20} />
						</div>
						<h2 className='text-lg font-medium'>Clients</h2>
					</div>

					<p className='text-2xl font-semibold'>{clients.length}</p>
					<p className='text-sm text-zinc-500'>Total projects available</p>
				</div>

				{/* QUICK NAV */}
				<Link href='/projects' className='bg-white border border-zinc-200 rounded-xl shadow-sm p-5 hover:shadow-md transition'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600'>
							<Folder size={20} />
						</div>
						<h2 className='text-lg font-medium'>Browse projects</h2>
					</div>

					<p className='text-sm text-zinc-500'>Open the full client list</p>
				</Link>

				{/* RECENT PLACEHOLDER */}
				<div className='bg-white border border-zinc-200 rounded-xl shadow-sm p-5'>
					<div className='flex items-center gap-3 mb-2'>
						<div className='w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600'>
							<Clock size={20} />
						</div>
						<h2 className='text-lg font-medium'>Recent activity</h2>
					</div>

					<p className='text-sm text-zinc-500'>Coming soon: latest uploads and edits.</p>
				</div>
			</motion.section>
		</div>
	);
}
