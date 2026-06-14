/** @format */
'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { usePermissions } from './PermissionsProvider';
import { useSession } from 'next-auth/react';

type Project = {
	name: string;
	label?: string;
	color?: string;
	lat: number;
	lng: number;
};

type ProjectPromptContextType = {};

const ProjectPromptContext = createContext<ProjectPromptContextType | null>(null);

const NEARBY_DISTANCE_METERS = 100;
const DISMISS_DURATION = 1000 * 60 * 60; // 1 hour

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
	const R = 6371000;

	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;

	const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

	return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ProjectPromptProvider({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const { has } = usePermissions();
	const router = useRouter();
	const pathname = usePathname();

	const [projects, setProjects] = useState<Project[]>([]);
	const [location, setLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);

	const [open, setOpen] = useState(false);

	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				setLocation({
					lat: pos.coords.latitude,
					lng: pos.coords.longitude,
				});
			},
			console.error,
			{
				enableHighAccuracy: true,
				timeout: 10000,
				maximumAge: 30000,
			}
		);

		(async () => {
			try {
				const response = await fetch('/api/projects/map');
				const data = await response.json();

				setProjects(data);
			} catch (error) {
				console.error(error);
			}
		})();
	}, []);

	const nearbyProjects = useMemo(() => {
		if (!location) {
			return [];
		}

		return projects.filter((project) => {
			if (!project.lat || !project.lng) {
				return false;
			}

			const distance = distanceMeters(location.lat, location.lng, project.lat, project.lng);

			return distance <= NEARBY_DISTANCE_METERS;
		});
	}, [projects, location]);

	useEffect(() => {
		if (nearbyProjects.length === 0) {
			setOpen(false);
			return;
		}

		const alreadyViewing = nearbyProjects.some((project) => pathname.startsWith(`/dashboard/projects/${encodeURIComponent(project.name)}`));

		if (alreadyViewing) {
			return;
		}

		const dismissKey = nearbyProjects
			.map((x) => x.name)
			.sort()
			.join('|');

		const dismissedAt = localStorage.getItem(`project-prompt-${dismissKey}`);

		if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_DURATION) {
			return;
		}

		setOpen(true);
	}, [nearbyProjects, pathname]);

	function dismiss() {
		const dismissKey = nearbyProjects
			.map((x) => x.name)
			.sort()
			.join('|');

		localStorage.setItem(`project-prompt-${dismissKey}`, Date.now().toString());

		setOpen(false);
	}

	function openProject(project: Project) {
		setOpen(false);

		router.push(`/dashboard/projects/${encodeURIComponent(project.name)}`);
	}

	return (
		<ProjectPromptContext.Provider value={{}}>
			{children}

			{session && has('projects.read') && (
				<Modal open={open} title={nearbyProjects.length === 1 ? 'Nearby Project Found' : 'Nearby Projects Found'} onClose={dismiss} size='md'>
					<div className='space-y-4'>
						<div className='text-sm text-zinc-500'>{nearbyProjects.length === 1 ? 'You appear to be at a project location.' : 'You appear to be near multiple project locations.'}</div>

						<div className='space-y-2 max-h-60 overflow-x-auto'>
							{nearbyProjects.map((project) => (
								<button
									key={project.name}
									onClick={() => openProject(project)}
									className='w-full text-left rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition'>
									<div className='flex items-center gap-3'>
										<div
											style={{
												width: 12,
												height: 12,
												borderRadius: 999,
												background: project.color ?? 'var(--accent)',
											}}
										/>

										<div>
											<div className='font-medium'>{project.name}</div>

											{project.label && <div className='text-xs text-zinc-500'>{project.label}</div>}
										</div>
									</div>
								</button>
							))}
						</div>

						<div className='flex justify-end'>
							<Button variant='secondary' onClick={dismiss}>
								Dismiss
							</Button>
						</div>
					</div>
				</Modal>
			)}
		</ProjectPromptContext.Provider>
	);
}

export function useProjectPrompt() {
	const ctx = useContext(ProjectPromptContext);

	if (!ctx) {
		throw new Error('ProjectPrompt must be used inside ProjectPromptProvider');
	}

	return ctx;
}
