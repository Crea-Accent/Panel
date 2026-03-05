/** @format */
'use client';

import { Folder, Search } from 'lucide-react';
import { NotPermitted, usePermissions } from '@/providers/PermissionsProvider';
import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';

type FileEntry = {
	path: string;
	name: string;
	type: string;
};

type Settings = {
	path: string;
	requiredFolders: string[];
};

export default function ProjectsPage() {
	const [projects, setProjects] = useState<FileEntry[]>([]);
	const [settings, setSettings] = useState<Settings | null>(null);
	const [query, setQuery] = useState('');

	const { loading } = usePermissions();

	useEffect(() => {
		(async () => {
			const s = await fetch('/api/settings/projects').then((r) => r.json());
			setSettings(s);

			if (!s.path) return;

			const res = await fetch(`/api/files?view=${encodeURIComponent(s.path)}`);
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

	return (
		<NotPermitted permission='projects.read'>
			<div className='space-y-6'>
				{/* Header */}

				<div className='flex items-center gap-4'>
					<div className='h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0'>
						<Folder size={20} className='text-indigo-600 dark:text-indigo-400' />
					</div>

					<div className='min-w-0'>
						<h1 className='text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>Projects</h1>

						<p className='text-sm text-zinc-500 dark:text-zinc-400'>Select a project to open</p>
					</div>
				</div>

				{/* Search */}

				<div className='max-w-md'>
					<div className='relative'>
						<Search size={16} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' />

						<input
							type='text'
							placeholder='Search projects…'
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className='
								w-full h-9
								pl-9 pr-4
								rounded-lg
								border border-zinc-200 dark:border-zinc-800
								bg-white dark:bg-zinc-900
								text-sm text-zinc-900 dark:text-zinc-100
								placeholder:text-zinc-400
								focus:outline-none
								focus:ring-2 focus:ring-indigo-500/30
								transition
							'
						/>
					</div>
				</div>

				{/* List */}

				<motion.div
					initial={{ opacity: 0, y: 6 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.2 }}
					className='
						bg-white dark:bg-zinc-900
						border border-zinc-200 dark:border-zinc-800
						rounded-xl
						shadow-sm
						overflow-hidden
					'>
					{filteredProjects.length === 0 && (
						<div className='px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400'>{query ? `No projects matching “${query}”.` : `No client folders found in ${settings?.path}.`}</div>
					)}

					{filteredProjects.map((c, index) => (
						<Link
							key={c.path}
							href={`/projects/${encodeURIComponent(c.name)}`}
							className={`
								group
								flex items-center gap-3
								h-11
								px-5
								text-sm font-medium
								text-zinc-800 dark:text-zinc-200
								transition-colors
								hover:bg-zinc-50 dark:hover:bg-zinc-800
								${index !== filteredProjects.length - 1 ? 'border-b border-zinc-200 dark:border-zinc-800' : ''}
							`}>
							<Folder size={16} className='text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors' />

							<span className='truncate'>{c.name}</span>
						</Link>
					))}
				</motion.div>
			</div>
		</NotPermitted>
	);
}
