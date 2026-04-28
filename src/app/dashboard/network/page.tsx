/** @format */
'use client';

import * as XLSX from 'xlsx';

import { Download, FileUp, MapPin, User, Users } from 'lucide-react';
import groupsplit, { leaders } from '@/lib/groupsplit';

import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Page() {
	const [people, setPeople] = useState<string[]>([]);
	const [data, setData] = useState<any[]>([]);

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();

		reader.onload = (evt) => {
			const binary = evt.target?.result;
			const workbook = XLSX.read(binary, { type: 'binary' });

			const sheet = workbook.Sheets[workbook.SheetNames[0]];
			const json = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

			const extracted = json.map((row) => row[0]).filter((v) => typeof v === 'string' && v.trim() !== '');

			setPeople(extracted);

			const result = groupsplit(extracted);
			setData(result);
		};

		reader.readAsBinaryString(file);
	}

	function exportStyledExcel(data: any[], people: string[]) {
		const wb = XLSX.utils.book_new();
		const ws: XLSX.WorkSheet = {};

		const headerStyle = {
			font: { bold: true },
			alignment: { horizontal: 'center' },
		};

		const leaderStyle = {
			font: { bold: true },
		};

		const centerStyle = {
			alignment: { horizontal: 'center' },
		};

		let colOffset = 3;

		data.forEach((round, roundIndex) => {
			const startCol = colOffset + roundIndex * 4;

			ws[XLSX.utils.encode_cell({ r: 0, c: startCol })] = {
				v: `SESSIE ${round.round}`,
				s: headerStyle,
			};

			let rowCursor = 1;

			round.groups.forEach((group: any) => {
				const baseRow = rowCursor;
				const hasLeader = !!group.leader;

				if (hasLeader) {
					ws[XLSX.utils.encode_cell({ r: baseRow, c: startCol - 1 })] = {
						v: '10min',
						s: leaderStyle,
					};

					ws[XLSX.utils.encode_cell({ r: baseRow, c: startCol })] = {
						v: group.location,
						s: leaderStyle,
					};

					ws[XLSX.utils.encode_cell({ r: baseRow, c: startCol + 1 })] = {
						v: group.leader,
						s: leaderStyle,
					};
				} else {
					ws[XLSX.utils.encode_cell({ r: baseRow, c: startCol })] = {
						v: group.location,
						s: leaderStyle,
					};
				}

				group.people.forEach((p: string, i: number) => {
					const row = baseRow + (hasLeader ? 1 + i : i);

					ws[XLSX.utils.encode_cell({ r: row, c: startCol - 1 })] = {
						v: hasLeader ? '2min' : '4min',
						s: centerStyle,
					};

					ws[XLSX.utils.encode_cell({ r: row, c: startCol + 1 })] = {
						v: p,
						s: centerStyle,
					};
				});

				rowCursor += (hasLeader ? 1 + group.people.length : group.people.length) + 1;
			});
		});

		ws['A1'] = { v: 'Nr', s: headerStyle };
		ws['B1'] = { v: 'Naam', s: headerStyle };

		const finalPeople = [...leaders, ...people.filter((p) => !leaders.includes(p))];

		for (let i = 0; i < finalPeople.length; i++) {
			const name = finalPeople[i];
			const nr = i === 0 ? 'A' : i === 1 ? 'B' : i === 2 ? 'C' : i - 2;

			ws[XLSX.utils.encode_cell({ r: i + 1, c: 0 })] = { v: nr };
			ws[XLSX.utils.encode_cell({ r: i + 1, c: 1 })] = { v: name };
		}

		ws['!cols'] = [{ wch: 6 }, { wch: 28 }, { wch: 10 }, ...Array(data.length * 4).fill({ wch: 18 })];

		ws['!ref'] = XLSX.utils.encode_range({
			s: { r: 0, c: 0 },
			e: { r: 100, c: colOffset + data.length * 4 },
		});

		XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
		XLSX.writeFile(wb, 'styled_schedule.xlsx');
	}

	return (
		<div className='space-y-8'>
			{/* HEADER */}
			<div>
				<h1 className='text-2xl font-semibold text-zinc-900 dark:text-zinc-100'>Group Splitter</h1>
				<p className='text-sm text-zinc-500 dark:text-zinc-400 mt-1'>Upload an Excel file to generate group rotations.</p>
			</div>

			{/* UPLOAD CARD */}
			<div className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-4'>
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-xl bg-(--active-accent) flex items-center justify-center'>
						<FileUp size={16} className='text-(--accent)' />
					</div>

					<div>
						<h2 className='text-base font-medium text-zinc-900 dark:text-zinc-100'>Upload Excel</h2>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>First column should contain names</p>
					</div>
				</div>

				<input
					type='file'
					accept='.xlsx,.xls'
					onChange={handleFile}
					className='block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-(--accent) file:text-white hover:file:bg-(--hover-accent)'
				/>

				{people.length > 0 && (
					<div className='text-sm text-zinc-600 dark:text-zinc-400'>
						<strong>Loaded:</strong> {people.length} people
					</div>
				)}

				{data.length > 0 && (
					<button
						onClick={() => exportStyledExcel(data, people)}
						className='h-10 px-4 rounded-xl bg-(--accent) text-white text-sm font-medium flex items-center gap-2 hover:bg-(--hover-accent) transition'>
						<Download size={16} />
						Download Excel
					</button>
				)}
			</div>

			{/* RESULTS */}
			<div className='space-y-6'>
				{data.map((round) => (
					<motion.div
						key={round.round}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						className='bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-6 space-y-4'>
						<div className='flex items-center gap-2'>
							<Users size={16} className='text-(--accent)' />
							<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>Round {round.round}</h2>
						</div>

						<div className='grid md:grid-cols-2 gap-4'>
							{round.groups.map((group: any, i: number) => (
								<div key={i} className='border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-800 space-y-2'>
									<div className='flex items-center gap-2 text-sm'>
										<MapPin size={14} />
										<span className='font-medium'>{group.location}</span>
									</div>

									<div className='flex items-center gap-2 text-sm text-zinc-500'>
										<User size={14} />
										{group.leader ?? 'No leader'}
									</div>

									<div className='text-sm text-zinc-600 dark:text-zinc-300'>{group.people.join(', ')}</div>
								</div>
							))}
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
