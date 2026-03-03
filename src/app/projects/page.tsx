/** @format */
'use client';

import { Folder, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePermissions } from '@/providers/PermissionsProvider';

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
	const { hasAll, loading } = usePermissions();

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

	if (!hasAll(['projects.read'])) {
		return (
			<div className='p-6 text-sm text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl'>You do not have permission to view projects.</div>
		);
	}

	if (!settings) {
		return <div className='text-sm text-gray-500 dark:text-zinc-400'>Loading settings…</div>;
	}

	if (!settings.path) {
		return (
			<div className='space-y-2'>
				<h1 className='text-2xl font-semibold text-gray-900 dark:text-zinc-100'>Projects</h1>
				<p className='text-sm text-gray-500 dark:text-zinc-400'>
					No base path configured. Visit <b>/settings</b>.
				</p>
			</div>
		);
	}

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center gap-4'>
				<div className='h-11 w-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0'>
					<Folder className='w-5 h-5 text-indigo-600 dark:text-indigo-400' strokeWidth={1.8} />
				</div>

				<div className='min-w-0'>
					<h1 className='text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100'>Projects</h1>
					<p className='text-sm text-gray-500 dark:text-zinc-400'>Select a project to open</p>
				</div>
			</div>

			{/* Search */}
			<div className='max-w-md'>
				<div className='relative'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500' strokeWidth={1.8} />
					<input
						type='text'
						placeholder='Search projects…'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='
							w-full h-10
							pl-10 pr-4
							rounded-xl
							border border-gray-200 dark:border-zinc-700
							bg-white dark:bg-zinc-900
							text-sm text-gray-900 dark:text-zinc-100
							placeholder:text-gray-400 dark:placeholder:text-zinc-500
							focus:outline-none
							focus:ring-2 focus:ring-indigo-500/20
							focus:border-indigo-500
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
					border border-gray-200 dark:border-zinc-800
					rounded-2xl
					shadow-sm
					overflow-hidden
				'>
				{filteredProjects.length === 0 && (
					<div className='px-5 py-4 text-sm text-gray-500 dark:text-zinc-400'>{query ? `No projects matching “${query}”.` : `No client folders found in ${settings.path}.`}</div>
				)}

				{filteredProjects.map((c, index) => (
					<Link
						key={c.path}
						href={`/projects/${encodeURIComponent(c.name)}`}
						className={`
							group
							flex items-center gap-3
							h-12
							px-5
							text-sm font-medium
							text-gray-800 dark:text-zinc-200
							transition-colors
							hover:bg-gray-50 dark:hover:bg-zinc-800
							${index !== filteredProjects.length - 1 ? 'border-b border-gray-100 dark:border-zinc-800' : ''}
						`}>
						<Folder className='w-4 h-4 text-gray-400 dark:text-zinc-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors' strokeWidth={1.8} />
						<span className='truncate'>{c.name}</span>
					</Link>
				))}
			</motion.div>
		</div>
	);
}
