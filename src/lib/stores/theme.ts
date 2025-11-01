import { writable } from 'svelte/store';

type Theme = 'light' | 'dark';

const userPrefersDark = typeof window !== 'undefined' && 
	window.matchMedia('(prefers-color-scheme: dark)').matches;
const storedTheme = typeof localStorage !== 'undefined' && 
	localStorage.getItem('theme') as Theme;

const initialTheme: Theme = storedTheme || (userPrefersDark ? 'dark' : 'light');

export const theme = writable<Theme>(initialTheme);

theme.subscribe((value) => {
	if (typeof document !== 'undefined') {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.classList.add(value);
		localStorage.setItem('theme', value);
	}
});

export function toggleTheme() {
	theme.update((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
}