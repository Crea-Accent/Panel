/** @format */
'use client';

import { Code, Factory, File, FileArchive, FileCode2, FileSpreadsheet, FileText, Network, Workflow } from 'lucide-react';

import { FaFilePdf } from 'react-icons/fa';
import Image from 'next/image';

type Props = {
	file: { name: string; path?: string; type?: string };

	size?: number;
	height?: number | null;
	width?: number | null;
};

export default function FileIcon({ file, size = 20, height = null, width = null }: Props) {
	const ext = file.name.toLowerCase().split('.').pop();

	const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext ?? '');

	if (isImage && file.path) {
		return <Image src={`/api/files/download?path=${encodeURIComponent(file.path)}`} alt={file.name} className='rounded object-cover' width={width || size} height={height || size} unoptimized />;
	}

	if (file.type === 'directory') {
		return <Code size={size} />;
	}

	switch (ext) {
		case 'loxone':
			return <Network size={size} />;

		case 'dnc':
			return <Workflow size={size} />;

		case 'lsc':
			return <Factory size={size} />;

		case 'pdf':
			return <FaFilePdf size={size} />;

		case 'xlsx':
		case 'xls':
		case 'csv':
			return <FileSpreadsheet size={size} />;

		case 'json':
		case 'ts':
		case 'tsx':
		case 'js':
		case 'jsx':
		case 'html':
		case 'css':
			return <FileCode2 size={size} />;

		case 'zip':
		case 'rar':
		case '7z':
			return <FileArchive size={size} />;

		case 'schrack':
		case 'trik':
			return <FileText size={size} />;

		default:
			return <File size={size} />;
	}
}
