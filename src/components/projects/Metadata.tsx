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
	name?: string;
	createdAt?: string;
	updatedAt?: string;
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
	notes?: string;
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

	const sectionBase = 'bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden';

	const input = 'w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/10 focus:bg-white transition';

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

	return (
		<section className='space-y-6'>
			<header className='flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600'>
						<Folder size={18} />
					</div>
					<div>
						<h2 className='text-xl font-semibold'>Project Information</h2>
						<p className='text-sm text-zinc-500'>Last updated: {metadata.updatedAt ? new Date(metadata.updatedAt).toLocaleString() : '—'}</p>
					</div>
				</div>

				<button onClick={save} className='px-5 py-2 rounded-xl bg-black text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition'>
					{saving ? 'Saving…' : saved ? <Check size={16} /> : 'Save'}
				</button>
			</header>

			{/* ADDRESS */}
			<div className={sectionBase}>
				<button onClick={() => toggleSection('address')} className='w-full flex justify-between items-center p-5'>
					<span className='font-medium'>Address</span>
					{openSections.includes('address') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</button>

				<AnimatePresence>
					{openSections.includes('address') && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='px-5 pb-5 grid md:grid-cols-3 gap-4'>
							{['street', 'number', 'postalCode', 'city', 'country'].map((field) => (
								<input
									key={field}
									className={input}
									placeholder={field}
									value={(metadata.address as never)?.[field] ?? ''}
									onChange={(e) =>
										setMetadata({
											...metadata,
											address: {
												...metadata.address,
												[field]: e.target.value,
											},
										})
									}
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* CONTACT */}
			<div className={sectionBase}>
				<button onClick={() => toggleSection('contact')} className='w-full flex justify-between items-center p-5'>
					<span className='font-medium'>Contact</span>
					{openSections.includes('contact') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
				</button>

				<AnimatePresence>
					{openSections.includes('contact') && (
						<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='px-5 pb-5 space-y-4'>
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
											className='text-xs flex items-center gap-1 text-zinc-600 hover:text-black'>
											<Plus size={14} /> Add
										</button>
									</div>

									{metadata.contact?.[type]?.map((value, i) => (
										<div key={i} className='flex gap-2'>
											<input
												className={input}
												value={value ?? ''}
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
												className='text-zinc-400 hover:text-red-500'
												onClick={() => {
													const updated = metadata.contact?.[type]?.filter((_, idx) => idx !== i) ?? [];
													setMetadata({
														...metadata,
														contact: {
															...metadata.contact,
															[type]: updated,
														},
													});
												}}>
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
				<div key={group} className={sectionBase}>
					<button onClick={() => toggleSection(group)} className='w-full flex justify-between items-center p-5'>
						<span className='font-medium capitalize'>{group} Logins</span>
						{openSections.includes(group) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
					</button>

					<AnimatePresence>
						{openSections.includes(group) && (
							<motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className='px-5 pb-5 space-y-4'>
								<button
									onClick={() =>
										setMetadata({
											...metadata,
											logins: {
												...metadata.logins,
												[group]: [
													...(metadata.logins?.[group] ?? []),
													{
														label: '',
														link: '',
														username: '',
														password: '',
													},
												],
											},
										})
									}
									className='text-xs flex items-center gap-1 text-zinc-600 hover:text-black'>
									<Plus size={14} /> Add Login
								</button>

								{metadata.logins?.[group]?.map((login, i) => {
									const key = `${group}-${i}`;
									return (
										<div key={i} className='grid md:grid-cols-4 gap-3 border border-zinc-200 rounded-xl p-4 bg-zinc-50'>
											<input
												className={input}
												placeholder='Label'
												value={login?.label ?? ''}
												onChange={(e) =>
													setMetadata({
														...metadata,
														logins: {
															...metadata.logins,
															[group]: metadata.logins?.[group]?.map((l, idx) =>
																idx === i
																	? {
																			...l,
																			label: e.target.value,
																		}
																	: l
															),
														},
													})
												}
											/>
											<input
												className={input}
												placeholder='Link'
												value={login?.link ?? ''}
												onChange={(e) =>
													setMetadata({
														...metadata,
														logins: {
															...metadata.logins,
															[group]: metadata.logins?.[group]?.map((l, idx) =>
																idx === i
																	? {
																			...l,
																			link: e.target.value,
																		}
																	: l
															),
														},
													})
												}
											/>
											<div className='relative'>
												<input
													className={input}
													placeholder='Username'
													value={login?.username ?? ''}
													onChange={(e) =>
														setMetadata({
															...metadata,
															logins: {
																...metadata.logins,
																[group]: metadata.logins?.[group]?.map((l, idx) =>
																	idx === i
																		? {
																				...l,
																				username: e.target.value,
																			}
																		: l
																),
															},
														})
													}
												/>
												<button onClick={() => copy(login?.username)} className='absolute right-2 top-2 text-zinc-400 hover:text-black'>
													<Copy size={14} />
												</button>
											</div>

											<div className='relative'>
												<input
													type={visiblePasswords[key] ? 'text' : 'password'}
													className={input}
													placeholder='New Password'
													value={login?.password ?? ''}
													onChange={(e) =>
														setMetadata({
															...metadata,
															logins: {
																...metadata.logins,
																[group]: metadata.logins?.[group]?.map((l, idx) =>
																	idx === i
																		? {
																				...l,
																				password: e.target.value,
																			}
																		: l
																),
															},
														})
													}
												/>
												<button
													onClick={() =>
														setVisiblePasswords((prev) => ({
															...prev,
															[key]: !prev[key],
														}))
													}
													className='absolute right-2 top-2 text-zinc-400 hover:text-black'>
													{visiblePasswords[key] ? <EyeOff size={14} /> : <Eye size={14} />}
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
		</section>
	);
}
