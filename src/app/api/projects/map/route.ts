/** @format */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROJECTS_PATH = path.join(DATA_DIR, 'projects.json');

function loadProjectsSettings() {
	const raw = fs.readFileSync(PROJECTS_PATH, 'utf8');
	return JSON.parse(raw);
}

export async function GET() {
	try {
		const settings = loadProjectsSettings();

		const basePath = path.resolve(process.cwd(), settings.path);

		const labels = settings.labels ?? [];

		const folders = fs
			.readdirSync(basePath, {
				withFileTypes: true,
			})
			.filter((entry) => entry.isDirectory());

		const projects = folders
			.map((folder) => {
				try {
					const metadataPath = path.join(basePath, folder.name, 'metadata.json');

					if (!fs.existsSync(metadataPath)) {
						return null;
					}

					const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

					const lat = metadata?.address?.lat;
					const lng = metadata?.address?.lng;

					if (typeof lat !== 'number' || typeof lng !== 'number' || lat === 0 || lng === 0) {
						return null;
					}

					const label = labels.find((x: any) => x.name === metadata.label);

					return {
						name: folder.name,

						label: metadata.label ?? null,

						color: label?.color ?? '#6b7280',

						lat,
						lng,

						updatedAt: metadata.updatedAt ?? null,

						contacts: metadata.contacts?.length ?? 0,

						panels: metadata.solar?.recommended?.panelsCount ?? metadata.solar?.maximum?.panelsCount ?? null,

						yield: metadata.solar?.recommended?.yearlyEnergyDcKwh ?? metadata.solar?.maximum?.yearlyEnergyDcKwh ?? null,
					};
				} catch (error) {
					console.error(`Failed to load ${folder.name}`, error);
					return null;
				}
			})
			.filter(Boolean);

		return NextResponse.json(projects);
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: 'Failed to load project map data',
			},
			{
				status: 500,
			}
		);
	}
}
