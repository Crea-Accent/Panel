/** @format */

'use client';

import { ArrowDownToLine, ArrowUpFromLine, Factory, SolarPanel, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

type Phase = {
	lines: any[];
	voltage?: number;
};

export default function Page() {
	const [production, setProduction] = useState<number>(0);
	const [consumption, setConsumption] = useState<number>(0);
	const [intake, setIntake] = useState<number | null>(null);
	const [outtake, setOuttake] = useState<number | null>(null);

	const [channels, setChannels] = useState<{
		l1?: Phase;
		l2?: Phase;
		l3?: Phase;
	}>({});

	useEffect(() => {
		const load = async () => {
			try {
				const res = await fetch('/api/energy');

				const { data } = await res.json().catch(() => ({
					data: null,
				}));

				if (!data) return;

				const solar = data.channelPowers.filter(({ publishIndex }: any) => publishIndex >= 3);

				const reducedSolar = solar.reduce((a: number, b: any) => a + b.power, 0);

				const grid = data.channelPowers.filter(({ publishIndex }: any) => publishIndex <= 2);

				const reducedGrid = grid.reduce((a: number, b: any) => a + b.power, 0);

				setProduction(reducedSolar);
				setConsumption(reducedSolar + reducedGrid);

				if (reducedGrid > 0) {
					setIntake(reducedGrid);
					setOuttake(null);
				} else {
					setIntake(null);
					setOuttake(Math.abs(reducedGrid));
				}

				const l1 = {
					lines: data.channelPowers.filter(({ phaseId }: any) => phaseId === 0),
					...data.voltages.find(({ phaseId }: any) => phaseId === 0),
				};

				const l2 = {
					lines: data.channelPowers.filter(({ phaseId }: any) => phaseId === 1),
					...data.voltages.find(({ phaseId }: any) => phaseId === 1),
				};

				const l3 = {
					lines: data.channelPowers.filter(({ phaseId }: any) => phaseId === 2),
					...data.voltages.find(({ phaseId }: any) => phaseId === 2),
				};

				setChannels({ l1, l2, l3 });
			} catch (err) {
				console.error(err);
			}
		};

		load();

		const interval = setInterval(load, 2000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className='space-y-8'>
			<div>
				<h1 className='text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>Energy Dashboard</h1>

				<p className='text-sm text-zinc-500 dark:text-zinc-400 mt-2'>Live monitoring of grid usage, solar production and per-phase activity.</p>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'>
				<OverviewCard label='Consumption' value={consumption} icon={<Factory size={18} />} />

				<OverviewCard label='Production' value={production} icon={<SolarPanel size={18} />} />

				{intake !== null && <OverviewCard label='Import' value={intake} icon={<ArrowDownToLine size={18} />} />}

				{outtake !== null && <OverviewCard label='Export' value={outtake} icon={<ArrowUpFromLine size={18} />} />}
			</div>

			<div className='grid grid-cols-1 xl:grid-cols-3 gap-5'>
				<PhaseCard title='L1' data={channels.l1} />
				<PhaseCard title='L2' data={channels.l2} />
				<PhaseCard title='L3' data={channels.l3} />
			</div>
		</div>
	);
}

function OverviewCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
	return (
		<div
			className='
				bg-white dark:bg-zinc-900
				border border-zinc-200 dark:border-zinc-800
				rounded-2xl
				p-6
				shadow-sm
			'>
			<div className='flex items-center gap-3 mb-5'>
				<div
					className='
						w-10 h-10 rounded-xl
						bg-(--active-accent)
						dark:bg-(--accent)/20
						text-(--accent)
						flex items-center justify-center
					'>
					{icon}
				</div>

				<span
					className='
						text-xs uppercase tracking-wide
						font-medium
						text-zinc-500 dark:text-zinc-400
					'>
					{label}
				</span>
			</div>

			<div className='flex items-end gap-2'>
				<p className='text-4xl font-semibold text-zinc-900 dark:text-zinc-100'>{Math.round(value).toLocaleString()}</p>

				<span className='text-zinc-500 pb-1'>W</span>
			</div>
		</div>
	);
}

function PhaseCard({ title, data }: { title: string; data?: Phase }) {
	const grid = data?.lines?.[0];
	const solar = data?.lines?.[1];

	return (
		<div
			className='
				bg-white dark:bg-zinc-900
				border border-zinc-200 dark:border-zinc-800
				rounded-2xl
				p-6
				shadow-sm
				space-y-6
			'>
			<div className='flex items-center justify-between'>
				<div>
					<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>{title}</h2>

					<p className='text-sm text-zinc-500 dark:text-zinc-400'>{data?.voltage ?? '—'}V</p>
				</div>

				<div
					className='
						w-11 h-11 rounded-xl
						bg-(--active-accent)
						dark:bg-(--accent)/20
						text-(--accent)
						flex items-center justify-center
					'>
					<Zap size={18} />
				</div>
			</div>

			<div className='space-y-4'>
				<LineRow label='Grid' power={grid?.power} current={grid?.current} cosphi={grid?.cosPhi} />

				<LineRow label='Solar' power={solar?.power} current={solar?.current} cosphi={solar?.cosPhi} />
			</div>
		</div>
	);
}

function LineRow({ label, power, current, cosphi }: { label: string; power?: number; current?: number; cosphi?: number }) {
	return (
		<div
			className='
				rounded-xl
				bg-zinc-50 dark:bg-zinc-800/50
				border border-zinc-200 dark:border-zinc-800
				p-4
			'>
			<div className='flex items-center justify-between mb-3'>
				<p className='font-medium text-zinc-900 dark:text-zinc-100'>{label}</p>

				<p className='text-xs text-zinc-500 dark:text-zinc-400'>cosφ {(cosphi ?? 0) / 100}</p>
			</div>

			<div className='grid grid-cols-2 gap-4'>
				<div>
					<p className='text-xs text-zinc-500 dark:text-zinc-400 mb-1'>Power</p>

					<p className='text-xl font-semibold text-zinc-900 dark:text-zinc-100'>{Math.abs(power ?? 0).toLocaleString()}W</p>
				</div>

				<div>
					<p className='text-xs text-zinc-500 dark:text-zinc-400 mb-1'>Current</p>

					<p className='text-xl font-semibold text-zinc-900 dark:text-zinc-100'>{current ?? 0}A</p>
				</div>
			</div>
		</div>
	);
}
