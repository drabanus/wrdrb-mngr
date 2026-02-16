import { redirect, type Handle } from '@sveltejs/kit';
import { base } from '$app/paths';
import { validateSession } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	await validateSession(event);

	const { pathname } = event.url;

	// Allow access to login page and auth API routes without authentication
	if (pathname === `${base}/login` || pathname.startsWith(`${base}/api/auth`)) {
		return resolve(event);
	}

	// Redirect unauthenticated users to login
	if (!event.locals.user) {
		redirect(302, `${base}/login`);
	}

	return resolve(event);
};
