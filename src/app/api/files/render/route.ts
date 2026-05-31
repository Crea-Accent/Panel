/** @format */

import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
	const url = new URL(request.url);

	const rawPath = url.searchParams.get('path');

	if (!rawPath) {
		return NextResponse.json({ error: 'Missing path' }, { status: 400 });
	}

	const targetPath = decodeURIComponent(rawPath);

	if (!fs.existsSync(targetPath)) {
		return NextResponse.json({ error: 'Not found' }, { status: 404 });
	}

	const fileBuffer = fs.readFileSync(targetPath);

	const extension = path.extname(targetPath).toLowerCase();

	const mimeTypes: Record<string, string> = {
		'.pdf': 'application/pdf',
		'.png': 'image/png',
		'.jpg': 'image/jpeg',
		'.jpeg': 'image/jpeg',
		'.webp': 'image/webp',
		'.gif': 'image/gif',
	};

	return new NextResponse(fileBuffer, {
		headers: {
			'Content-Type': mimeTypes[extension] ?? 'application/octet-stream',

			'Content-Disposition': 'inline',
		},
	});
}
