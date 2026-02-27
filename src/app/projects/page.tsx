/** @format */
'use client';

import { Folder, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePermissions } from '@/providers/PermissionsProvider';

// projects/page

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

type Settings = {
	basePath: string;
	requiredFolders: string[];
};

export default function ProjectsPage() {
	const [projects, setProjects] = useState<FileEntry[]>([]);
	const [settings, setSettings] = useState<Settings | null>(null);
	const [query, setQuery] = useState('');
	const { hasAll, loading } = usePermissions();

	useEffect(() => {
		(async () => {
			const s = await fetch('/api/settings/projects').then((r) => r.json());
			setSettings(s);

			if (!s.basePath) return;

			const res = await fetch(`/api/files?view=${encodeURIComponent(s.basePath)}`);
			const data = await res.json();

			const foldersOnly = data.filter((f: FileEntry) => f.type === 'directory');
			setProjects(foldersOnly);
		})();
	}, []);

	const filteredProjects = useMemo(() => {
		const q = query.toLowerCase().trim();
		if (!q) return projects;

		return projects.filter((c) => c.name.toLowerCase().includes(q));
	}, [projects, query]);

	if (loading) return null;

	if (!hasAll(['projects.read'])) {
		return <div className='p-6 text-red-500'>You do not have permission to view projects.</div>;
	}

	if (!settings) {
		return <div className='text-zinc-900'>Loading settings…</div>;
	}

	if (!settings.basePath) {
		return (
			<div className='w-full max-w-7xl mx-auto'>
				<h1 className='text-3xl font-semibold mb-2'>Projects</h1>
				<p className='text-zinc-500'>
					No base path configured. Visit <b>/settings</b>.
				</p>
			</div>
		);
	}

	return (
		<div className='w-full max-w-7xl mx-auto space-y-6'>
			<header className='flex items-center gap-4'>
				<div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0'>
					<Folder size={24} />
				</div>

				<div className='flex flex-col justify-center min-w-0'>
					<h1 className='text-3xl md:text-4xl font-semibold tracking-tight truncate'>Projects</h1>
					<p className='text-zinc-500'>Select a project to open</p>
				</div>
			</header>

			{/* SEARCH BAR — responsive and sidebar-safe */}
			<div className='w-full max-w-md'>
				<div className='relative'>
					<Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' />
					<input
						type='text'
						placeholder='Search projects…'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
					/>
				</div>
			</div>

			<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} className='bg-white border border-zinc-200 rounded-xl shadow-sm divide-y divide-zinc-100 w-full'>
				{filteredProjects.length === 0 && <div className='px-4 sm:px-6 py-4 text-zinc-500'>{query ? `No projects matching “${query}”.` : `No client folders found in ${settings.basePath}.`}</div>}

				{filteredProjects.map((c) => (
					<Link key={c.path} href={`/projects/${encodeURIComponent(c.name)}`} className='flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-zinc-50 transition-colors'>
						<Folder size={18} className='text-zinc-500 shrink-0' />
						<span className='text-zinc-900 font-medium truncate'>{c.name}</span>
					</Link>
				))}
			</motion.div>
		</div>
	);
}
