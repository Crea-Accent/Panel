/** @format */

'use client';

import { AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Info, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

type VersionInfo = {
	localVersion: string;
	remoteVersion: string;
	upToDate: boolean;
	error?: string;
};

export default function GeneralSettings() {
	const [info, setInfo] = useState<VersionInfo | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState(false);

	const [logs, setLogs] = useState<string[]>([]);

	async function checkVersion() {
		setLoading(true);
		try {
			const res = await fetch('/api/version', {
				cache: 'no-store',
			});
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

		return () => {
			source.close();
		};
	}

	function getMessageMeta(message: string) {
		const lower = message.toLowerCase();

		if (lower.includes('error')) {
			return {
				type: 'error',
				icon: <AlertCircle size={14} />,
				className: 'bg-red-50 text-red-700 border-red-200',
			};
		}

		if (lower.includes('warning') || lower.includes('warn')) {
			return {
				type: 'warning',
				icon: <AlertTriangle size={14} />,
				className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
			};
		}

		if (lower.includes('complete') || lower.includes('success')) {
			return {
				type: 'success',
				icon: <CheckCircle size={14} />,
				className: 'bg-green-50 text-green-700 border-green-200',
			};
		}

		return {
			type: 'info',
			icon: <Info size={14} />,
			className: 'bg-blue-50 text-blue-700 border-blue-200',
		};
	}

	useEffect(() => {
		(() => {
			checkVersion();
		})();
	}, []);

	return (
		<div className="space-y-10">
			{/* Header */}
			<div>
				<h2 className="text-xl font-semibold">General</h2>
				<p className="text-sm text-gray-500 mt-1">System information and application updates.</p>
			</div>

			{/* Version Card */}
			<div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-medium">Application Version</h3>

					<button onClick={checkVersion} className="text-sm text-gray-500 hover:text-black transition flex items-center gap-2">
						<RefreshCw size={14} />
						Refresh
					</button>
				</div>

				{loading ? (
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Loader2 size={16} className="animate-spin" />
						Checking version...
					</div>
				) : info?.error ? (
					<div className="text-sm text-red-500">{info.error}</div>
				) : (
					<>
						<div className="text-sm space-y-1">
							<div>
								Current version: <strong>{info?.localVersion}</strong>
							</div>
							<div>
								Latest version: <strong>{info?.remoteVersion}</strong>
							</div>
						</div>

						{info?.upToDate ? (
							<div className="flex items-center gap-2 text-green-600 text-sm">
								<CheckCircle size={16} />
								Application is up to date
							</div>
						) : (
							<div className="space-y-4">
								<div className="flex items-center gap-2 text-yellow-600 text-sm">
									<AlertCircle size={16} />
									Update available
								</div>

								<motion.button
									whileTap={{ scale: 0.97 }}
									onClick={runUpdate}
									disabled={updating}
									className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50">
									{updating ? (
										<>
											<Loader2 size={16} className="animate-spin" />
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
									<div className="mt-4 space-y-2 max-h-56 overflow-y-auto">
										{logs.map((log, i) => {
											const meta = getMessageMeta(log);

											return (
												<div key={i} className={`flex items-start gap-2 text-xs font-mono p-2 rounded-md border ${meta.className}`}>
													<div className="mt-[2px]">{meta.icon}</div>
													<div className="whitespace-pre-wrap break-words">{log}</div>
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
		</div>
	);
}
