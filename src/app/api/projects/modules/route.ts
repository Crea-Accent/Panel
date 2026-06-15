/** @format */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
	try {
		const modulesDir = path.join(process.cwd(), 'public', 'modules');

		if (!fs.existsSync(modulesDir)) {
			return NextResponse.json({
				modules: [],
			});
		}

		const folders = fs
			.readdirSync(modulesDir, {
				withFileTypes: true,
			})
			.filter((entry) => entry.isDirectory());

		const modules = folders
			.map((folder) => {
				try {
					const folderPath = path.join(modulesDir, folder.name);

					const moduleFile = path.join(folderPath, 'module.json');

					if (!fs.existsSync(moduleFile)) {
						return null;
					}

					const files = fs.readdirSync(folderPath);

					const data = JSON.parse(fs.readFileSync(moduleFile, 'utf8'));

					const previewFile = files.find((file) => ['.svg', '.png', '.jpg', '.jpeg', '.webp'].some((ext) => file.toLowerCase().endsWith(ext)));

					const dxfFile = files.find((file) => file.toLowerCase().endsWith('.dxf'));

					const dwgFile = files.find((file) => file.toLowerCase().endsWith('.dwg'));

					let preview: string | null = null;

					if (previewFile) {
						preview = `/modules/${folder.name}/${previewFile}`;
					} else if (dxfFile) {
						preview = `/api/project/modules/${folder.name}/`;
					}

					return {
						id: folder.name,

						...data,

						preview,

						dxf: dxfFile ? `/modules/${folder.name}/${dxfFile}` : null,

						drawing: dwgFile ? `/modules/${folder.name}/${dwgFile}` : null,
					};
				} catch (error) {
					console.error(`Failed loading module ${folder.name}`, error);

					return null;
				}
			})
			.filter(Boolean);

		return NextResponse.json({
			modules,
		});
	} catch (error) {
		console.error(error);

		return NextResponse.json(
			{
				error: 'Failed to load modules',
			},
			{
				status: 500,
			}
		);
	}
}
