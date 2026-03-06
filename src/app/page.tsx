/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Clock, FolderKanban, HardDrive, Plus, Search, TrendingUp } from 'lucide-react';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { usePermissions } from '@/providers/PermissionsProvider';

type FileEntry = {
	path: string;
	name: string;
	type: 'directory' | 'file';
	size?: number | null;
	modified?: string | null;
};

type Settings = {
	path: string;
	requiredFolders: string[];
};

export default function Home() {
	const { has } = usePermissions();

	const [settings, setSettings] = useState<Settings | null>(null);
	const [projects, setProjects] = useState<FileEntry[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [recentOpened, setRecentOpened] = useState<string[]>([]);
	const searchRef = useRef<HTMLInputElement | null>(null);
	const [creating, setCreating] = useState(false);
	const [newProjectName, setNewProjectName] = useState('');

	useEffect(() => {
		(async () => {
			try {
				const s = await fetch('/api/settings/projects').then((r) => r.json());
				setSettings(s);

				if (!s.path) {
					setLoading(false);
					return;
				}

				const res = await fetch(`/api/files?view=${encodeURIComponent(s.path)}`);
				const data: FileEntry[] = await res.json();

				setProjects(data.filter((f) => f.type === 'directory'));
			} finally {
				setLoading(false);
			}
		})();

		const stored = localStorage.getItem('recentProjects');
		if (stored) setRecentOpened(JSON.parse(stored));

		const handler = (e: KeyboardEvent) => {
			if (e.key === '/') {
				e.preventDefault();
				searchRef.current?.focus();
			}
		};

		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	}, []);

	const filteredProjects = useMemo(() => {
		const q = query.toLowerCase().trim();
		if (!q) return [];
		return projects.filter((p) => p.name.toLowerCase().includes(q));
	}, [projects, query]);

	const sortedByRecent = useMemo(() => {
		return [...projects].sort((a, b) => {
			const aDate = a.modified ? new Date(a.modified).getTime() : 0;
			const bDate = b.modified ? new Date(b.modified).getTime() : 0;
			return bDate - aDate;
		});
	}, [projects]);

	const updatedLast7Days = useMemo(() => {
		const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		return projects.filter((p) => p.modified && new Date(p.modified).getTime() > weekAgo).length;
	}, [projects]);

	const totalStorage = useMemo(() => {
		const total = projects.reduce((acc, p) => acc + (p.size ?? 0), 0);
		return (total / 1024 / 1024).toFixed(1);
	}, [projects]);

	async function createProject() {
		if (!settings?.path || !newProjectName.trim()) return;

		const name = newProjectName.trim();
		const newPath = `${settings.path}/${name}`;

		await fetch(`/api/files?view=${encodeURIComponent(newPath)}`);

		setCreating(false);
		setNewProjectName('');

		window.location.href = `/projects/${encodeURIComponent(name)}`;
	}

	return (
		<div className='w-full space-y-10'>
			{/* HERO */}
			<motion.section
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className='
					relative overflow-hidden
					bg-gradient-to-br from-indigo-50 to-white
					dark:from-zinc-900 dark:to-zinc-950
					border border-zinc-200 dark:border-zinc-800
					rounded-2xl
					p-8 md:p-10
					shadow-sm
					space-y-8
				'>
				<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
					<div>
						<h1 className='text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>Project Control Center</h1>
						<p className='text-sm text-zinc-500 dark:text-zinc-400 mt-2'>Manage projects, track updates and monitor storage.</p>
					</div>

					{has('projects.write') && (
						<button
							onClick={() => setCreating(true)}
							className='
								h-11 px-5 rounded-xl
								bg-indigo-600 text-white
								text-sm font-medium
								flex items-center gap-2
								hover:bg-indigo-500
								active:scale-[0.98]
								transition-all
							'>
							<Plus size={16} />
							New Project
						</button>
					)}
				</div>

				<div className='relative max-w-xl'>
					<Search className='absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500' size={18} />

					<input
						ref={searchRef}
						placeholder='Search projects… (press /)'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='
							w-full h-11 pl-12 pr-4
							bg-white dark:bg-zinc-900
							border border-zinc-200 dark:border-zinc-800
							rounded-xl
							text-sm
							text-zinc-900 dark:text-zinc-100
							placeholder:text-zinc-400 dark:placeholder:text-zinc-500
							focus:outline-none
							focus:ring-2 focus:ring-indigo-500/30
							transition
						'
					/>
				</div>

				{query && filteredProjects.length > 0 && (
					<div className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm divide-y divide-zinc-200 dark:divide-zinc-800'>
						{filteredProjects.slice(0, 6).map((p) => {
							const daysAgo = p.modified ? (Date.now() - new Date(p.modified).getTime()) / (1000 * 60 * 60 * 24) : 999;

							const stale = daysAgo > 365;

							return (
								<Link key={p.path} href={`/projects/${encodeURIComponent(p.name)}`} className='block px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition'>
									<div className='flex justify-between'>
										<div>
											<p className='font-medium text-zinc-900 dark:text-zinc-100'>{p.name}</p>

											{stale && <span className='mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'>Needs attention</span>}
										</div>

										<div className='text-right text-xs text-zinc-500 dark:text-zinc-400 space-y-1'>
											{p.modified && <p>{new Date(p.modified).toLocaleDateString()}</p>}
											<p>{((p.size ?? 0) / 1024 / 1024).toFixed(1)} MB</p>
										</div>
									</div>
								</Link>
							);
						})}
					</div>
				)}
			</motion.section>

			{/* STATS */}
			<section className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<StatCard icon={<FolderKanban size={18} />} label='Total Projects' value={loading ? '—' : projects.length} />
				<StatCard icon={<TrendingUp size={18} />} label='Updated last 7 days' value={loading ? '—' : updatedLast7Days} />
				<StatCard icon={<HardDrive size={18} />} label='Total Storage (MB)' value={loading ? '—' : totalStorage} />
			</section>

			{/* RECENT */}
			<section className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6 space-y-4'>
				<h2 className='text-base font-semibold flex items-center gap-2 text-zinc-900 dark:text-zinc-100'>
					<Clock size={16} className='text-indigo-600 dark:text-indigo-400' />
					Recently Updated
				</h2>

				{sortedByRecent.slice(0, 5).map((p) => (
					<Link key={p.path} href={`/projects/${encodeURIComponent(p.name)}`} className='flex justify-between items-center px-4 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition'>
						<span className='text-sm font-medium text-zinc-900 dark:text-zinc-100'>{p.name}</span>

						<span className='text-xs text-zinc-500 dark:text-zinc-400'>{p.modified ? new Date(p.modified).toLocaleDateString() : ''}</span>
					</Link>
				))}
			</section>

			<AnimatePresence>
				{creating && (
					<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0.95, opacity: 0 }}
							className='
					w-full max-w-md
					bg-white dark:bg-zinc-900
					border border-zinc-200 dark:border-zinc-800
					rounded-2xl
					shadow-xl
					p-6
					space-y-5
				'>
							<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>Create Project</h2>

							<input
								autoFocus
								value={newProjectName}
								onChange={(e) => setNewProjectName(e.target.value)}
								placeholder='Project name'
								className='
						w-full h-10 px-4
						rounded-xl
						bg-gray-50 dark:bg-zinc-800
						border border-zinc-200 dark:border-zinc-700
						text-sm
						focus:outline-none
						focus:ring-2 focus:ring-indigo-500/30
					'
							/>

							<div className='flex justify-end gap-3 pt-2'>
								<button
									onClick={() => {
										setCreating(false);
										setNewProjectName('');
									}}
									className='
							h-10 px-4 rounded-xl
							border border-zinc-200 dark:border-zinc-700
							text-sm
							hover:bg-zinc-100 dark:hover:bg-zinc-800
						'>
									Cancel
								</button>

								<button
									onClick={createProject}
									className='
							h-10 px-5 rounded-xl
							bg-indigo-600 text-white
							text-sm font-medium
							hover:bg-indigo-500
						'>
									Create
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function StatCard({ icon, label, value }: { icon: ReactElement; label: string; value: string | number }) {
	return (
		<div className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6'>
			<div className='flex items-center gap-3 mb-4'>
				<div className='w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center'>{icon}</div>

				<span className='text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide'>{label}</span>
			</div>

			<p className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>{value}</p>
		</div>
	);
}
