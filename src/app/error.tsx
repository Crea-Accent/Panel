/** @format */
'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';

import Button from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
	return (
		<html>
			<body
				className='
					h-full
					bg-zinc-50 dark:bg-zinc-950
					text-zinc-900 dark:text-zinc-100
					antialiased
					font-sans
					selection:bg-(--accent) selection:text-white
					transition-colors duration-200
				'>
				<div
					className='
					min-h-screen
					bg-zinc-50
					dark:bg-zinc-950
					flex
					items-center
					justify-center
					p-6
				'>
					<div className='flex flex-col items-center text-center'>
						<div
							className='
								w-16
								h-16
								rounded-2xl
								flex
								items-center
								justify-center
								mb-5
							'
							style={{
								background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
							}}>
							<AlertTriangle
								size={30}
								style={{
									color: 'var(--accent)',
								}}
							/>
						</div>

						<h1 className='text-3xl font-bold'>Something exploded</h1>

						<p className='mt-2 text-zinc-500 max-w-md'>The application encountered an unexpected error. A rare event, much like users reading error messages before clicking buttons repeatedly.</p>

						<div
							className='
								mt-6
								w-full
								rounded-xl
								border
								border-zinc-200
								dark:border-zinc-800
								bg-zinc-50
								dark:bg-zinc-950
								p-4
								text-left
								font-mono
								text-xs
								overflow-auto
							'>
							{error.message || 'Unknown error'}
						</div>

						<div className='mt-6 flex gap-2'>
							<Button onClick={() => reset()} icon={<RefreshCw size={16} />}>
								Try Again
							</Button>

							<Button variant='secondary' onClick={() => (window.location.href = '/')}>
								Home
							</Button>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
