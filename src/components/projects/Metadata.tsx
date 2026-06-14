/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Login, { LoginEntry } from './metadata/Login';
import { useEffect, useState } from 'react';

import { APIProvider } from '@vis.gl/react-google-maps';
import Access from './metadata/Access';
import Address from './metadata/Address';
import Button from '../ui/Button';
import Contact from './metadata/Contact';
import { User } from 'next-auth';
import { usePermissions } from '@/providers/PermissionsProvider';
import { useSession } from 'next-auth/react';

type Label = {
	name: string;
	color: string;
};

export type MetadataType = {
	label?: string;

	address?: {
		lat?: number;
		lon?: number;
		street?: string;
		number?: string;
		postalCode?: string;
		city?: string;
		country?: string;
	};

	contacts?: string[];

	logins?: LoginEntry[];

	updatedAt?: string;

	notes: string;

	solar?: {
		maxPanels?: number;
		roofArea?: number;
		yearlyEnergy?: number;
		lastUpdated?: string;
	};
};

type MetadataActions = {
	save: () => Promise<void>;
	share: () => Promise<void>;
	hasChanges: boolean;
	saving: boolean;
	saved: boolean;
	label: string;
	setLabel: (label: string) => void;
	labels: Label[];
};

type Props = {
	client: string;
	onActionsChange?: (actions: MetadataActions) => void;
};

