/** @format */

'use client';

import { useMemo, useState } from 'react';

export function useFileNavigation(root: string) {
	const [currentPath, setCurrentPath] = useState(root);

	const [history, setHistory] = useState([root]);
	const [historyIndex, setHistoryIndex] = useState(0);

	function navigate(path: string) {
		if (path === currentPath) {
			return;
		}

		const nextHistory = history.slice(0, historyIndex + 1);

		nextHistory.push(path);

		setHistory(nextHistory);
		setHistoryIndex(nextHistory.length - 1);

		setCurrentPath(path);
	}

	function goBack() {
		if (historyIndex <= 0) {
			return;
		}

		const nextIndex = historyIndex - 1;

		setHistoryIndex(nextIndex);
		setCurrentPath(history[nextIndex]);
	}

	function goForward() {
		if (historyIndex >= history.length - 1) {
			return;
		}

		const nextIndex = historyIndex + 1;

		setHistoryIndex(nextIndex);
		setCurrentPath(history[nextIndex]);
	}

	function goUp() {
		if (currentPath === root) {
			return;
		}

		const parent = currentPath.split(/[\\/]/).slice(0, -1).join('/');

		navigate(parent || root);
	}

	const breadcrumbs = useMemo(() => {
		const relative = currentPath.replace(root, '');

		const parts = relative.split(/[\\/]/).filter(Boolean);

		const result = [
			{
				label: 'Root',
				path: root,
			},
		];

		let accumulated = root;

		for (const part of parts) {
			accumulated += '/' + part;

			result.push({
				label: part,
				path: accumulated,
			});
		}

		return result;
	}, [currentPath, root]);

	return {
		currentPath,

		navigate,
		goUp,
		goBack,
		goForward,

		canGoBack: historyIndex > 0,
		canGoForward: historyIndex < history.length - 1,
		canGoUp: currentPath !== root,

		breadcrumbs,
	};
}
