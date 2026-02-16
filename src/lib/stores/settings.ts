import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface AppSettingsLocal {
	theme: string;
	fontSize: string;
	language: string;
}

const defaults: AppSettingsLocal = {
	theme: 'light',
	fontSize: 'medium',
	language: 'de'
};

function loadSettings(): AppSettingsLocal {
	if (!browser) return defaults;
	try {
		const stored = localStorage.getItem('garderobe-settings');
		return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
	} catch {
		return defaults;
	}
}

function createSettingsStore() {
	const { subscribe, set, update } = writable<AppSettingsLocal>(loadSettings());

	return {
		subscribe,
		set(value: AppSettingsLocal) {
			set(value);
			if (browser) {
				localStorage.setItem('garderobe-settings', JSON.stringify(value));
				applySettings(value);
			}
		},
		update(fn: (s: AppSettingsLocal) => AppSettingsLocal) {
			update((current) => {
				const next = fn(current);
				if (browser) {
					localStorage.setItem('garderobe-settings', JSON.stringify(next));
					applySettings(next);
				}
				return next;
			});
		}
	};
}

function applySettings(s: AppSettingsLocal) {
	if (!browser) return;
	document.documentElement.setAttribute('data-theme', s.theme);
	document.documentElement.setAttribute('data-font-size', s.fontSize);
}

export const settings = createSettingsStore();
