/** @format */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	reactCompiler: true,
	images: {
		unoptimized: true,
	},
	turbopack: {
		rules: {
			'*.svg': {
				loaders: ['@svgr/webpack'],
				as: '*.js',
			},
		},
	},
	experimental: {
		middlewareClientMaxBodySize: 500 * 1024 * 1024, // 50 MB
	},
};

export default nextConfig;
