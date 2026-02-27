/** @format */

import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const ROLES_PATH = path.join(DATA_DIR, 'roles.json');

type Role = {
	id: string;
	name: string;
	defaultPermissions: string[];
};

function ensureFile() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}

	if (!fs.existsSync(ROLES_PATH)) {
		fs.writeFileSync(ROLES_PATH, JSON.stringify([], null, 2));
	}
}

function loadRoles(): Role[] {
	ensureFile();
	return JSON.parse(fs.readFileSync(ROLES_PATH, 'utf8'));
}

function saveRoles(roles: Role[]) {
	ensureFile();
	fs.writeFileSync(ROLES_PATH, JSON.stringify(roles, null, 2));
}

// GET
export async function GET() {
	return NextResponse.json({ roles: loadRoles() });
}

// POST
export async function POST(request: NextRequest) {
	const body = await request.json();
	const { name, defaultPermissions } = body || {};

	if (!name) {
		return NextResponse.json({ error: 'Missing role name' }, { status: 400 });
	}

	const roles = loadRoles();

	const newRole: Role = {
		id: `r_${Date.now()}`,
		name,
		defaultPermissions: defaultPermissions || [],
	};

	roles.push(newRole);
	saveRoles(roles);

	return NextResponse.json({ roles });
}

// PATCH
export async function PATCH(request: NextRequest) {
	const body = await request.json();
	const { id, name, defaultPermissions } = body || {};

	if (!id) {
		return NextResponse.json({ error: 'Missing role id' }, { status: 400 });
	}

	const roles = loadRoles();
	const index = roles.findIndex((r) => r.id === id);

	if (index === -1) {
		return NextResponse.json({ error: 'Role not found' }, { status: 404 });
	}

	if (name) roles[index].name = name;
	if (Array.isArray(defaultPermissions)) {
		roles[index].defaultPermissions = defaultPermissions;
	}

	saveRoles(roles);

	return NextResponse.json({ roles });
}

// DELETE
export async function DELETE(request: NextRequest) {
	const url = new URL(request.url);
	const id = url.searchParams.get('id');

	if (!id) {
		return NextResponse.json({ error: 'Missing role id' }, { status: 400 });
	}

	const roles = loadRoles();
	const nextRoles = roles.filter((r) => r.id !== id);

	saveRoles(nextRoles);

	return NextResponse.json({ roles: nextRoles });
}
