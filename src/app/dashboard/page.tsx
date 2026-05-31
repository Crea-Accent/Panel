/** @format */
'use client';

import { Clock, FolderKanban, Search, TrendingUp } from 'lucide-react';
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react';

import Card from '@/components/ui/Card';
import EnergyCard from '@/components/EnergyCard';
import Input from '@/components/ui/Input';
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

	const recentProjectsResolved = useMemo(() => {
		return recentOpened.map((name) => projects.find((p) => p.name === name)).filter(Boolean) as FileEntry[];
	}, [recentOpened, projects]);

	function pushRecent(name: string) {
		const next = [name, ...recentOpened.filter((p) => p !== name)].slice(0, 6);
		setRecentOpened(next);
		localStorage.setItem('recentProjects', JSON.stringify(next));
	}

	return (
		<div className='w-full space-y-10'>
			<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
				<Card
					className='
			relative overflow-hidden
			bg-linear-to-br
			from-(--active-accent)
			to-white
			dark:from-zinc-900
			dark:to-zinc-950
			p-8 md:p-10
			space-y-8
		'>
					<div>
						<h1 className='text-3xl md:text-4xl font-semibold tracking-tight'>Project Control Center</h1>

						<p className='text-sm text-zinc-500 mt-2'>Manage projects, track updates and monitor storage.</p>
					</div>

					<div className='max-w-xl'>
						<Input ref={searchRef} icon={<Search size={18} />} placeholder='Search projects... (press /)' value={query} onChange={(e) => setQuery(e.target.value)} />
					</div>

					{query && filteredProjects.length > 0 && (
						<Card className='divide-y divide-zinc-200 dark:divide-zinc-800'>
							{filteredProjects.slice(0, 6).map((p) => (
								<Link
									key={p.path}
									href={`/dashboard/projects/${encodeURIComponent(p.name)}`}
									onClick={() => pushRecent(p.name)}
									className='block px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition'>
									<div className='flex justify-between'>
										<p className='font-medium'>{p.name}</p>

										<div className='text-right text-xs text-zinc-500'>{p.modified && <p>{new Date(p.modified).toLocaleDateString()}</p>}</div>
									</div>
								</Link>
							))}
						</Card>
					)}
				</Card>
			</motion.div>

			<section className='grid grid-cols-1 md:grid-cols-3 gap-6'>
				<StatCard icon={<FolderKanban size={18} />} label='Total Projects' value={loading ? '—' : projects.length} />
				<StatCard icon={<TrendingUp size={18} />} label='Updated last 7 days' value={loading ? '—' : updatedLast7Days} />
				<EnergyCard />
			</section>

			{recentProjectsResolved.length > 0 && (
				<Card className='p-6 space-y-4'>
					<h2 className='text-base font-semibold flex items-center gap-2'>
						<Clock size={16} className='text-(--accent)' />
						Recently Opened
					</h2>

					<div className='space-y-1'>
						{recentProjectsResolved.map((p) => (
							<Link
								key={p.path}
								href={`/dashboard/projects/${encodeURIComponent(p.name)}`}
								onClick={() => pushRecent(p.name)}
								className='flex justify-between items-center px-4 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition'>
								<span className='text-sm font-medium'>{p.name}</span>
							</Link>
						))}
					</div>
				</Card>
			)}

			<Card className='p-6 space-y-4'>
				<h2 className='text-base font-semibold flex items-center gap-2'>
					<Clock size={16} className='text-(--accent)' />
					Recently Updated
				</h2>

				<div className='space-y-1'>
					{sortedByRecent.slice(0, 5).map((p) => (
						<Link
							key={p.path}
							href={`/dashboard/projects/${encodeURIComponent(p.name)}`}
							onClick={() => pushRecent(p.name)}
							className='flex justify-between items-center px-4 py-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition'>
							<span className='text-sm font-medium'>{p.name}</span>

							<span className='text-xs text-zinc-500'>{p.modified ? new Date(p.modified).toLocaleDateString() : ''}</span>
						</Link>
					))}
				</div>
			</Card>
		</div>
	);
}

function StatCard({ icon, label, value }: { icon: ReactElement; label: string; value: string | number }) {
	return (
		<Card className='p-6'>
			<div className='flex items-center gap-3 mb-4'>
				<div
					className='
						w-10 h-10
						rounded-xl
						bg-(--active-accent)
						dark:bg-(--accent)/30
						text-(--accent)
						flex items-center justify-center
					'>
					{icon}
				</div>

				<span className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>{label}</span>
			</div>

			<p className='text-2xl font-semibold'>{value}</p>
		</Card>
	);
}
