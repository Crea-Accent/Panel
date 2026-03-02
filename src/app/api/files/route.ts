/** @format */

import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_PATH = path.join(DATA_DIR, 'files.json');
const PROJECTS_PATH = path.join(DATA_DIR, 'projects.json');

type ProjectsConfig = {
	path: string;
	requiredFolders: string[];
};

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

export function loadProjects(): ProjectsConfig | null {
	try {
		if (!fs.existsSync(PROJECTS_PATH)) {
			return null;
		}

		const raw = fs.readFileSync(PROJECTS_PATH, 'utf-8');
		const parsed = JSON.parse(raw);

		return {
			path: typeof parsed.path === 'string' ? parsed.path : '',
			requiredFolders: Array.isArray(parsed.requiredFolders) ? parsed.requiredFolders.filter((f: unknown) => typeof f === 'string') : [],
		};
	} catch {
		return null;
	}
}

function resolveSafe(targetPath: string, basePath: string) {
	const resolved = path.resolve(targetPath);
	const base = path.resolve(basePath);

	if (!resolved.startsWith(base)) {
		throw new Error('Forbidden path');
	}

	return resolved;
}

function resolveAgainstCorrectRoot(target: string, settingsPath: string, projectsPath?: string) {
	const decoded = decodeURIComponent(target);
	const absolute = path.resolve(decoded);

	if (projectsPath && absolute.startsWith(path.resolve(projectsPath))) {
		return resolveSafe(absolute, projectsPath);
	}

	return resolveSafe(absolute, settingsPath);
}

export async function GET(request: NextRequest) {
	const settings = loadSettings();
	const projects = loadProjects();

	const url = new URL(request.url);
	const rawView = url.searchParams.get('view');

	if (!rawView) {
		return NextResponse.json({ error: 'Missing view parameter' }, { status: 400 });
	}

	let resolved: string;

	try {
		resolved = resolveAgainstCorrectRoot(rawView, settings.path, projects?.path);
	} catch {
		return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
	}

	// ✅ Create required folders + metadata ONLY in project root folder
	if (projects?.path && Array.isArray(projects.requiredFolders)) {
		const projectsRoot = path.resolve(projects.path);
		const current = path.resolve(resolved);

		// Must be directly inside projects root
		const relative = path.relative(projectsRoot, current);

		const isProjectRootFolder = relative && !relative.startsWith('..') && !path.isAbsolute(relative) && relative.split(path.sep).length === 1;

		if (isProjectRootFolder) {
			// 1️⃣ Ensure required folders exist
			for (const folder of projects.requiredFolders) {
				if (!folder.trim()) continue;

				const folderPath = path.join(current, folder);

				if (!fs.existsSync(folderPath)) {
					fs.mkdirSync(folderPath, { recursive: true });
				}
			}

			// 2️⃣ Ensure metadata.json exists
			const metadataPath = path.join(current, 'metadata.json');

			if (!fs.existsSync(metadataPath)) {
				const defaultMetadata = {
					name: path.basename(current),
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};

				fs.writeFileSync(metadataPath, JSON.stringify(defaultMetadata, null, 2), 'utf-8');
			}
		}
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
	const projects = loadProjects();

	const url = new URL(request.url);
	const rawPath = url.searchParams.get('path');

	if (!rawPath) {
		return NextResponse.json({ error: 'Missing path' }, { status: 400 });
	}

	let resolved: string;

	try {
		resolved = resolveAgainstCorrectRoot(rawPath, settings.path, projects?.path);
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
	const projects = loadProjects();

	const body = await request.json();
	const { oldPath, newName } = body || {};

	if (!oldPath || !newName) {
		return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	}

	let resolvedOld: string;

	try {
		resolvedOld = resolveAgainstCorrectRoot(oldPath, settings.path, projects?.path);
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
	const projects = loadProjects();

	const formData = await request.formData();
	const file = formData.get('file') as File | null;
	const rawDir = formData.get('dir') as string | null;

	if (!file || !rawDir) {
		return NextResponse.json({ error: 'Missing data' }, { status: 400 });
	}

	let dir: string;

	try {
		dir = resolveAgainstCorrectRoot(rawDir, settings.path, projects?.path);
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
