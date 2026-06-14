/** @format */

export default function Loading() {
	return (
		<div className='space-y-6 animate-pulse'>
			<div>
				<div className='h-8 w-72 rounded-lg bg-zinc-200 dark:bg-zinc-800' />

				<div className='mt-2 h-4 w-32 rounded bg-zinc-200 dark:bg-zinc-800' />
			</div>

			<div className='h-12 rounded-xl bg-zinc-200 dark:bg-zinc-800' />

			<div className='h-125 rounded-2xl bg-zinc-200 dark:bg-zinc-800' />

			<div className='grid md:grid-cols-2 gap-4'>
				<div className='h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
				<div className='h-48 rounded-xl bg-zinc-200 dark:bg-zinc-800' />
			</div>
		</div>
	);
}
