/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Eye, EyeOff, Folder, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { User } from 'next-auth';

type Login = {
	label?: string;
	link?: string;
	username?: string;
	password?: string;
	passwordEncrypted?: string;
};

type Label = {
	name: string;
	color: string;
};

type MetadataType = {
	label?: string;
	address?: {
		street?: string;
		number?: string;
		postalCode?: string;
		city?: string;
		country?: string;
	};
	contact?: {
		phones?: string[];
		emails?: string[];
	};
	logins?: {
		company?: Login[];
		client?: Login[];
	};
	updatedAt?: string;
	notes: string;
};

export default function Metadata({ client }: { client: string }) {
	const [metadata, setMetadata] = useState<MetadataType | null>(null);
	const [initialMetadata, setInitialMetadata] = useState<MetadataType | null>(null);

	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	const [openSections, setOpenSections] = useState<string[]>(['address', 'contact', 'company', 'client', 'notes']);
	const [users, setUsers] = useState<User[]>([]);
	const [labels, setLabels] = useState<Label[]>([]);
	const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

	const normalize = (data: MetadataType | null) => {
		if (!data) return data;
		return {
			...data,
			logins: {
				company: data.logins?.company?.map((l) => ({ ...l, password: undefined })),
				client: data.logins?.client?.map((l) => ({ ...l, password: undefined })),
			},
		};
	};

	const hasChanges = JSON.stringify(normalize(metadata)) !== JSON.stringify(normalize(initialMetadata));

	useEffect(() => {
		(async () => {
			const res = await fetch(`/api/projects/metadata?client=${encodeURIComponent(client)}&reveal=true`);
			const data = await res.json();

			setMetadata(data ?? {});
			setInitialMetadata(data ?? {});
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

	const section = 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden';

	const input =
		'w-full h-9 px-3 rounded-lg text-sm transition ' +
		'bg-white dark:bg-zinc-900 ' +
		'border border-zinc-200 dark:border-zinc-800 ' +
		'text-zinc-900 dark:text-zinc-100 ' +
		'placeholder:text-zinc-400 ' +
		'focus:outline-none focus:ring-2 focus:ring-(--accent)/30';

	const sectionButton = 'w-full px-5 py-4 flex justify-between items-center text-sm font-medium ' + 'text-zinc-900 dark:text-zinc-100 ' + 'hover:bg-zinc-50 dark:hover:bg-zinc-800 transition';

	const iconButton = 'h-8 w-8 flex items-center justify-center rounded-lg ' + 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ' + 'hover:bg-zinc-100 dark:hover:bg-zinc-800 transition';

	const dangerButton = 'h-8 w-8 flex items-center justify-center rounded-lg ' + 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition';

	/* ---------- LOGIC ---------- */

	const toggleSection = (key: string) => {
		setOpenSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
	};

	const updateLogin = (group: 'company' | 'client', index: number, field: keyof Login, value: string) => {
		const current = metadata.logins?.[group] ?? [];
		const updated = current.map((l, i) => (i === index ? { ...l, [field]: value } : l));

		setMetadata({
			...metadata,
			logins: { ...metadata.logins, [group]: updated },
		});
	};

	const addLogin = (group: 'company' | 'client') => {
		const current = metadata.logins?.[group] ?? [];

		setMetadata({
			...metadata,
			logins: {
				...metadata.logins,
				[group]: [...current, { label: '', username: '', password: '' }],
			},
		});
	};

	const removeLogin = (group: 'company' | 'client', index: number) => {
		const current = metadata.logins?.[group] ?? [];

		setMetadata({
			...metadata,
			logins: {
				...metadata.logins,
				[group]: current.filter((_, i) => i !== index),
			},
		});
	};

	const save = async () => {
		setSaving(true);
		setSaved(false);

		const payload = {
			...metadata,
			logins: {
				company: metadata.logins?.company?.map((l) => ({
					label: l.label ?? '',
					link: l.link ?? '',
					username: l.username ?? '',
					password: l.password || undefined,
				})),
				client: metadata.logins?.client?.map((l) => ({
					label: l.label ?? '',
					link: l.link ?? '',
					username: l.username ?? '',
					password: l.password || undefined,
				})),
			},
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
			<header className='flex items-center justify-between gap-4 flex-wrap'>
				<div className='flex items-center gap-3 min-w-0'>
					<div className='h-10 w-10 rounded-xl bg-(--active-accent) dark:bg-(--accent)/30 flex items-center justify-center'>
						<Folder size={16} className='text-(--accent)' />
					</div>

					<div className='min-w-0'>
						<h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100 truncate'>Project Information</h2>
						<p className='text-xs text-zinc-500 dark:text-zinc-400'>Last updated: {metadata.updatedAt ? new Date(metadata.updatedAt).toLocaleString() : '—'}</p>
					</div>
				</div>

				<div className='flex items-center gap-2 flex-wrap justify-end'>
					{/* LABEL SELECTOR */}
					<div className='flex items-center gap-2'>
						<select
							value={metadata.label ?? ''}
							onChange={(e) =>
								setMetadata({
									...metadata,
									label: e.target.value,
								})
							}
							className='
					h-9 px-3 rounded-lg text-sm
					bg-white dark:bg-zinc-900
					border border-zinc-200 dark:border-zinc-800
					text-zinc-900 dark:text-zinc-100
					focus:outline-none
					focus:ring-2 focus:ring-(--accent)/30
				'>
							<option value=''>No status</option>
							{labels.map((l) => (
								<option key={l.name} value={l.name}>
									{l.name}
								</option>
							))}
						</select>
					</div>

					{/* SAVE BUTTON */}
					<button
						onClick={save}
						disabled={!hasChanges || saving}
						className='
				h-9 px-4 rounded-lg
				bg-(--accent) text-white
				text-sm font-medium
				hover:bg-(--hover-accent)
				disabled:opacity-50
				transition
			'>
						{saving ? 'Saving…' : saved ? <Check size={16} /> : 'Save'}
					</button>
				</div>
			</header>

			<div className={section}>
				<button onClick={() => toggleSection('address')} className={sectionButton}>
					<span>Address</span>
					{openSections.includes('address') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</button>

				<AnimatePresence>
					{openSections.includes('address') && (
						<motion.div className='px-5 pb-5 grid md:grid-cols-3 gap-4'>
							{['street', 'number', 'postalCode', 'city', 'country'].map((f) => (
								<input
									key={f}
									className={input}
									placeholder={f}
									value={(metadata.address as any)?.[f] ?? ''}
									onChange={(e) =>
										setMetadata({
											...metadata,
											address: {
												...metadata.address,
												[f]: e.target.value,
											},
										})
									}
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div className={section}>
				<button onClick={() => toggleSection('contact')} className={sectionButton}>
					<span>Contact</span>
					{openSections.includes('contact') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</button>

				<AnimatePresence>
					{openSections.includes('contact') && (
						<motion.div className='px-5 pb-5 space-y-4'>
							{(['phones', 'emails'] as const).map((type) => (
								<div key={type} className='space-y-2'>
									<div className='flex justify-between items-center'>
										<span className='text-sm font-medium capitalize'>{type}</span>

										<button
											onClick={() =>
												setMetadata({
													...metadata,
													contact: {
														...metadata.contact,
														[type]: [...(metadata.contact?.[type] ?? []), ''],
													},
												})
											}
											className='text-xs flex items-center gap-1 text-zinc-500 hover:text-(--hover-accent) transition'>
											<Plus size={14} /> Add
										</button>
									</div>

									{metadata.contact?.[type]?.map((v, i) => (
										<div key={i} className='flex gap-2'>
											<input
												className={input}
												value={v}
												onChange={(e) => {
													const updated = [...(metadata.contact?.[type] ?? [])];
													updated[i] = e.target.value;

													setMetadata({
														...metadata,
														contact: {
															...metadata.contact,
															[type]: updated,
														},
													});
												}}
											/>

											<button
												onClick={() =>
													setMetadata({
														...metadata,
														contact: {
															...metadata.contact,
															[type]: metadata.contact?.[type]?.filter((_, idx) => idx !== i) ?? [],
														},
													})
												}
												className={dangerButton}>
												<Trash2 size={16} />
											</button>
										</div>
									))}
								</div>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* LOGINS */}
			{(['company', 'client'] as const).map((group) => (
				<div key={group} className={section}>
					<button onClick={() => toggleSection(group)} className={sectionButton}>
						<span className='capitalize'>{group} Logins</span>
						{openSections.includes(group) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>

					<AnimatePresence>
						{openSections.includes(group) && (
							<motion.div className='px-5 pb-5 space-y-4'>
								<button onClick={() => addLogin(group)} className='text-xs flex items-center gap-1 text-zinc-500 hover:text-(--hover-accent)'>
									<Plus size={14} /> Add Login
								</button>

								{metadata.logins?.[group]?.map((login, i) => {
									const key = `${group}-${i}`;
									const isVisible = visiblePasswords[key];

									return (
										<div key={i} className='grid md:grid-cols-4 gap-3 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800'>
											<input className={input} placeholder='Label' value={login.label ?? ''} onChange={(e) => updateLogin(group, i, 'label', e.target.value)} />

											<input className={input} placeholder='Username' value={login.username ?? ''} onChange={(e) => updateLogin(group, i, 'username', e.target.value)} />

											<div className='relative'>
												<input
													type={isVisible ? `text` : `password`}
													className={input}
													placeholder='Password'
													value={login.password ?? ''}
													onChange={(e) => updateLogin(group, i, 'password', e.target.value)}
												/>
											</div>

											<div className='flex justify-end'>
												<button
													onClick={() =>
														setVisiblePasswords((prev) => ({
															...prev,
															[key]: !prev[key],
														}))
													}
													className={iconButton}>
													{isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
												</button>

												<button onClick={() => removeLogin(group, i)} className={dangerButton}>
													<Trash2 size={16} />
												</button>
											</div>
										</div>
									);
								})}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			))}

			<div className={section}>
				<button onClick={() => toggleSection('access')} className={sectionButton}>
					<span>Access</span>
					{openSections.includes('access') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</button>

				<AnimatePresence>
					{openSections.includes('access') && (
						<motion.div className='px-5 pb-5 space-y-4'>
							<AccessPicker
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

			{/* NOTES */}
			<div className={section}>
				<button onClick={() => toggleSection('notes')} className={sectionButton}>
					<span>Notes</span>
					{openSections.includes('notes') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</button>

				<AnimatePresence>
					{openSections.includes('notes') && (
						<motion.div className='px-5 pb-5'>
							<textarea
								className={`${input} h-50`}
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

function AccessPicker({ users, value, onChange }: { users: User[]; value: string[]; onChange: (v: string[]) => void }) {
	const [query, setQuery] = useState('');
	const [open, setOpen] = useState(false);

	const filtered = users.filter((u) => {
		const q = query.toLowerCase();
		return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
	});

	function add(id: string) {
		if (value.includes(id)) return;
		onChange([...value, id]);
		setQuery('');
		setOpen(false);
	}

	function remove(id: string) {
		onChange(value.filter((x) => x !== id));
	}

	return (
		<div className='space-y-3'>
			{/* Selected users */}
			<div className='flex flex-wrap gap-2'>
				{value.map((id) => {
					const u = users.find((x) => x.id === id);
					if (!u) return null;

					return (
						<div key={id} className='flex items-center gap-2 px-3 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm'>
							<span className='truncate max-w-[120px]'>{u.name || u.email}</span>

							<button onClick={() => remove(id)} className='text-zinc-400 hover:text-red-500'>
								<X size={14} />
							</button>
						</div>
					);
				})}
			</div>

			{/* Search input */}
			<div className='relative h-50'>
				<input
					value={query}
					onChange={(e) => {
						setQuery(e.target.value);
						setOpen(true);
					}}
					placeholder='Search users…'
					className='
						w-full h-9 px-3 rounded-lg text-sm
						bg-white dark:bg-zinc-900
						border border-zinc-200 dark:border-zinc-800
						focus:outline-none focus:ring-2 focus:ring-(--accent)/30
					'
				/>

				{/* Dropdown */}
				{open && query && (
					<div className='absolute mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-60 overflow-auto z-50'>
						{filtered.length === 0 && <div className='px-3 py-2 text-sm text-zinc-500'>No users found</div>}

						{filtered.slice(0, 8).map((u) => (
							<button key={u.id} onClick={() => add(u.id)} className='w-full text-left px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition'>
								<div className='font-medium'>{u.name || 'Unnamed'}</div>
								<div className='text-xs text-zinc-500'>{u.email}</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
