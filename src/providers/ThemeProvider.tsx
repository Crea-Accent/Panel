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

function applyTheme(theme: Theme) {
	const root = document.documentElement;

	if (theme === 'dark') {
		root.classList.add('dark');
		return;
	}

	if (theme === 'light') {
		root.classList.remove('dark');
		return;
	}

	// system
	const prefersDark = getSystemTheme();
	root.classList.toggle('dark', prefersDark === 'dark');
}

export function ThemeProvider({ children, sessionTheme }: { children: React.ReactNode; sessionTheme?: Theme }) {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === 'undefined') return 'system';

		const stored = localStorage.getItem('theme') as Theme | null;

		if (stored === 'light' || stored === 'dark' || stored === 'system') {
			return stored;
		}

		return sessionTheme ?? 'system';
	});

	const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

	/* ---------- APPLY THEME ---------- */

	useEffect(() => {
		(() => {
			const resolved = theme === 'system' ? getSystemTheme() : theme;

			setResolvedTheme(resolved);
			applyTheme(theme);
		})();
	}, [theme]);

	/* ---------- SYNC SESSION THEME ---------- */

	useEffect(() => {
		(() => {
			if (!sessionTheme) return;

			if (sessionTheme !== theme) {
				localStorage.setItem('theme', sessionTheme);
				setTheme(sessionTheme);
			}
		})();
	}, [sessionTheme]);

	/* ---------- USER CHANGE ---------- */

	async function updateTheme(next: Theme) {
		localStorage.setItem('theme', next);
		setTheme(next);

		await fetch('/api/users', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ theme: next }),
		});
	}

	/* ---------- SYSTEM LISTENER ---------- */

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');

		const handler = () => {
			if (theme !== 'system') return;

			const resolved = getSystemTheme();
			setResolvedTheme(resolved);
			document.documentElement.classList.toggle('dark', resolved === 'dark');
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
