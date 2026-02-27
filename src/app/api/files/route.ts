/** @format */

import { NextRequest, NextResponse } from 'next/server';

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

function isClientRoot(basePath: string, view: string) {
	// remove basePath from the start
	const relative = path.relative(basePath, view);

	// if there's exactly ONE segment, it's a client folder
	// e.g. "ACME BVBA" -> client root ✅
	// e.g. "ACME BVBA/schemas" -> NOT client root ❌
	return relative && !relative.includes(path.sep);
}

export async function GET(request: NextRequest) {
	const settings = loadSettings();

	if (!settings.basePath) {
		return NextResponse.json([]);
	}

	const url = new URL(request.url);
	const rawView = url.searchParams.get('view') || settings.basePath;
	const view = decodeURIComponent(rawView);

	if (!view.startsWith(settings.basePath)) {
		return NextResponse.json({ error: 'Forbidden base path' }, { status: 403 });
	}

	// 🔥 NEW BEHAVIOR: only create folders at the CLIENT ROOT
	if (view !== settings.basePath && isClientRoot(settings.basePath, view) && settings.requiredFolders.length > 0) {
		try {
			if (!fs.existsSync(view)) {
				fs.mkdirSync(view, { recursive: true });
			}

			for (const folder of settings.requiredFolders) {
				const full = path.join(view, folder);
				if (!fs.existsSync(full)) {
					fs.mkdirSync(full);
				}
			}
		} catch {
			return NextResponse.json({ error: 'Could not prepare folder structure' }, { status: 500 });
		}
	}

	let entries: fs.Dirent[];

	try {
		entries = fs.readdirSync(view, { withFileTypes: true });
	} catch {
		return NextResponse.json({ error: 'Access denied' }, { status: 403 });
	}

	const result = entries.map((entry) => {
		const fullPath = path.join(view, entry.name);
		let accessible = true;

		if (entry.isDirectory()) {
			try {
				fs.accessSync(fullPath, fs.constants.R_OK);
			} catch {
				accessible = false;
			}
		}

		return {
			path: fullPath,
			name: entry.name,
			type: entry.isDirectory() ? 'directory' : 'file',
			accessible,
		};
	});

	return NextResponse.json(result);
}
