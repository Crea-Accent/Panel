/** @format */

import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_PATH = path.join(DATA_DIR, 'projects.json');
const SALT_ROUNDS = 10;

/* ================= TYPES ================= */

type LoginInput = {
	label: string;
	link: string;
	username: string;
	password?: string; // plaintext from frontend
	passwordHash?: string; // stored only
};

type Metadata = {
	name: string;
	createdAt: string;
	updatedAt: string;
	label?: string;
	address: {
		street: string;
		number: string;
		postalCode: string;
		city: string;
		country: string;
	};

	contact: {
		contactPersons: {
			name: string;
			role: string;
		}[];
		phones: string[];
		emails: string[];
	};

	logins: {
		company: LoginInput[];
		client: LoginInput[];
	};

	notes: string;
};

/* ================= HELPERS ================= */

function loadProjectsPath(): string | null {
	if (!fs.existsSync(PROJECTS_PATH)) return null;

	try {
		const raw = fs.readFileSync(PROJECTS_PATH, 'utf8');
		const parsed = JSON.parse(raw);

		if (typeof parsed.path !== 'string') return null;

		// resolve relative to app root
		return path.resolve(process.cwd(), parsed.path);
	} catch {
		return null;
	}
}

function resolveProjectFolder(client: string, base: string) {
	const folder = path.resolve(base, client);

	if (!folder.startsWith(path.resolve(base))) {
		throw new Error('Forbidden');
	}

	return folder;
}

function metadataPath(folder: string) {
	return path.join(folder, 'metadata.json');
}

function createDefaultMetadata(projectName: string): Metadata {
	const now = new Date().toISOString();

	return {
		name: projectName,
		createdAt: now,
		updatedAt: now,
		label: '',
		address: {
			street: '',
			number: '',
			postalCode: '',
			city: '',
			country: 'Belgium',
		},

		contact: {
			contactPersons: [],
			phones: [],
			emails: [],
		},

		logins: {
			company: [],
			client: [],
		},

		notes: '',
	};
}

async function hashLogins(logins: Metadata['logins']) {
	for (const type of ['company', 'client'] as const) {
		for (const login of logins[type]) {
			if (login.password) {
				login.passwordHash = await bcrypt.hash(login.password, SALT_ROUNDS);
				delete login.password;
			}
		}
	}
}

function stripSensitive(metadata: Metadata): Metadata {
	const clone: Metadata = JSON.parse(JSON.stringify(metadata));

	for (const type of ['company', 'client'] as const) {
		for (const login of clone.logins[type]) {
			delete login.passwordHash;
		}
	}

	return clone;
}

/* ================= GET ================= */

export async function GET(request: NextRequest) {
	const client = request.nextUrl.searchParams.get('client');
	if (!client) {
		return NextResponse.json({ error: 'Missing client' }, { status: 400 });
	}

	const base = loadProjectsPath();
	if (!base) {
		return NextResponse.json({ error: 'Projects path not configured' }, { status: 500 });
	}

	try {
		const folder = resolveProjectFolder(client, base);
		const file = metadataPath(folder);

		if (!fs.existsSync(file)) {
			const metadata = createDefaultMetadata(client);
			fs.writeFileSync(file, JSON.stringify(metadata, null, 2), 'utf8');
			return NextResponse.json(stripSensitive(metadata));
		}

		const raw = fs.readFileSync(file, 'utf8');
		const parsed: Metadata = JSON.parse(raw);

		return NextResponse.json(stripSensitive(parsed));
	} catch {
		return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
	}
}

/* ================= POST ================= */

export async function POST(request: NextRequest) {
	const { client } = await request.json();

	if (!client) {
		return NextResponse.json({ error: 'Missing client' }, { status: 400 });
	}

	const base = loadProjectsPath();
	if (!base) {
		return NextResponse.json({ error: 'Projects path not configured' }, { status: 500 });
	}

	try {
		const folder = resolveProjectFolder(client, base);
		const file = metadataPath(folder);

		if (fs.existsSync(file)) {
			return NextResponse.json({ error: 'Metadata already exists' }, { status: 400 });
		}

		const metadata = createDefaultMetadata(client);

		fs.writeFileSync(file, JSON.stringify(metadata, null, 2), 'utf8');

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Create failed' }, { status: 500 });
	}
}

/* ================= PATCH ================= */

export async function PATCH(request: NextRequest) {
	const { client, data } = await request.json();

	if (!client || !data) {
		return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
	}

	const base = loadProjectsPath();
	if (!base) {
		return NextResponse.json({ error: 'Projects path not configured' }, { status: 500 });
	}

	try {
		const folder = resolveProjectFolder(client, base);
		const file = metadataPath(folder);

		if (!fs.existsSync(file)) {
			return NextResponse.json({ error: 'Metadata not found' }, { status: 404 });
		}

		const raw = fs.readFileSync(file, 'utf8');
		const existing: Metadata = JSON.parse(raw);

		const updated: Metadata = {
			...existing,
			...data,
			updatedAt: new Date().toISOString(),
		};

		await hashLogins(updated.logins);

		fs.writeFileSync(file, JSON.stringify(updated, null, 2), 'utf8');

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Update failed' }, { status: 500 });
	}
}

/* ================= DELETE ================= */

export async function DELETE(request: NextRequest) {
	const client = request.nextUrl.searchParams.get('client');

	if (!client) {
		return NextResponse.json({ error: 'Missing client' }, { status: 400 });
	}

	const base = loadProjectsPath();
	if (!base) {
		return NextResponse.json({ error: 'Projects path not configured' }, { status: 500 });
	}

	try {
		const folder = resolveProjectFolder(client, base);
		const file = metadataPath(folder);

		if (fs.existsSync(file)) {
			fs.unlinkSync(file);
		}

		return NextResponse.json({ ok: true });
	} catch {
		return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
	}
}
