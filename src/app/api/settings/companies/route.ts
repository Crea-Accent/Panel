/** @format */

import { NextRequest, NextResponse } from 'next/server';

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const COMPANIES_PATH = path.join(DATA_DIR, 'companies.json');

export type Company = {
	id: string;

	name: string;
	color: string;

	address: {
		street: string;
		number: string;
		postalCode: string;
		city: string;
		country: string;
		lat: number;
		lng: number;
	};

	phone?: string;
	email?: string;
	website?: string;

	createdAt: string;
	updatedAt: string;
};

function ensureFiles() {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}

	if (!fs.existsSync(COMPANIES_PATH)) {
		fs.writeFileSync(COMPANIES_PATH, JSON.stringify([], null, 2));
	}
}

function loadCompanies(): Company[] {
	ensureFiles();

	try {
		return JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));
	} catch {
		return [];
	}
}

function saveCompanies(companies: Company[]) {
	ensureFiles();

	fs.writeFileSync(COMPANIES_PATH, JSON.stringify(companies, null, 2));
}

function generateId() {
	return `c_${Date.now()}`;
}

/* ---------------- GET ---------------- */

export async function GET() {
	return NextResponse.json({
		companies: loadCompanies(),
	});
}

/* ---------------- POST ---------------- */

export async function POST(request: NextRequest) {
	const body = await request.json();

	const companies = loadCompanies();

	const now = new Date().toISOString();

	const company: Company = {
		id: generateId(),

		name: body.name ?? '',
		color: body.color ?? '#A4B795',

		address: body.address ?? {
			street: '',
			number: '',
			postalCode: '',
			city: '',
			country: '',
			lat: 0,
			lng: 0,
		},

		phone: body.phone ?? '',
		email: body.email ?? '',
		website: body.website ?? '',

		createdAt: now,
		updatedAt: now,
	};

	companies.push(company);

	saveCompanies(companies);

	return NextResponse.json({
		company,
	});
}

/* ---------------- PATCH ---------------- */

export async function PATCH(request: NextRequest) {
	const body = await request.json();

	const companies = loadCompanies();

	const index = companies.findIndex((c) => c.id === body.id);

	if (index === -1) {
		return NextResponse.json(
			{
				error: 'Company not found',
			},
			{
				status: 404,
			}
		);
	}

	companies[index] = {
		...companies[index],

		name: body.name ?? companies[index].name,
		color: body.color ?? companies[index].color,

		address: body.address ?? companies[index].address,

		phone: body.phone ?? companies[index].phone,
		email: body.email ?? companies[index].email,
		website: body.website ?? companies[index].website,

		updatedAt: new Date().toISOString(),
	};

	saveCompanies(companies);

	return NextResponse.json({
		company: companies[index],
	});
}

/* ---------------- DELETE ---------------- */

export async function DELETE(request: NextRequest) {
	const url = new URL(request.url);

	const id = url.searchParams.get('id');

	if (!id) {
		return NextResponse.json(
			{
				error: 'Missing company id',
			},
			{
				status: 400,
			}
		);
	}

	const companies = loadCompanies();

	const exists = companies.some((c) => c.id === id);

	if (!exists) {
		return NextResponse.json(
			{
				error: 'Company not found',
			},
			{
				status: 404,
			}
		);
	}

	saveCompanies(companies.filter((c) => c.id !== id));

	return NextResponse.json({
		success: true,
	});
}
