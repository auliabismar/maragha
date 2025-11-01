import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark' | 'system';

// Helper to get actual theme (resolves 'system' to 'light' or 'dark')
function getResolvedTheme(theme: Theme): 'light' | 'dark' {
	if (theme === 'system') {
		if (browser && window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
		return 'light';
	}
	return theme;
}

// Initialize theme
function initTheme(): Theme {
	if (!browser) return 'system';
	
	const stored = localStorage.getItem('theme') as Theme;
	if (stored && ['light', 'dark', 'system'].includes(stored)) {
		return stored;
	}
	
	return 'system';
}

// Create the store
export const theme = writable<Theme>(initTheme());

// Apply theme to document
function applyTheme(value: Theme) {
	if (!browser) return;
	
	const resolved = getResolvedTheme(value);
	const root = document.documentElement;
	
	// Remove both classes first
	root.classList.remove('light', 'dark');
	// Add the resolved theme
	root.classList.add(resolved);
	
	// Update data-theme attribute for your layout
	root.setAttribute('data-theme', resolved);
	
	// Store preference
	localStorage.setItem('theme', value);
}

// Subscribe to theme changes
if (browser) {
	theme.subscribe(applyTheme);
	
	// Apply initial theme immediately to prevent flash
	applyTheme(initTheme());
	
	// Listen for system theme changes
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
	mediaQuery.addEventListener('change', () => {
		theme.update(current => {
			if (current === 'system') {
				applyTheme('system');
			}
			return current;
		});
	});
}

// Toggle between light and dark (skips system)
export function toggleTheme() {
	theme.update((current) => {
		const resolved = getResolvedTheme(current);
		return resolved === 'light' ? 'dark' : 'light';
	});
}

// Set specific theme
export function setTheme(newTheme: Theme) {
	theme.set(newTheme);
}

// Get the current resolved theme (light or dark, not system)
export function getResolvedThemeValue(): 'light' | 'dark' {
	let currentTheme: Theme = 'system';
	theme.subscribe(value => currentTheme = value)();
	return getResolvedTheme(currentTheme);
}