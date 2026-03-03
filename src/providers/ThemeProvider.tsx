/** @format */

'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

type ThemeContextType = {
	theme: Theme;
	resolvedTheme: 'light' | 'dark';
	setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | null>(null);

function getSystemTheme(): 'light' | 'dark' {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
	const root = document.documentElement;
	root.classList.remove('light', 'dark');
	root.classList.add(resolved);
}

export function ThemeProvider({ children, sessionTheme }: { children: React.ReactNode; sessionTheme?: Theme }) {
	/* ---------------- INITIALIZE FROM LOCALSTORAGE ---------------- */

	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === 'undefined') return 'light';

		const stored = localStorage.getItem('theme') as Theme | null;

		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			return stored;
		}

		return 'light';
	});

	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

	/* ---------------- APPLY THEME ---------------- */

	useEffect(() => {
		(() => {
			const resolved = theme === 'system' ? getSystemTheme() : theme;

			setResolvedTheme(resolved);
			applyTheme(resolved);
		})();
	}, [theme]);

	/* ---------------- SYNC USERS.JSON → LOCALSTORAGE ---------------- */

	useEffect(() => {
		(() => {
			if (!sessionTheme) return;

			// Only update if different
			if (sessionTheme !== theme) {
				localStorage.setItem('theme', sessionTheme);
				setTheme(sessionTheme);
			}
		})();
	}, [sessionTheme]);

	/* ---------------- USER TRIGGERED ---------------- */

	async function updateTheme(next: Theme) {
		localStorage.setItem('theme', next);
		setTheme(next);

		await fetch('/api/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ theme: next }),
		});
	}

	/* ---------------- SYSTEM LISTENER ---------------- */

	useEffect(() => {
		if (theme !== 'light') return;

		const media = window.matchMedia('(prefers-color-scheme: dark)');

		const handler = () => {
			const resolved = getSystemTheme();
			setResolvedTheme(resolved);
			applyTheme(resolved);
		};

		media.addEventListener('change', handler);
		return () => media.removeEventListener('change', handler);
	}, [theme]);

	return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: updateTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
	return ctx;
}