export default function Metadata({ client, onActionsChange }: Props) {
	const { has } = usePermissions();

	const hasWrite = !has('projects.write');

	const [metadata, setMetadata] = useState<MetadataType | null>(null);
	const [initialMetadata, setInitialMetadata] = useState<MetadataType | null>(null);

	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const [openSections, setOpenSections] = useState(['address', 'contact', 'logins', 'notes']);
	const [users, setUsers] = useState<User[]>([]);
	const [labels, setLabels] = useState<Label[]>([]);

	const normalize = (data: MetadataType | null) => {
		if (!data) return data;
		return {
			...data,
			logins: data.logins?.map((l) => ({ ...l, password: undefined })),
		};
	};

	const [copied, setCopied] = useState(false);

	const share = async () => {
		const res = await fetch('/api/projects/metadata', {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client,
				createShareCode: true,
			}),
		});

		if (!res.ok) return;

		const { shareCode } = await res.json();

		const url = new URL(window.location.href);

		url.searchParams.set('code', shareCode);

		await navigator.clipboard.writeText(url.toString());

		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const hasChanges = JSON.stringify(normalize(metadata)) !== JSON.stringify(normalize(initialMetadata));

	useEffect(() => {
		if (!metadata) {
			return;
		}

		onActionsChange?.({
			save,
			share,
			hasChanges,
			saving,
			saved,
			label: metadata.label ?? '',
			setLabel: (label: string) =>
				setMetadata((prev) => ({
					...prev!,
					label,
				})),
			labels,
		});
	}, [onActionsChange, hasChanges, saving, saved, metadata, labels]);

	useEffect(() => {
		(async () => {
			const res = await fetch(`/api/projects/metadata?client=${encodeURIComponent(client)}&reveal=true`);
			const data = await res.json();

			const migrated = {
				...data,
				logins: Array.isArray(data?.logins)
					? data.logins
					: [
							...(data?.logins?.company ?? []).map((login: any) => ({
								...login,
								id: login.id ?? crypto.randomUUID(),
								visibleToClient: false,
							})),
							...(data?.logins?.client ?? []).map((login: any) => ({
								...login,
								id: login.id ?? crypto.randomUUID(),
								visibleToClient: true,
							})),
						],
			};

			setMetadata(migrated);
			setInitialMetadata(migrated);
		})();

		fetch('/api/users')
			.then((r) => r.json())
			.then((d) => setUsers(d.users ?? []));
		fetch('/api/settings/projects')
			.then((r) => r.json())
			.then((d) => setLabels(d.labels ?? []));
	}, [client]);

	if (!metadata) return null;

	/* ---------- STYLES ---------- */

	const section = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm p-6';

	const collapseAnimation = {
		initial: {
			height: 0,
			opacity: 0,
		},
		animate: {
			height: 'auto',
			opacity: 1,
		},
		exit: {
			height: 0,
			opacity: 0,
		},
		transition: {
			duration: 0.15,
		},
	};

	/* ---------- LOGIC ---------- */

	const toggleSection = (key: string) => {
		setOpenSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
	};

	const save = async () => {
		setSaving(true);
		setSaved(false);

		const payload = {
			...metadata,
			logins: metadata.logins?.map((l) => ({
				id: l.id,
				label: l.label ?? '',
				link: l.link ?? '',
				username: l.username ?? '',
				password: l.password || undefined,
				client: l.client ?? false,
			})),
		};

		const res = await fetch('/api/projects/metadata', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ client, data: payload }),
		});

		if (!res.ok) {
			setSaving(false);
			return;
		}

		const refreshed = await fetch(`/api/projects/metadata?client=${client}`).then((r) => r.json());

		setMetadata(refreshed);
		setInitialMetadata(refreshed);

		setSaving(false);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	/* ---------- UI ---------- */

	return (
		<section className='space-y-6'>
			<div className={section}>
				<Button onClick={() => toggleSection('address')} className='w-full text-left justify-start' variant='secondary'>
					<span>Address</span>

					{openSections.includes('address') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</Button>

				<AnimatePresence initial={false}>
					{openSections.includes('address') && (
						<motion.div {...collapseAnimation} className='pt-5 overflow-hidden'>
							<APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!} libraries={['places']}>
								<Address
									value={metadata.address}
									onChange={(address) =>
										setMetadata({
											...metadata,
											address,
										})
									}
								/>
							</APIProvider>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className={section}>
				<Button onClick={() => toggleSection('contact')} className='w-full text-left justify-start' variant='secondary'>
					<span>Contact</span>

					{openSections.includes('contact') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</Button>

				<AnimatePresence initial={false}>
					{openSections.includes('contact') && (
						<motion.div {...collapseAnimation} className='pt-5 overflow-hidden'>
							<Contact
								contacts={metadata.contacts ?? []}
								onChange={(contacts) =>
									setMetadata({
										...metadata,
										contacts,
									})
								}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* LOGINS */}
			<div className={section}>
				<Button onClick={() => toggleSection('logins')} className='w-full text-left justify-start' variant='secondary'>
					<span>Logins</span>

					{openSections.includes('logins') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</Button>

				<AnimatePresence initial={false}>
					{openSections.includes('logins') && (
						<motion.div {...collapseAnimation} className='pt-5 overflow-hidden'>
							<Login
								value={metadata.logins ?? []}
								onChange={(logins) =>
									setMetadata({
										...metadata,
										logins,
									})
								}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{!hasWrite && (
				<div className={section}>
					<Button onClick={() => toggleSection('access')} className='w-full text-left justify-start' variant='secondary'>
						<span>Access</span>

						{openSections.includes('access') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</Button>

					<AnimatePresence initial={false}>
						{openSections.includes('access') && (
							<motion.div {...collapseAnimation} className='pt-5 overflow-hidden'>
								<Access
									users={users}
									value={(metadata as any).access ?? []}
									onChange={(next: string[]) =>
										setMetadata({
											...metadata,
											access: next,
										} as any)
									}
								/>
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			)}

			{/* NOTES */}
			<div className={section}>
				<Button onClick={() => toggleSection('notes')} className='w-full text-left justify-start' variant='secondary'>
					<span>Notes</span>

					{openSections.includes('notes') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</Button>

				<AnimatePresence initial={false}>
					{openSections.includes('notes') && (
						<motion.div {...collapseAnimation} className='pt-5 overflow-hidden'>
							<textarea
								className={'w-full'}
								disabled={hasWrite}
								value={metadata.notes ?? ''}
								onChange={(e) =>
									setMetadata({
										...metadata,
										notes: e.target.value,
									})
								}
							/>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</section>
	);
}
