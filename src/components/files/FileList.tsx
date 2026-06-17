/** @format */
'use client';

import ProjectFile from '../files/File';
import { User } from 'next-auth';
import { motion } from 'framer-motion';

type Props = {
	files: any[];
	permission?: string;
	users?: User[];
	onDownload: (path: string) => void;
	onEdit: (file: any) => void;
	onDragStart?: (file: any) => void;
};

export default function FileGrid({ files, users = [], permission, onDownload, onEdit, onDragStart }: Props) {
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
					<ProjectFile compact file={file} users={users} onDownload={() => onDownload(file.path)} onEdit={() => onEdit(file)} onDragStart={onDragStart} permission={permission} />
				</motion.div>
			))}
		</div>
	);
}
