import { error } from '@sveltejs/kit';

export type Role = 'admin' | 'receptionist' | 'laundry' | 'mender';

/**
 * Route-level access control.
 * Routes listed here restrict access to the specified roles.
 * Routes NOT listed here are accessible to all authenticated users.
 */
export const ROUTE_ACCESS: Record<string, Role[]> = {
	'/personnel': ['admin'],
	'/assignments': ['admin', 'receptionist'],
	'/dispatch': ['admin', 'receptionist']
};

export function hasRole(userRole: string | undefined, ...allowedRoles: Role[]): boolean {
	if (!userRole) return false;
	return allowedRoles.includes(userRole as Role);
}

/**
 * Throws a 403 error if the user's role is not in the allowed list.
 */
export function requireRole(userRole: string | undefined, ...allowedRoles: Role[]) {
	if (!hasRole(userRole, ...allowedRoles)) {
		error(403, 'Forbidden');
	}
}
