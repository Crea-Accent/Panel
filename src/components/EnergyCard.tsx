/** @format */

'use client';

import { useEffect, useState } from 'react';

import Link from 'next/link';
import { Zap } from 'lucide-react';

export default function EnergyCard() {
	const [energy, setEnergy] = useState<any>(null);

	useEffect(() => {
		const load = async () => {
			try {
				const res = await fetch('/api/energy');

				const { mqtt } = await res.json();

				setEnergy(mqtt);
			} catch (err) {
				console.error(err);
			}
		};

		load();

		const interval = setInterval(load, 2000);

		return () => clearInterval(interval);
	}, []);

	const importing = (energy?.totalPower ?? 0) > 0;

	return (
		<Link href='/dashboard/energy'>
			<div
				className='
					bg-white dark:bg-zinc-900
					border border-zinc-200 dark:border-zinc-800
					rounded-xl shadow-sm p-6
					hover:border-(--accent)/40
					hover:shadow-md
					transition-all
					cursor-pointer
				'>
				<div className='flex items-center gap-3 mb-4'>
					<div
						className='
							w-10 h-10 rounded-xl
							bg-(--active-accent)
							dark:bg-(--accent)/30
							text-(--accent)
							dark:text-(--accent)
							flex items-center justify-center
						'>
						<Zap size={18} />
					</div>

					<span
						className='
							text-xs font-medium
							text-zinc-500 dark:text-zinc-400
							uppercase tracking-wide
						'>
						{importing ? 'Import Power' : 'Export Power'}
					</span>
				</div>

				<p className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>{Math.abs(energy?.totalPower ?? 0).toLocaleString()} W</p>
			</div>
		</Link>
	);
}
