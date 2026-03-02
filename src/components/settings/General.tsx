/** @format */
'use client';

import { AlertCircle, AlertTriangle, CheckCircle, HardDrive, Info, Loader2, RefreshCw, Save } from 'lucide-react';
import { useEffect, useState } from 'react';

import { motion } from 'framer-motion';

type VersionInfo = {
	localVersion: string;
	remoteVersion: string;
	upToDate: boolean;
	error?: string;
};

type FilesSettings = {
	path?: string;
};

export default function GeneralSettings() {
	const [info, setInfo] = useState<VersionInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);
	const [logs, setLogs] = useState<string[]>([]);

	const [filesSettings, setFilesSettings] = useState<FilesSettings>({ path: '' });
	const [savingPath, setSavingPath] = useState(false);

	/* ---------------- VERSION CHECK ---------------- */

	async function checkVersion() {
		setLoading(true);
		try {
			const res = await fetch('/api/version', { cache: 'no-store' });
			const data = await res.json();
			setInfo(data);
		} catch {
			setInfo({
				localVersion: '-',
				remoteVersion: '-',
				upToDate: false,
				error: 'Failed to check version',
			});
		}
		setLoading(false);
	}

	function runUpdate() {
		setUpdating(true);
		setLogs([]);

		const source = new EventSource('/api/update');

		source.onmessage = (event) => {
			setLogs((prev) => [...prev, event.data]);

			if (event.data.toLowerCase().includes('update complete')) {
				source.close();
				window.location.reload();
			}
		};

		source.onerror = () => {
			source.close();
			setUpdating(false);
		};
	}

	function getMessageMeta(message: string) {
		const lower = message.toLowerCase();

		if (lower.includes('error')) {
			return {
				icon: <AlertCircle size={14} />,
				className: 'bg-red-50 text-red-700 border-red-200',
			};
		}

		if (lower.includes('warning') || lower.includes('warn')) {
			return {
				icon: <AlertTriangle size={14} />,
				className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
			};
		}

		if (lower.includes('complete') || lower.includes('success')) {
			return {
				icon: <CheckCircle size={14} />,
				className: 'bg-green-50 text-green-700 border-green-200',
			};
		}

		return {
			icon: <Info size={14} />,
			className: 'bg-blue-50 text-blue-700 border-blue-200',
		};
	}

	/* ---------------- FILES PATH ---------------- */

	async function loadFilesSettings() {
		const res = await fetch('/api/settings/files');
		const data = await res.json();
		setFilesSettings({
			path: '',
			...data,
		});
	}

	async function saveFilesPath() {
		setSavingPath(true);

		await fetch('/api/settings/files', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(filesSettings),
		});

		setTimeout(() => setSavingPath(false), 600);
	}

	/* ---------------- INIT ---------------- */

	useEffect(() => {
		(() => {
			checkVersion();
			loadFilesSettings();
		})();
	}, []);

	return (
		<div className='space-y-10'>
			{/* HEADER */}
			<div>
				<h2 className='text-xl font-semibold'>General</h2>
				<p className='text-sm text-gray-500 mt-1'>System information, application updates and root configuration.</p>
			</div>

			{/* VERSION CARD */}
			<div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6'>
				<div className='flex justify-between items-center'>
					<h3 className='text-lg font-medium'>Application Version</h3>

					<button onClick={checkVersion} className='text-sm text-gray-500 hover:text-black transition flex items-center gap-2'>
						<RefreshCw size={14} />
						Refresh
					</button>
				</div>

				{loading ? (
					<div className='flex items-center gap-2 text-sm text-gray-500'>
						<Loader2 size={16} className='animate-spin' />
						Checking version...
					</div>
				) : info?.error ? (
					<div className='text-sm text-red-500'>{info.error}</div>
				) : (
					<>
						<div className='text-sm space-y-1'>
							<div>
								Current version: <strong>{info?.localVersion}</strong>
							</div>
							<div>
								Latest version: <strong>{info?.remoteVersion}</strong>
							</div>
						</div>

						{info?.upToDate ? (
							<div className='flex items-center gap-2 text-green-600 text-sm'>
								<CheckCircle size={16} />
								Application is up to date
							</div>
						) : (
							<div className='space-y-4'>
								<div className='flex items-center gap-2 text-yellow-600 text-sm'>
									<AlertCircle size={16} />
									Update available
								</div>

								<motion.button
									whileTap={{ scale: 0.97 }}
									onClick={runUpdate}
									disabled={updating}
									className='px-4 py-2 rounded-lg bg-black text-white text-sm font-medium flex items-center gap-2 disabled:opacity-50'>
									{updating ? (
										<>
											<Loader2 size={16} className='animate-spin' />
											Updating...
										</>
									) : (
										<>
											<RefreshCw size={16} />
											Update Now
										</>
									)}
								</motion.button>

								{updating && logs.length > 0 && (
									<div className='mt-4 space-y-2 max-h-56 overflow-y-auto'>
										{logs.map((log, i) => {
											const meta = getMessageMeta(log);
											return (
												<div key={i} className={`flex items-start gap-2 text-xs font-mono p-2 rounded-md border ${meta.className}`}>
													<div className='mt-[2px]'>{meta.icon}</div>
													<div className='whitespace-pre-wrap break-words'>{log}</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>

			{/* FILES ROOT PATH */}
			<div className='bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-4'>
				<div className='flex items-center gap-2'>
					<HardDrive size={18} />
					<h3 className='text-lg font-medium'>Files Root Path</h3>
				</div>

				<input
					className='w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black transition'
					placeholder='D:\\Shared'
					value={filesSettings.path || ''}
					onChange={(e) =>
						setFilesSettings({
							...filesSettings,
							path: e.target.value,
						})
					}
				/>

				<p className='text-xs text-gray-500'>This directory is used as the root for the file explorer module.</p>

				<div className='pt-4 border-t border-gray-200'>
					<button onClick={saveFilesPath} className='px-5 py-2 rounded-lg bg-black text-white text-sm font-medium flex items-center gap-2'>
						<Save size={14} />
						{savingPath ? 'Saving...' : 'Save Path'}
					</button>
				</div>
			</div>
		</div>
	);
}
