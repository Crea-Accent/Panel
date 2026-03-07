/** @format */

import { NextRequest, NextResponse } from 'next/server';

import AdmZip from 'adm-zip';
import { authConfig } from '@/lib/auth';
import fs from 'fs';
import { getServerSession } from 'next-auth';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'projects.json');

function loadSettings() {
	if (!fs.existsSync(SETTINGS_PATH)) {
		return { path: '', dateFormat: 'DDMMYYYY' };
	}

	try {
		return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
	} catch {
		return { path: '', dateFormat: 'DDMMYYYY' };
	}
}

function formatDate(format?: string) {
	const d = new Date();
	const DD = String(d.getDate()).padStart(2, '0');
	const MM = String(d.getMonth() + 1).padStart(2, '0');
	const YYYY = d.getFullYear();

	return (format || 'DDMMYYYY').replace('DD', DD).replace('MM', MM).replace('YYYY', String(YYYY));
}

function getInitials(name?: string | null) {
	if (!name) return 'XX';

	return name
		.trim()
		.split(/\s+/)
		.map((p) => p[0]?.toUpperCase() || '')
		.join('');
}

function resolveUniquePath(dir: string, project: string, stamp: string, initials: string, ext = '') {
	let index = 0;

	while (true) {
		const name = index === 0 ? `${project} ${stamp} ${initials}${ext}` : `${project} ${stamp}_${index} ${initials}${ext}`;

		const full = path.join(dir, name);

		if (!fs.existsSync(full)) return full;

		index++;
	}
}

export async function POST(request: NextRequest) {
	const session = await getServerSession(authConfig);

	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const settings = loadSettings();

	if (!settings.path) {
		return NextResponse.json({ error: 'No path configured' }, { status: 400 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const rawClient = formData.get('client') as string | null;
	const kind = formData.get('kind') as string | null;

	if (!file || !rawClient || !kind) {
		return NextResponse.json({ error: 'Missing file, client or kind' }, { status: 400 });
	}

	const client = path.basename(decodeURIComponent(rawClient));
	const projectDir = path.join(settings.path, client);
	const targetDir = path.join(projectDir, kind);

	fs.mkdirSync(targetDir, { recursive: true });

	const buffer = Buffer.from(await file.arrayBuffer());
	const stamp = formatDate(settings.dateFormat);
	const initials = getInitials(session.user.name);
	const projectName = path.basename(client);

	// ---------- PROGRAMMATION ----------
	if (kind === 'programmation') {
		const uniqueDir = resolveUniquePath(targetDir, projectName, stamp, initials);

		fs.mkdirSync(uniqueDir);

		const zip = new AdmZip(buffer);
		zip.extractAllTo(uniqueDir, true);

		return NextResponse.json({
			ok: true,
			savedAs: uniqueDir,
			name: path.basename(uniqueDir),
			kind,
		});
	}

	// ---------- NORMAL FILE ----------
	const ext = path.extname(file.name);
	const uniquePath = resolveUniquePath(targetDir, projectName, stamp, initials, ext);

	fs.writeFileSync(uniquePath, buffer);

	return NextResponse.json({
		ok: true,
		savedAs: uniquePath,
		kind,
	});
}
