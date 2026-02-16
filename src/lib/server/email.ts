import nodemailer from 'nodemailer';
import { prisma } from './db';

export async function getSmtpSettings() {
	let settings = await prisma.appSettings.findFirst({ where: { id: 'global' } });
	if (!settings) {
		settings = await prisma.appSettings.create({
			data: { id: 'global', orgName: 'Hasenschule' }
		});
	}
	return settings;
}

export async function createTransporter() {
	const settings = await getSmtpSettings();
	if (!settings.smtpHost) return null;

	return nodemailer.createTransport({
		host: settings.smtpHost,
		port: settings.smtpPort,
		secure: settings.smtpPort === 465,
		auth: {
			user: settings.smtpUser,
			pass: settings.smtpPass
		}
	});
}

export async function sendEmail(to: string, subject: string, body: string, sentBy?: string) {
	const settings = await getSmtpSettings();
	const transporter = await createTransporter();
	if (!transporter) {
		await prisma.emailLog.create({
			data: { to, subject, body, status: 'failed', sentBy }
		});
		return { success: false, error: 'SMTP not configured' };
	}

	try {
		await transporter.sendMail({
			from: settings.smtpFrom || settings.smtpUser,
			to,
			subject,
			html: body
		});
		await prisma.emailLog.create({
			data: { to, subject, body, status: 'sent', sentBy }
		});
		return { success: true };
	} catch (err: any) {
		await prisma.emailLog.create({
			data: { to, subject, body, status: 'failed', sentBy }
		});
		return { success: false, error: err.message };
	}
}

export async function sendGigReminders(gigId: string, sentBy?: string) {
	const gig = await prisma.gig.findUnique({ where: { id: gigId } });
	if (!gig) return { success: false, error: 'Gig not found' };

	const settings = await getSmtpSettings();

	// Find all users with open todos
	const usersWithTodos = await prisma.user.findMany({
		where: {
			active: true,
			todoItems: { some: { status: { not: 'done' } } }
		},
		include: {
			todoItems: { where: { status: { not: 'done' } } }
		}
	});

	const results = [];
	for (const user of usersWithTodos) {
		const todoList = user.todoItems
			.map((t) => `<li><strong>${t.title}</strong> (${t.type}) - ${t.priority}</li>`)
			.join('');

		const gigDate = gig.date.toLocaleDateString('de-DE', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});

		const body = `
			<h2>${settings.orgName} - Erinnerung</h2>
			<p>Hallo ${user.name},</p>
			<p>Der Auftritt <strong>${gig.name}</strong> findet am <strong>${gigDate}</strong>${gig.location ? ` in <strong>${gig.location}</strong>` : ''} statt.</p>
			<p>Du hast noch offene Aufgaben:</p>
			<ul>${todoList}</ul>
			<p>Bitte erledige diese vor dem Auftritt.</p>
			<p>Viele Grüße,<br/>${settings.orgName} Garderobe</p>
		`;

		const result = await sendEmail(
			user.email,
			`${settings.orgName}: Erinnerung - ${gig.name} am ${gigDate}`,
			body,
			sentBy
		);
		results.push({ user: user.name, ...result });
	}

	return { success: true, results };
}
