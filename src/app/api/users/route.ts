/** @format */

import { NextRequest, NextResponse } from 'next/server';

import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_PATH = path.join(DATA_DIR, 'users.json');
const ROLES_PATH = path.join(DATA_DIR, 'roles.json');

type Role = {
	id: string;
	name: string;
	defaultPermissions: string[];
};

type User = {
	id: string;
	name: string;
	email: string;
	passwordHash: string;
	roleId: string;
	permissions: string[];
};

function ensureFiles() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}

	if (!fs.existsSync(USERS_PATH)) {
		fs.writeFileSync(USERS_PATH, JSON.stringify([], null, 2));
	}

	if (!fs.existsSync(ROLES_PATH)) {
		fs.writeFileSync(ROLES_PATH, JSON.stringify([], null, 2));
	}
}

function loadUsers(): User[] {
	ensureFiles();
	return JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
}

function saveUsers(users: User[]) {
	ensureFiles();
	fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

function loadRoles(): Role[] {
	ensureFiles();
	return JSON.parse(fs.readFileSync(ROLES_PATH, 'utf8'));
}

// ---------- GET ----------
export async function GET() {
	const users = loadUsers();
	const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
	return NextResponse.json({ users: safeUsers });
}

// ---------- POST (CREATE USER) ----------
export async function POST(request: NextRequest) {
	const body = await request.json();
	const { name, email, password, roleId } = body || {};

	if (!name || !email || !password || !roleId) {
		return NextResponse.json({ error: 'Missing name, email, password or roleId' }, { status: 400 });
	}

	const users = loadUsers();
	const roles = loadRoles();

	if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
		return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
	}

	const role = roles.find((r) => r.id === roleId);

	if (!role) {
		return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
	}

	const passwordHash = await bcrypt.hash(password, 12);

	const newUser: User = {
		id: `u_${Date.now()}`,
		name,
		email,
		passwordHash,
		roleId,
		permissions: [...role.defaultPermissions], // copy defaults
	};

	users.push(newUser);
	saveUsers(users);

	const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
	return NextResponse.json({ users: safeUsers });
}

// ---------- PATCH (EDIT USER) ----------
export async function PATCH(request: NextRequest) {
	const body = await request.json();
	const { id, name, email, roleId, password, permissions } = body || {};

	if (!id) {
		return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
	}

	const users = loadUsers();
	const roles = loadRoles();

	const index = users.findIndex((u) => u.id === id);

	if (index === -1) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	if (email) {
		const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== id);

		if (exists) {
			return NextResponse.json({ error: 'Another user already has this email' }, { status: 409 });
		}
	}

	if (name) users[index].name = name;
	if (email) users[index].email = email;

	if (roleId) {
		const role = roles.find((r) => r.id === roleId);
		if (!role) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
		}
		users[index].roleId = roleId;
	}

	if (Array.isArray(permissions)) {
		users[index].permissions = permissions;
	}

	if (password) {
		users[index].passwordHash = await bcrypt.hash(password, 12);
	}

	saveUsers(users);

	const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
	return NextResponse.json({ users: safeUsers });
}

// ---------- DELETE ----------
export async function DELETE(request: NextRequest) {
	const url = new URL(request.url);
	const id = url.searchParams.get('id');

	if (!id) {
		return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
	}

	const users = loadUsers();
	const exists = users.some((u) => u.id === id);

	if (!exists) {
		return NextResponse.json({ error: 'User not found' }, { status: 404 });
	}

	const nextUsers = users.filter((u) => u.id !== id);
	saveUsers(nextUsers);

	const safeUsers = nextUsers.map(({ passwordHash, ...rest }) => rest);

	return NextResponse.json({ users: safeUsers });
}
