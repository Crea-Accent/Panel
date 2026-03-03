/** @format */
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, Copy, Eye, EyeOff, Folder, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type Login = {
	label?: string;
	link?: string;
	username?: string;
	password?: string;
};

type MetadataType = {
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
};

export default function Metadata({ client }: { client: string }) {
	const [metadata, setMetadata] = useState<MetadataType | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);
	const [openSections, setOpenSections] = useState<string[]>(['address', 'contact', 'company', 'client']);
	const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

	useEffect(() => {
		(async () => {
			const res = await fetch(`/api/projects/metadata?client=${encodeURIComponent(client)}`);
			const data = await res.json();
			setMetadata(data ?? {});
		})();
	}, [client]);

	if (!metadata) return null;

	const section = 'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden';

	const input =
		'w-full h-10 px-3 rounded-xl text-sm transition ' +
		'bg-gray-50 dark:bg-zinc-800 ' +
		'border border-gray-200 dark:border-zinc-700 ' +
		'text-gray-900 dark:text-zinc-100 ' +
		'placeholder:text-gray-400 dark:placeholder:text-zinc-500 ' +
		'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900';

	const toggleSection = (key: string) => {
		setOpenSections((prev) => (prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]));
	};

	const save = async () => {
		setSaving(true);
		setSaved(false);

		await fetch('/api/projects/metadata', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ client, data: metadata }),
		});

		setSaving(false);
		setSaved(true);
		setTimeout(() => setSaved(false), 2000);
	};

	const copy = (value?: string) => {
		if (!value) return;
		navigator.clipboard.writeText(value);
	};

	/* ---------------- ADDRESS ---------------- */

	const updateAddress = (field: string, value: string) => {
		setMetadata({
			...metadata,
			address: {
				...metadata.address,
				[field]: value,
			},
		});
	};

	/* ---------------- CONTACT ---------------- */

	const updateContactList = (type: 'phones' | 'emails', values: string[]) => {
		setMetadata({
			...metadata,
			contact: {
				...metadata.contact,
				[type]: values,
			},
		});
	};

	/* ---------------- LOGINS ---------------- */

	const updateLogin = (group: 'company' | 'client', index: number, field: keyof Login, value: string) => {
		const updated = metadata.logins?.[group]?.map((l, i) => (i === index ? { ...l, [field]: value } : l));

		setMetadata({
			...metadata,
			logins: {
				...metadata.logins,
				[group]: updated,
			},
		});
	};

	const addLogin = (group: 'company' | 'client') => {
		setMetadata({
			...metadata,
			logins: {
				...metadata.logins,
				[group]: [...(metadata.logins?.[group] ?? []), { label: '', link: '', username: '', password: '' }],
			},
		});
	};

	const removeLogin = (group: 'company' | 'client', index: number) => {
		setMetadata({
			...metadata,
			logins: {
				...metadata.logins,
				[group]: metadata.logins?.[group]?.filter((_, i) => i !== index),
			},
		});
	};

	return (
		<section className='space-y-6'>
			{/* HEADER */}
			<header className='flex justify-between items-center'>
				<div className='flex items-center gap-3'>
					<div className='h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center'>
						<Folder className='w-4 h-4 text-indigo-600 dark:text-indigo-400' />
					</div>
					<div>
						<h2 className='text-lg font-semibold text-gray-900 dark:text-zinc-100'>Project Information</h2>
						<p className='text-xs text-gray-500 dark:text-zinc-400'>Last updated: {metadata.updatedAt ? new Date(metadata.updatedAt).toLocaleString() : '—'}</p>
					</div>
				</div>

				<button onClick={save} className='h-10 px-4 rounded-xl bg-indigo-600 text-white text-sm font-medium flex items-center gap-2 hover:bg-indigo-500 transition'>
					{saving ? 'Saving…' : saved ? <Check size={16} /> : 'Save'}
				</button>
			</header>

			{/* ADDRESS */}
			<div className={section}>
				<button onClick={() => toggleSection('address')} className='w-full px-5 py-4 flex justify-between text-sm font-medium text-gray-900 dark:text-zinc-100'>
					<span>Address</span>
					{openSections.includes('address') ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
				</button>

				<AnimatePresence>
					{openSections.includes('address') && (
						<motion.div className='px-5 pb-5 grid md:grid-cols-3 gap-4'>
							{['street', 'number', 'postalCode', 'city', 'country'].map((f) => (
								<input key={f} className={input} placeholder={f} value={(metadata.address as never)?.[f] ?? ''} onChange={(e) => updateAddress(f, e.target.value)} />
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* CONTACT */}
			<div className={section}>
				<button onClick={() => toggleSection('contact')} className='w-full px-5 py-4 flex justify-between text-sm font-medium text-gray-900 dark:text-zinc-100'>
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
											onClick={() => updateContactList(type, [...(metadata.contact?.[type] ?? []), ''])}
											className='text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition'>
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
													updateContactList(type, updated);
												}}
											/>
											<button onClick={() => updateContactList(type, metadata.contact?.[type]?.filter((_, idx) => idx !== i) ?? [])} className='text-gray-400 hover:text-red-500 transition'>
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
					<button onClick={() => toggleSection(group)} className='w-full px-5 py-4 flex justify-between text-sm font-medium text-gray-900 dark:text-zinc-100'>
						<span className='capitalize'>{group} Logins</span>
						{openSections.includes(group) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
					</button>

					<AnimatePresence>
						{openSections.includes(group) && (
							<motion.div className='px-5 pb-5 space-y-4'>
								<button onClick={() => addLogin(group)} className='text-xs flex items-center gap-1 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition'>
									<Plus size={14} /> Add Login
								</button>

								{metadata.logins?.[group]?.map((login, i) => {
									const key = `${group}-${i}`;
									return (
										<div key={i} className='grid md:grid-cols-4 gap-3 p-4 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800'>
											<input className={input} placeholder='Label' value={login.label ?? ''} onChange={(e) => updateLogin(group, i, 'label', e.target.value)} />

											<input className={input} placeholder='Link' value={login.link ?? ''} onChange={(e) => updateLogin(group, i, 'link', e.target.value)} />

											<div className='relative'>
												<input className={input} placeholder='Username' value={login.username ?? ''} onChange={(e) => updateLogin(group, i, 'username', e.target.value)} />
												<button onClick={() => copy(login.username)} className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition'>
													<Copy size={14} />
												</button>
											</div>

											<div className='relative'>
												<input
													type={visiblePasswords[key] ? 'text' : 'password'}
													className={input}
													placeholder='Password'
													value={login.password ?? ''}
													onChange={(e) => updateLogin(group, i, 'password', e.target.value)}
												/>
												<button
													onClick={() =>
														setVisiblePasswords((prev) => ({
															...prev,
															[key]: !prev[key],
														}))
													}
													className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition'>
													{visiblePasswords[key] ? <EyeOff size={14} /> : <Eye size={14} />}
												</button>
											</div>

											<button onClick={() => removeLogin(group, i)} className='text-gray-400 hover:text-red-500 transition'>
												<Trash2 size={16} />
											</button>
										</div>
									);
								})}
							</motion.div>
						)}
					</AnimatePresence>
				</div>
			))}
		</section>
	);
}
