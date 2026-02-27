/** @format */

export const PERMISSIONS = [
	{
		key: 'admin.read',
		label: 'Admin - Read',
		group: 'Admin',
	},
	{
		key: 'admin.write',
		label: 'Admin - Write',
		group: 'Admin',
	},
	{
		key: 'projects.read',
		label: 'Projects - Read',
		group: 'Projects',
	},
	{
		key: 'projects.write',
		label: 'Projects - Write',
		group: 'Projects',
	},
	{
		key: 'files.read',
		label: 'Files - Read',
		group: 'Files',
	},
	{
		key: 'files.write',
		label: 'Files - Write',
		group: 'Files',
	},
];

export function groupPermissions() {
	const groups: Record<string, typeof PERMISSIONS | []> = {};

	for (const perm of PERMISSIONS) {
		if (!groups[perm.group]) {
			groups[perm.group] = [];
		}
		groups[perm.group].push(perm as never);
	}

	return groups;
}
