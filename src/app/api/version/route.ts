/** @format */

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const PACKAGE_PATH = path.join(process.cwd(), 'package.json');

// 🔧 change this to your repo
const REPO_OWNER = 'Crea-Accent';
const REPO_NAME = 'Panel';
const BRANCH = 'main';

function getLocalVersion(): string {
	const pkg = JSON.parse(fs.readFileSync(PACKAGE_PATH, 'utf8'));
	return pkg.version;
}

async function getRemoteVersion(): Promise<string> {
	const res = await fetch(`https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/package.json`, { cache: 'no-store' });

	if (!res.ok) {
		throw new Error('Failed to fetch remote package.json');
	}

	const pkg = await res.json();
	return pkg.version;
}

/* =========================
   GET → Version Check
========================= */

export async function GET() {
	try {
		const localVersion = getLocalVersion();
		const remoteVersion = await getRemoteVersion();

		return NextResponse.json({
			localVersion,
			remoteVersion,
			upToDate: localVersion === remoteVersion,
		});
	} catch (err: unknown) {
		return NextResponse.json({ error: (err as Error).message }, { status: 500 });
	}
}

/* =========================
   PATCH → Run Update
========================= */

import { spawn } from 'child_process';

export async function PATCH() {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			const send = (message: string) => {
				controller.enqueue(encoder.encode(`data: ${message}\n\n`));
			};

			send('Starting update...');

			const child = spawn('cmd.exe', ['/c', 'git pull && npm i && npm run build && pm2 reload 3']);

			child.stdout.on('data', (data) => {
				send(data.toString());
			});

			child.stderr.on('data', (data) => {
				send(`ERROR: ${data.toString()}`);
			});

			child.on('close', () => {
				send('Update complete! Refresh page.');
				controller.close();
			});
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	});
}
