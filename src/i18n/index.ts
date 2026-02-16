import { writable, derived } from 'svelte/store';
import de from './de';
import en from './en';
import es from './es';

type Translations = typeof de;
const translations: Record<string, Translations> = { de, en, es };

export const locale = writable('de');

export const t = derived(locale, ($locale) => {
	const trans = translations[$locale] || translations.de;
	return function translate(key: string, params?: Record<string, string>): string {
		const keys = key.split('.');
		let value: any = trans;
		for (const k of keys) {
			value = value?.[k];
		}
		if (typeof value !== 'string') return key;
		if (params) {
			return Object.entries(params).reduce(
				(str, [k, v]) => str.replace(`{${k}}`, v),
				value
			);
		}
		return value;
	};
});

export const locales = ['de', 'en', 'es'] as const;
