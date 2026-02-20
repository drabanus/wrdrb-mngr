import { redirect, type Handle } from '@sveltejs/kit';
import { base } from '$app/paths';
import { validateSession } from '$lib/server/auth';
import { ROUTE_ACCESS, hasRole } from '$lib/server/roles';

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

	// Role-based route access control — redirect to dashboard if forbidden
	// (error() in hooks bypasses +error.svelte, so we redirect instead)
	const relativePath = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
	for (const [route, allowedRoles] of Object.entries(ROUTE_ACCESS)) {
		if (relativePath === route || relativePath.startsWith(route + '/')) {
			if (!hasRole(event.locals.user.role, ...allowedRoles)) {
				redirect(302, `${base}/dashboard`);
			}
			break;
		}
	}

	return resolve(event);
};
