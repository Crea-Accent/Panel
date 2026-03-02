/** @format */

import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'files.json');

function loadSettings() {
	if (!fs.existsSync(SETTINGS_PATH)) {
		return { path: '' };
	}

	try {
		return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
	} catch {
		return { path: '' };
	}
}

function resolveSafe(targetPath: string, basePath: string) {
	const resolved = path.resolve(targetPath);

	if (!resolved.startsWith(path.resolve(basePath))) {
		throw new Error('Forbidden path');
	}

	return resolved;
}

export async function GET(request: NextRequest) {
	const settings = loadSettings();

	if (!settings.path) {
		return NextResponse.json({ error: 'No base path configured' }, { status: 400 });
	}

	const url = new URL(request.url);
	const rawView = url.searchParams.get('view');

	if (!rawView) {
		return NextResponse.json({ error: 'Missing view parameter' }, { status: 400 });
	}

	let resolved: string;

	try {
		resolved = resolveSafe(decodeURIComponent(rawView), settings.path);
	} catch {
		return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
	}

	let entries: fs.Dirent[];

	try {
		entries = fs.readdirSync(resolved, { withFileTypes: true });
	} catch {
		return NextResponse.json({ error: 'Access denied' }, { status: 403 });
	}

	const result = entries.map((entry) => {
		const fullPath = path.join(resolved, entry.name);

		let stats: fs.Stats | null = null;

		try {
			stats = fs.statSync(fullPath);
		} catch {
			stats = null;
		}

		return {
			path: fullPath,
			name: entry.name,
			type: entry.isDirectory() ? 'directory' : 'file',
			size: entry.isDirectory() ? null : (stats?.size ?? null),
			modified: stats?.mtime ? stats.mtime.toISOString() : null,
		};
	});

	return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
	const settings = loadSettings();
	if (!settings.path) {
		return NextResponse.json({ error: 'No base path configured' }, { status: 400 });
	}

	const url = new URL(request.url);
	const rawPath = url.searchParams.get('path');

	if (!rawPath) {
		return NextResponse.json({ error: 'Missing path' }, { status: 400 });
	}

	let resolved: string;

	try {
		resolved = resolveSafe(decodeURIComponent(rawPath), settings.path);
	} catch {
		return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
	}

	try {
		const stats = fs.statSync(resolved);

		if (stats.isDirectory()) {
			fs.rmSync(resolved, { recursive: true, force: true });
		} else {
			fs.unlinkSync(resolved);
		}

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
	}
}

export async function PATCH(request: NextRequest) {
	const settings = loadSettings();
	if (!settings.path) {
		return NextResponse.json({ error: 'No base path configured' }, { status: 400 });
	}

	const body = await request.json();
	const { oldPath, newName } = body || {};

	if (!oldPath || !newName) {
		return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	}

	let resolvedOld: string;

	try {
		resolvedOld = resolveSafe(oldPath, settings.path);
	} catch {
		return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
	}

	const dir = path.dirname(resolvedOld);
	const resolvedNew = path.join(dir, newName);

	try {
		fs.renameSync(resolvedOld, resolvedNew);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Rename failed' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	const settings = loadSettings();
	if (!settings.path) {
		return NextResponse.json({ error: 'No base path configured' }, { status: 400 });
	}

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const rawDir = formData.get('dir') as string | null;

	if (!file || !rawDir) {
		return NextResponse.json({ error: 'Missing data' }, { status: 400 });
	}

	let dir: string;

	try {
		dir = resolveSafe(decodeURIComponent(rawDir), settings.path);
	} catch {
		return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const target = path.join(dir, file.name);

	try {
		fs.writeFileSync(target, buffer);
		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
	}
}
