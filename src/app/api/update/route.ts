/** @format */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const PACKAGE_PATH = path.join(process.cwd(), 'package.json');

// 🔧 Repo Configuration
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

/* ==========================================================
   GET → Triggers Update & Streams Live Terminal Logs (EventSource Compatible)
========================================================== */
export async function GET() {
	const encoder = new TextEncoder();

	const stream = new ReadableStream({
		start(controller) {
			const send = (message: string) => {
				// SSE requires formatting: "data: <msg>\n\n"
				controller.enqueue(encoder.encode(`data: ${message.trim()}\n\n`));
			};

			send('Starting update pipeline...');

			// Execute Git pulling, dependency installation, and production rebuild
			const child = spawn('cmd.exe', ['/c', 'git pull && npm i && npm run build'], {
				shell: true,
				cwd: process.cwd(), // Ensures it targets the correct project root folder
			});

			child.stdout.on('data', (data) => {
				send(data.toString());
			});

			child.stderr.on('data', (data) => {
				send(`LOG: ${data.toString()}`);
			});

			child.on('close', (code) => {
				if (code === 0) {
					send('Build finished successfully! Restarting Windows Service...');

					// Uses NSSM to cleanly bounce the Windows service in a detached background instance
					// Note: Ensure your service name matches "CreaNextApp" exactly!
					spawn('cmd.exe', ['/c', 'nssm restart CreaNextApp'], {
						detached: true,
						stdio: 'ignore',
					}).unref();

					send('Service restart triggered. Connection closing.');
				} else {
					send(`Update failed with execution code ${code}`);
				}

				controller.close();
			});
		},
	});

	return new Response(stream, {
		status: 200,
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no', // Prevents proxies (like Easypanel) from buffering the text output
		},
	});
}

/* ==========================================================
   PATCH → Simple JSON Endpoint to Check Versions
========================================================== */
export async function PATCH() {
	try {
		const local = getLocalVersion();
		const remote = await getRemoteVersion();

		return NextResponse.json({
			localVersion: local,
			remoteVersion: remote,
			updateAvailable: local !== remote,
		});
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}
