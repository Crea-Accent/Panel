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

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const [metadataCache, setMetadataCache] = useState<Record<string, any>>({});

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

				const foldersOnly = data.filter((f) => f.type === 'directory');

				setProjects(foldersOnly);
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
	function detectTech(name: string) {
		const lower = name.toLowerCase();

		const tech: string[] = [];

		if (lower.includes('loxone')) tech.push('Loxone');
		if (lower.includes('niko')) tech.push('Niko');
		if (lower.includes('siemens')) tech.push('Siemens');
		if (lower.includes('dali')) tech.push('DALI');
		if (lower.includes('duo')) tech.push('DuoTecno');

		return tech;
	}
	useEffect(() => {
		const loadMetadata = async () => {
			for (const p of filteredProjects.slice(0, 6)) {
				if (!metadataCache[p.name]) {
					const res = await fetch(`/api/projects/metadata?client=${encodeURIComponent(p.name)}`);
					const data = await res.json();

					setMetadataCache((prev) => ({
						...prev,
						[p.name]: data,
					}));
				}
			}
		};

		if (query) loadMetadata();
	}, [filteredProjects, query]);

	return (
		<div className='w-full max-w-7xl mx-auto space-y-12'>
			{/* HERO */}
			<motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className='bg-white border border-zinc-200 rounded-2xl shadow-sm p-8 space-y-6'>
				<div className='flex justify-between items-center'>
					<h1 className='text-3xl font-semibold tracking-tight'>Project Control Center</h1>

					<button onClick={createProject} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-sm hover:opacity-90 transition'>
						<Plus size={16} />
						New Project
					</button>
				</div>

				<div className='relative max-w-xl'>
					<Search size={18} className='absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400' />
					<input
						ref={searchRef}
						placeholder='Search projects… (press /)'
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className='w-full pl-10 pr-4 py-3 border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-black/10'
					/>
				</div>

				{query && filteredProjects.length > 0 && (
					<div className='border border-zinc-200 rounded-xl divide-y bg-white shadow-sm'>
						{filteredProjects.slice(0, 6).map((p) => {
							const metadata = metadataCache[p.name];
							const tech = detectTech(p.name);

							const daysAgo = p.modified ? (Date.now() - new Date(p.modified).getTime()) / (1000 * 60 * 60 * 24) : 999;

							const needsAttention = daysAgo > 365;

							return (
								<Link key={p.path} href={`/projects/${encodeURIComponent(p.name)}`} className='block px-4 py-4 hover:bg-zinc-50 transition'>
									<div className='flex justify-between items-start'>
										<div className='space-y-1'>
											<p className='font-medium'>{p.name}</p>

											{metadata?.address?.city && <p className='text-xs text-zinc-500'>📍 {metadata.address.city}</p>}

											<div className='flex gap-2 flex-wrap'>
												{tech.map((t) => (
													<span key={t} className='text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600'>
														{t}
													</span>
												))}
											</div>
										</div>

										<div className='text-right space-y-1'>
											{p.modified && <p className='text-xs text-zinc-500'>{new Date(p.modified).toLocaleDateString()}</p>}

											<p className='text-xs text-zinc-500'>{((p.size ?? 0) / 1024 / 1024).toFixed(1)} MB</p>

											{needsAttention && <span className='text-xs text-red-500'>⚠ Stale</span>}
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
				<StatCard icon={<FolderKanban size={20} />} label='Total Projects' value={loading ? '—' : projects.length} />

				<StatCard icon={<TrendingUp size={20} />} label='Updated last 7 days' value={loading ? '—' : updatedLast7Days} />

				<StatCard icon={<HardDrive size={20} />} label='Total Storage (MB)' value={loading ? '—' : totalStorage} />
			</section>

			{/* RECENTLY UPDATED */}
			<section className='bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4'>
				<h2 className='text-lg font-semibold flex items-center gap-2'>
					<Clock size={18} /> Recently Updated
				</h2>

				{sortedByRecent.slice(0, 5).map((p) => (
					<Link key={p.path} href={`/projects/${encodeURIComponent(p.name)}`} className='flex justify-between items-center p-3 rounded-xl hover:bg-zinc-50 transition'>
						<span>{p.name}</span>
						<span className='text-xs text-zinc-500'>{p.modified ? new Date(p.modified).toLocaleDateString() : ''}</span>
					</Link>
				))}
			</section>

			{/* RECENTLY OPENED */}
			{recentOpened.length > 0 && (
				<section className='bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-4'>
					<h2 className='text-lg font-semibold'>Recently Opened</h2>

					{recentOpened.slice(0, 5).map((name) => (
						<Link key={name} href={`/projects/${encodeURIComponent(name)}`} className='block p-3 rounded-xl hover:bg-zinc-50 transition'>
							{name}
						</Link>
					))}
				</section>
			)}
		</div>
	);
}

function StatCard({ icon, label, value }: { icon: ReactElement; label: string; value: string | number }) {
	return (
		<div className='bg-white border border-zinc-200 rounded-2xl shadow-sm p-6'>
			<div className='flex items-center gap-3 mb-2'>
				<div className='w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-700'>{icon}</div>
				<h2 className='text-sm font-medium text-zinc-500 uppercase tracking-wide'>{label}</h2>
			</div>

			<p className='text-2xl font-semibold'>{value}</p>
		</div>
	);
}
