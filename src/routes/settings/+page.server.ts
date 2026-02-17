import type { Actions, PageServerLoad } from './$types';
import { prisma } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import nodemailer from 'nodemailer';
import { requireRole } from '$lib/server/roles';

export const load: PageServerLoad = async ({ locals }) => {
	let appSettings = await prisma.appSettings.findFirst({
		where: { id: 'global' }
	});

	if (!appSettings) {
		appSettings = await prisma.appSettings.create({
			data: {
				id: 'global',
				smtpHost: '',
				smtpPort: 587,
				smtpUser: '',
				smtpPass: '',
				smtpFrom: '',
				orgName: 'Hasenschule'
			}
		});
	}

	return {
		appSettings: {
			smtpHost: appSettings.smtpHost,
			smtpPort: appSettings.smtpPort,
			smtpUser: appSettings.smtpUser,
			smtpPass: appSettings.smtpPass,
			smtpFrom: appSettings.smtpFrom,
			orgName: appSettings.orgName
		},
		reminderLeadDays: 14
	};
};

export const actions: Actions = {
	saveEmail: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const smtpHost = (data.get('smtpHost') as string) || '';
		const smtpPort = parseInt(data.get('smtpPort') as string) || 587;
		const smtpUser = (data.get('smtpUser') as string) || '';
		const smtpPass = (data.get('smtpPass') as string) || '';
		const smtpFrom = (data.get('smtpFrom') as string) || '';
		const orgName = (data.get('orgName') as string) || '';

		try {
			await prisma.appSettings.upsert({
				where: { id: 'global' },
				update: {
					smtpHost,
					smtpPort,
					smtpUser,
					smtpPass,
					smtpFrom,
					orgName
				},
				create: {
					id: 'global',
					smtpHost,
					smtpPort,
					smtpUser,
					smtpPass,
					smtpFrom,
					orgName
				}
			});

			return { success: true, action: 'save' };
		} catch (err) {
			return fail(500, { error: 'Failed to save settings' });
		}
	},

	testEmail: async ({ request, locals }) => {
		requireRole(locals.user?.role, 'admin');
		const data = await request.formData();
		const smtpHost = (data.get('smtpHost') as string) || '';
		const smtpPort = parseInt(data.get('smtpPort') as string) || 587;
		const smtpUser = (data.get('smtpUser') as string) || '';
		const smtpPass = (data.get('smtpPass') as string) || '';
		const smtpFrom = (data.get('smtpFrom') as string) || '';

		if (!smtpHost || !smtpFrom) {
			return fail(400, { error: 'SMTP host and sender address are required' });
		}

		const userEmail = locals.user?.email;
		if (!userEmail) {
			return fail(400, { error: 'No email address found for current user' });
		}

		try {
			const transporter = nodemailer.createTransport({
				host: smtpHost,
				port: smtpPort,
				secure: smtpPort === 465,
				auth: smtpUser
					? {
							user: smtpUser,
							pass: smtpPass
						}
					: undefined
			});

			await transporter.sendMail({
				from: smtpFrom,
				to: userEmail,
				subject: 'Garderobe - Test Email',
				text: 'This is a test email from the Garderobe wardrobe management system. If you receive this, your SMTP settings are configured correctly.',
				html: '<p>This is a test email from the <strong>Garderobe</strong> wardrobe management system.</p><p>If you receive this, your SMTP settings are configured correctly.</p>'
			});

			return { success: true, action: 'test' };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unknown error';
			return fail(500, { error: `Failed to send test email: ${message}` });
		}
	}
};
