/** @format */

import { NextRequest, NextResponse } from 'next/server';

import AdmZip from 'adm-zip';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'settings.json');

function loadSettings() {
	if (!fs.existsSync(SETTINGS_PATH)) {
		return { basePath: '', requiredFolders: [] };
	}
	try {
		return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
	} catch {
		return { basePath: '', requiredFolders: [] };
	}
}

// DDMMYYYY
function todayStamp() {
	const d = new Date();
	const dd = String(d.getDate()).padStart(2, '0');
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const yyyy = d.getFullYear();
	return `${dd}${mm}${yyyy}`;
}

export async function POST(request: NextRequest) {
	const settings = loadSettings();

	if (!settings.basePath) {
		return NextResponse.json({ error: 'No basePath configured' }, { status: 400 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const rawClient = formData.get('client') as string | null;
	const kind = formData.get('kind') as string | null;
	const initials = formData.get('initials') as string | null;

	if (!file || !rawClient || !kind) {
		return NextResponse.json({ error: 'Missing file, client, or kind' }, { status: 400 });
	}

	const client = decodeURIComponent(rawClient);
	const baseClientDir = path.join(settings.basePath, client);

	if (!fs.existsSync(baseClientDir)) {
		fs.mkdirSync(baseClientDir, { recursive: true });
	}

	const buffer = Buffer.from(await file.arrayBuffer());

	// -------- SCHEMAS --------
	if (kind === 'schemas') {
		const targetDir = path.join(baseClientDir, 'schemas');

		if (!fs.existsSync(targetDir)) {
			fs.mkdirSync(targetDir, { recursive: true });
		}

		const targetPath = path.join(targetDir, file.name);
		fs.writeFileSync(targetPath, buffer);

		return NextResponse.json({
			ok: true,
			savedAs: targetPath,
			kind: 'schemas',
		});
	}

	// -------- PROGRAMMATION --------
	if (kind === 'programmation') {
		if (!initials) {
			return NextResponse.json({ error: 'Initials required for programmation uploads' }, { status: 400 });
		}

		const progRoot = path.join(baseClientDir, 'programmation');

		if (!fs.existsSync(progRoot)) {
			fs.mkdirSync(progRoot, { recursive: true });
		}

		const stamp = todayStamp();
		const projectName = `${client} ${stamp} ${initials.toUpperCase()}`;
		const projectDir = path.join(progRoot, projectName);

		if (fs.existsSync(projectDir)) {
			fs.rmSync(projectDir, { recursive: true, force: true });
		}

		fs.mkdirSync(projectDir);

		const zip = new AdmZip(buffer);
		zip.extractAllTo(projectDir, true);

		return NextResponse.json({
			ok: true,
			savedAs: projectDir,
			name: projectName,
			kind: 'programmation',
		});
	}

	// -------- PICTURES (new, but boring in a good way) --------
	if (kind === 'pictures') {
		const picsDir = path.join(baseClientDir, 'pictures');

		if (!fs.existsSync(picsDir)) {
			fs.mkdirSync(picsDir, { recursive: true });
		}

		const targetPath = path.join(picsDir, file.name);
		fs.writeFileSync(targetPath, buffer);

		return NextResponse.json({
			ok: true,
			savedAs: targetPath,
			kind: 'pictures',
		});
	}

	return NextResponse.json({ error: `Unknown upload kind: ${kind}` }, { status: 400 });
}
