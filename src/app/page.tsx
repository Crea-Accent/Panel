/** @format */
'use client';

import { Clock, FolderKanban, HardDrive, Plus, Search, TrendingUp } from 'lucide-react';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import Link from 'next/link';
import { motion } from 'framer-motion';

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
	const [settings, setSettings] = useState<Settings | null>(null);
	const [projects, setProjects] = useState<FileEntry[]>([]);
	const [query, setQuery] = useState('');
	const [loading, setLoading] = useState(true);
	const [recentOpened, setRecentOpened] = useState<string[]>([]);
	const searchRef = useRef<HTMLInputElement | null>(null);

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

	const createProject = async () => {
		if (!settings?.path) return;

		const name = prompt('New project name');
		if (!name) return;

		const newPath = `${settings.path}/${name}`;
		await fetch(`/api/files?view=${encodeURIComponent(newPath)}`);
		window.location.href = `/projects/${encodeURIComponent(name)}`;
	};

	return (
		<div className='w-full max-w-7xl mx-auto space-y-12'>
			{/* HERO */}
			<motion.section
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				className='
					relative overflow-hidden
					bg-gradient-to-br from-indigo-50 to-white
					dark:from-zinc-900 dark:to-zinc-950
					border border-indigo-100 dark:border-zinc-800
					rounded-3xl
					p-8 md:p-10
					shadow-sm
					space-y-8
				'>
				<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6'>
					<div>
						<h1 className='text-3xl md:text-4xl font-semibold tracking-tight text-gray-900 dark:text-zinc-100'>Project Control Center</h1>
						<p className='text-sm text-gray-500 dark:text-zinc-400 mt-2'>Manage projects, track updates and monitor storage.</p>
					</div>

					<button
						onClick={createProject}
						className='
							h-11 px-5 rounded-2xl
							bg-indigo-600 text-white
							text-sm font-medium
							flex items-center gap-2
							hover:bg-indigo-500
							transition-colors
						'>
						<Plus className='w-4 h-4' />
						New Project
					</button>
				</div>

				<div className='relative max-w-xl'>
					<Search className='absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500' size={18} />
					<input
						ref={searchRef}
						placeholder='Search projects… (press /)'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='
							w-full h-12 pl-12 pr-4
							bg-white dark:bg-zinc-900
							border border-gray-200 dark:border-zinc-700
							rounded-2xl
							text-sm
							text-gray-900 dark:text-zinc-100
							placeholder-gray-400 dark:placeholder-zinc-500
							focus:outline-none
							focus:ring-2 focus:ring-indigo-500/20
							focus:border-indigo-500
							transition
						'
					/>
				</div>

				{query && filteredProjects.length > 0 && (
					<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm divide-y divide-gray-200 dark:divide-zinc-800'>
						{filteredProjects.slice(0, 6).map((p) => {
							const daysAgo = p.modified ? (Date.now() - new Date(p.modified).getTime()) / (1000 * 60 * 60 * 24) : 999;

							const stale = daysAgo > 365;

							return (
								<Link key={p.path} href={`/projects/${encodeURIComponent(p.name)}`} className='block px-6 py-5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition'>
									<div className='flex justify-between'>
										<div>
											<p className='font-medium text-gray-900 dark:text-zinc-100'>{p.name}</p>

											{stale && <span className='mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'>Needs attention</span>}
										</div>

										<div className='text-right text-xs text-gray-500 dark:text-zinc-400 space-y-1'>
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
				<StatCard icon={<FolderKanban className='w-5 h-5' />} label='Total Projects' value={loading ? '—' : projects.length} />
				<StatCard icon={<TrendingUp className='w-5 h-5' />} label='Updated last 7 days' value={loading ? '—' : updatedLast7Days} />
				<StatCard icon={<HardDrive className='w-5 h-5' />} label='Total Storage (MB)' value={loading ? '—' : totalStorage} />
			</section>

			{/* RECENT */}
			<section className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-4'>
				<h2 className='text-base font-semibold flex items-center gap-2 text-gray-900 dark:text-zinc-100'>
					<Clock className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
					Recently Updated
				</h2>

				{sortedByRecent.slice(0, 5).map((p) => (
					<Link key={p.path} href={`/projects/${encodeURIComponent(p.name)}`} className='flex justify-between items-center px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition'>
						<span className='text-sm font-medium text-gray-900 dark:text-zinc-100'>{p.name}</span>
						<span className='text-xs text-gray-500 dark:text-zinc-400'>{p.modified ? new Date(p.modified).toLocaleDateString() : ''}</span>
					</Link>
				))}
			</section>
		</div>
	);
}

function StatCard({ icon, label, value }: { icon: ReactElement; label: string; value: string | number }) {
	return (
		<div className='bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6'>
			<div className='flex items-center gap-3 mb-4'>
				<div className='w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 flex items-center justify-center'>{icon}</div>
				<span className='text-xs font-medium text-gray-500 dark:text-zinc-400 uppercase tracking-wide'>{label}</span>
			</div>

			<p className='text-2xl font-semibold text-gray-900 dark:text-zinc-100'>{value}</p>
		</div>
	);
}
