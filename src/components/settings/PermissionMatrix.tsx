/** @format */

'use client';

import { PERMISSIONS } from '@/lib/permissions';
import { motion } from 'framer-motion';

type Props = {
	value: string[];
	onChange: (next: string[]) => void;
	compareWith?: string[]; // optional (for user override highlighting)
};

export default function PermissionMatrix({ value, onChange, compareWith }: Props) {
	const domains = Array.from(new Set(PERMISSIONS.map((p) => p.key.split('.')[0])));

	function has(domain: string, type: 'read' | 'write') {
		return value.includes(`${domain}.${type}`);
	}

	function toggle(domain: string, type: 'read' | 'write') {
		const key = `${domain}.${type}`;
		const exists = value.includes(key);

		let next = [...value];

		if (exists) {
			next = next.filter((p) => p !== key);
		} else {
			next.push(key);

			// write implies read
			if (type === 'write' && !next.includes(`${domain}.read`)) {
				next.push(`${domain}.read`);
			}
		}

		onChange(next);
	}

	function isOverride(domain: string, type: 'read' | 'write') {
		if (!compareWith) return false;

		const roleHas = compareWith.includes(`${domain}.${type}`);
		const userHas = value.includes(`${domain}.${type}`);

		return roleHas !== userHas;
	}

	return (
		<div className='border border-gray-200 rounded-xl overflow-hidden'>
			{/* Header */}
			<div className='grid grid-cols-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3'>
				<div>Permission</div>
				<div className='text-center'>Read</div>
				<div className='text-center'>Write</div>
			</div>

			{/* Rows */}
			{domains.map((domain) => (
				<motion.div key={domain} layout className='grid grid-cols-3 items-center px-4 py-3 border-t border-gray-100 text-sm'>
					<div className='capitalize font-medium'>{domain}</div>

					{(['read', 'write'] as const).map((type) => {
						const active = has(domain, type);
						const override = isOverride(domain, type);

						return (
							<div key={type} className='flex justify-center'>
								<button
									onClick={() => toggle(domain, type)}
									className={`w-5 h-5 rounded border transition ${active ? 'bg-black border-black' : 'border-gray-300'} ${override ? 'ring-2 ring-yellow-400' : ''}`}
								/>
							</div>
						);
					})}
				</motion.div>
			))}
		</div>
	);
}
