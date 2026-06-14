/** @format */
'use client';

import ProjectFile from './File';
import { User } from 'next-auth';
import { motion } from 'framer-motion';

type Props = {
	files: any[];
	users?: User[];
	onDownload: (path: string) => void;
};

export default function FileGrid({ files, users = [], onDownload }: Props) {
	return (
		<div className='grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4'>
			{files.map((file, index) => (
				<motion.div
					key={file.path}
					initial={{
						opacity: 0,
						y: 8,
					}}
					animate={{
						opacity: 1,
						y: 0,
					}}
					transition={{
						delay: index * 0.02,
					}}>
					<ProjectFile file={file} users={users} onDownload={() => onDownload(file.path)} />
				</motion.div>
			))}
		</div>
	);
}
