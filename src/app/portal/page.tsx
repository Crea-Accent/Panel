/** @format */
'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function Page() {
	const { data: session } = useSession();
	const router = useRouter();

	const projects = session?.user.projects ?? [];

	useEffect(() => {
		if (projects.length === 1) {
			router.replace(`/portal/${encodeURIComponent(projects[0])}`);
		}
	}, [projects, router]);

	if (projects.length === 0) {
		return (
			<div className='p-6'>
				<h1 className='text-lg font-semibold'>No projects assigned</h1>
				<p className='text-sm text-zinc-500'>Please contact your administrator.</p>
			</div>
		);
	}

	if (projects.length === 1) return null;

	return (
		<div className='p-6 space-y-6'>
			<h1 className='text-xl font-semibold'>Your Projects</h1>

			<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{projects.map((project) => (
					<Link
						key={project}
						href={`/portal/${encodeURIComponent(project)}`}
						className='
							p-4
							rounded-xl
							border border-zinc-200 dark:border-zinc-800
							bg-white dark:bg-zinc-900
							hover:bg-zinc-50 dark:hover:bg-zinc-800
							transition
						'>
						<div className='font-medium'>{project}</div>
					</Link>
				))}
			</div>
		</div>
	);
}
