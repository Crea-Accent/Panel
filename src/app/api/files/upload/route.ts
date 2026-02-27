/** @format */

import { NextRequest, NextResponse } from 'next/server';

import AdmZip from 'adm-zip';
import { authConfig } from '@/lib/auth'; // adjust if needed
import fs from 'fs';
import { getServerSession } from 'next-auth';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'projects.json');

function loadSettings() {
	if (!fs.existsSync(SETTINGS_PATH)) {
		return { basePath: '', requiredFolders: [], dateFormat: 'DDMMYYYY' };
	}
	try {
		return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
	} catch {
		return { basePath: '', requiredFolders: [], dateFormat: 'DDMMYYYY' };
	}
}

function formatDate(format?: string) {
	const d = new Date();
	const DD = String(d.getDate()).padStart(2, '0');
	const MM = String(d.getMonth() + 1).padStart(2, '0');
	const YYYY = d.getFullYear();

	const safeFormat = format || 'DDMMYYYY';

	return safeFormat.replace('DD', DD).replace('MM', MM).replace('YYYY', String(YYYY));
}

function getInitials(name?: string | null) {
	if (!name) return 'XX';

	const parts = name.trim().split(/\s+/);
	const letters = parts.map((p) => p[0]?.toUpperCase() || '');
	return letters.join('');
}

function resolveUniquePath(baseDir: string, baseName: string) {
	const finalPath = path.join(baseDir, baseName);

	if (!fs.existsSync(finalPath)) {
		return finalPath;
	}

	let i = 1;

	while (true) {
		const candidateName = baseName.replace(/(\d{8})(\s+[A-Z]+)(\.[^.]*)?$/, (_, date, initials, ext = '') => `${date}_${i}${initials}${ext}`);

		const candidate = path.join(baseDir, candidateName);

		if (!fs.existsSync(candidate)) {
			return candidate;
		}

		i++;
	}
}

export async function POST(request: NextRequest) {
	const session = await getServerSession(authConfig);

	if (!session?.user) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	}

	const settings = loadSettings();

	console.log(settings);
	if (!settings.basePath) {
		return NextResponse.json({ error: 'No basePath configured' }, { status: 400 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const rawClient = formData.get('client') as string | null;
	const kind = formData.get('kind') as string | null;

	if (!file || !rawClient || !kind) {
		return NextResponse.json({ error: 'Missing file, client, or kind' }, { status: 400 });
	}

	const client = decodeURIComponent(rawClient);
	const baseClientDir = path.join(settings.basePath, client);

	if (!fs.existsSync(baseClientDir)) {
		fs.mkdirSync(baseClientDir, { recursive: true });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const stamp = formatDate(settings.dateFormat);
	const initials = getInitials(session.user.name);

	// -------- SCHEMAS --------
	if (kind === 'schemas') {
		const targetDir = path.join(baseClientDir, 'schemas');

		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}

		const ext = path.extname(file.name);
		const baseName = `${client} ${stamp} ${initials}${ext}`;

		const uniquePath = resolveUniquePath(targetDir, baseName);

		fs.writeFileSync(uniquePath, buffer);

		return NextResponse.json({
			ok: true,
			savedAs: uniquePath,
			kind: 'schemas',
		});
	}

	// -------- PROGRAMMATION --------
	if (kind === 'programmation') {
		const progRoot = path.join(baseClientDir, 'programmation');

		if (!fs.existsSync(progRoot)) {
			fs.mkdirSync(progRoot, { recursive: true });
		}

		const baseName = `${client} ${stamp} ${initials}`;
		const uniqueDir = resolveUniquePath(progRoot, baseName);

		fs.mkdirSync(uniqueDir);

		const zip = new AdmZip(buffer);
		zip.extractAllTo(uniqueDir, true);

		return NextResponse.json({
			ok: true,
			savedAs: uniqueDir,
			name: path.basename(uniqueDir),
			kind: 'programmation',
		});
	}

	// -------- PICTURES --------
	if (kind === 'pictures') {
		const picsDir = path.join(baseClientDir, 'pictures');

		if (!fs.existsSync(picsDir)) {
			fs.mkdirSync(picsDir, { recursive: true });
		}

		const ext = path.extname(file.name);
		const baseName = `${client} ${stamp} ${initials}${ext}`;

		const uniquePath = resolveUniquePath(picsDir, baseName);

		fs.writeFileSync(uniquePath, buffer);

		return NextResponse.json({
			ok: true,
			savedAs: uniquePath,
			kind: 'pictures',
		});
	}

	return NextResponse.json({ error: `Unknown upload kind: ${kind}` }, { status: 400 });
}
