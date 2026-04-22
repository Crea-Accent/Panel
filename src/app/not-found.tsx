/** @format */

import { Home, Search } from 'lucide-react';

import Link from 'next/link';

export default function NotFound() {
	return (
		<div className='flex min-h-[70vh] items-center justify-center px-6'>
			{' '}
			<div className='max-w-md text-center space-y-6'>
				{' '}
				<h1 className='text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100'>404 </h1>
				<div className='space-y-2'>
					<h2 className='text-xl font-semibold text-zinc-800 dark:text-zinc-200'>Page not found</h2>

					<p className='text-sm text-zinc-500 dark:text-zinc-400'>The page you are looking for does not exist or may have been moved.</p>
				</div>
				<div className='flex justify-center gap-3 pt-4'>
					<Link
						href='/'
						className='
						inline-flex items-center gap-2
						h-10 px-4
						rounded-xl
						bg-(--accent)
						text-sm font-medium
						hover:bg-(--hover-accent) 
						transition
					'>
						<Home size={16} />
						Go Home
					</Link>

					<Link
						href='/dashboard'
						className='
						inline-flex items-center gap-2
						h-10 px-4
						rounded-xl
						bg-(--accent)
						text-sm font-medium
						hover:bg-(--hover-accent) 
						transition
					'>
						<Search size={16} />
						Browse Projects
					</Link>
				</div>
			</div>
		</div>
	);
}
