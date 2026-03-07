/** @format */
'use client';

import { useParams, useRouter } from 'next/navigation';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function Page() {
	const { data: session, status } = useSession();
	const router = useRouter();
	const params = useParams();

	const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
	const projectId = decodeURIComponent(rawId ?? '');

	useEffect(() => {
		if (status !== 'authenticated') return;

		const allowedProjects = session.user.projects ?? [];

		if (!projectId || !allowedProjects.includes(projectId)) {
			router.replace('/portal');
		}
	}, [status, session, projectId, router]);

	// don't render anything until session is resolved
	if (status === 'loading') return null;

	// if not authenticated, let higher-level routing handle it
	if (!session) return null;

	const allowedProjects = session.user.projects ?? [];

	if (!projectId || !allowedProjects.includes(projectId)) return null;

	return (
		<div className='p-6 space-y-6'>
			<h1 className='text-xl font-semibold'>{projectId}</h1>

			<p className='text-sm text-zinc-500'>Project portal area for this client.</p>
		</div>
	);
}
