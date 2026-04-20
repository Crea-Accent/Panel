/** @format */

import { NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_PATH = path.join(DATA_DIR, 'projects.json');

const SECRET = process.env.SECRET_KEY || 'change-this';
const key = crypto.createHash('sha256').update(SECRET).digest();

/* ================= ENCRYPT / DECRYPT ================= */

function encrypt(text: string) {
	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
	const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
	return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(payload: string) {
	const [ivHex, contentHex] = payload.split(':');
	const iv = Buffer.from(ivHex, 'hex');
	const content = Buffer.from(contentHex, 'hex');

	const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);
	const decrypted = Buffer.concat([decipher.update(content), decipher.final()]);

	return decrypted.toString();
}

/* ================= HELPERS ================= */

function loadProjectsPath(): string {
	const raw = fs.readFileSync(PROJECTS_PATH, 'utf8');
	const parsed = JSON.parse(raw);
	return path.resolve(process.cwd(), parsed.path);
}

function resolveProjectFolder(client: string, base: string) {
	const folder = path.resolve(base, client);
	if (!folder.startsWith(base)) throw new Error('Forbidden');
	return folder;
}

function metadataPath(folder: string) {
	return path.join(folder, 'metadata.json');
}

/* ================= LOGIN PROCESS ================= */

function processLogins(existing: any, incoming: any) {
	const result: any = { company: [], client: [] };

	for (const type of ['company', 'client']) {
		const prev = existing[type] ?? [];
		const next = incoming?.[type] ?? prev;

		result[type] = next.map((current: any, i: number) => {
			const old = prev[i];

			let passwordEncrypted = old?.passwordEncrypted;

			if (current.password === '') {
				passwordEncrypted = undefined;
			} else if (current.password) {
				passwordEncrypted = encrypt(current.password);
			}

			return {
				label: current.label ?? '',
				link: current.link ?? '',
				username: current.username ?? '',
				passwordEncrypted,
			};
		});
	}

	return result;
}

/* ================= GET ================= */

export async function GET(req: NextRequest) {
	const client = req.nextUrl.searchParams.get('client')!;
	const reveal = req.nextUrl.searchParams.get('reveal') === 'true';

	const base = loadProjectsPath();
	const folder = resolveProjectFolder(client, base);
	const file = metadataPath(folder);

	const data = JSON.parse(fs.readFileSync(file, 'utf8'));

	if (reveal) {
		for (const type of ['company', 'client']) {
			for (const login of data.logins[type]) {
				if (login.passwordEncrypted) {
					login.password = decrypt(login.passwordEncrypted);
				}
			}
		}
	}

	for (const type of ['company', 'client']) {
		for (const login of data.logins[type]) {
			delete login.passwordEncrypted;
		}
	}

	return NextResponse.json(data);
}

/* ================= PATCH ================= */

export async function PATCH(req: NextRequest) {
	const { client, data } = await req.json();

	const base = loadProjectsPath();
	const folder = resolveProjectFolder(client, base);
	const file = metadataPath(folder);

	const existing = JSON.parse(fs.readFileSync(file, 'utf8'));

	const updated = {
		...existing,
		...data,
		logins: processLogins(existing.logins, data.logins),
		updatedAt: new Date().toISOString(),
	};

	fs.writeFileSync(file, JSON.stringify(updated, null, 2));

	return NextResponse.json({ ok: true });
}
