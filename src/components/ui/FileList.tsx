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

export default function FileList({ files, users = [], onDownload }: Props) {
	return (
		<div className='space-y-2'>
			{files.map((file, index) => (
				<motion.div
					key={file.path}
					initial={{
						opacity: 0,
						x: -8,
					}}
					animate={{
						opacity: 1,
						x: 0,
					}}
					transition={{
						delay: index * 0.01,
					}}>
					<ProjectFile compact file={file} users={users} onDownload={() => onDownload(file.path)} />
				</motion.div>
			))}
		</div>
	);
}
