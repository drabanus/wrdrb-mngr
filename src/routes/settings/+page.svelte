<script lang="ts">
	import { t, locale, locales } from '$i18n';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { settings } from '$lib/stores/settings';

	let { data, form } = $props();

	const isAdmin = $derived($page.data.user?.role === 'admin');

	// Appearance state - initialized from settings store
	let currentTheme = $state($settings.theme);
	let currentFontSize = $state($settings.fontSize);
	let currentLanguage = $state($settings.language);

	// Organization state
	let orgName = $state(data.appSettings.orgName);

	// SMTP state
	let smtpHost = $state(data.appSettings.smtpHost);
	let smtpPort = $state(data.appSettings.smtpPort);
	let smtpUser = $state(data.appSettings.smtpUser);
	let smtpPass = $state(data.appSettings.smtpPass);
	let smtpFrom = $state(data.appSettings.smtpFrom);

	// Loading states
	let saving = $state(false);
	let testing = $state(false);

	// Available themes
	const themes = ['light', 'dark', 'cupcake', 'corporate', 'forest', 'pastel'];

	// Available font sizes
	const fontSizes = ['small', 'medium', 'large'];

	// Available languages
	const languages = ['de', 'en', 'es'];

	// Derived form result messages
	let saveSuccess = $derived(form?.success && form?.action === 'save');
	let testSuccess = $derived(form?.success && form?.action === 'test');
	let formError = $derived(form?.error as string | undefined);

	// Apply theme changes immediately
	function handleThemeChange(theme: string) {
		currentTheme = theme;
		$settings = { ...$settings, theme };
	}

	// Apply font size changes immediately
	function handleFontSizeChange(size: string) {
		currentFontSize = size;
		$settings = { ...$settings, fontSize: size };
	}

	// Apply language changes immediately
	function handleLanguageChange(lang: string) {
		currentLanguage = lang;
		$settings = { ...$settings, language: lang };
		locale.set(lang);
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold">{$t('settings.title')}</h1>
		<p class="text-sm opacity-60 mt-1">{$t('settings.subtitle')}</p>
	</div>

	<!-- Appearance Section -->
	<div class="card bg-base-100 shadow-sm border border-base-300">
		<div class="card-body">
			<h2 class="card-title text-lg">{$t('settings.appearance')}</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
				<!-- Language Selector -->
				<div class="form-control">
					<label class="label" for="language-select">
						<span class="label-text">{$t('settings.language')}</span>
					</label>
					<select
						id="language-select"
						class="select select-bordered w-full"
						value={currentLanguage}
						onchange={(e) => handleLanguageChange(e.currentTarget.value)}
					>
						{#each languages as lang}
							<option value={lang}>{$t(`settings.languages.${lang}`)}</option>
						{/each}
					</select>
				</div>

				<!-- Theme Selector -->
				<div class="form-control">
					<label class="label" for="theme-select">
						<span class="label-text">{$t('settings.theme')}</span>
					</label>
					<select
						id="theme-select"
						class="select select-bordered w-full"
						value={currentTheme}
						onchange={(e) => handleThemeChange(e.currentTarget.value)}
					>
						{#each themes as theme}
							<option value={theme}>{$t(`settings.themes.${theme}`)}</option>
						{/each}
					</select>
				</div>

				<!-- Font Size Selector -->
				<div class="form-control">
					<label class="label" for="font-size-select">
						<span class="label-text">{$t('settings.fontSize')}</span>
					</label>
					<select
						id="font-size-select"
						class="select select-bordered w-full"
						value={currentFontSize}
						onchange={(e) => handleFontSizeChange(e.currentTarget.value)}
					>
						{#each fontSizes as size}
							<option value={size}>{$t(`settings.fontSizes.${size}`)}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>
	</div>

	{#if isAdmin}
	<!-- Organization Section -->
	<div class="card bg-base-100 shadow-sm border border-base-300">
		<div class="card-body">
			<h2 class="card-title text-lg">{$t('settings.organization')}</h2>

			<div class="form-control mt-2">
				<label class="label" for="org-name">
					<span class="label-text">{$t('settings.orgName')}</span>
				</label>
				<input
					id="org-name"
					type="text"
					class="input input-bordered w-full max-w-md"
					bind:value={orgName}
				/>
			</div>
		</div>
	</div>

	<!-- Email / SMTP Section -->
	<div class="card bg-base-100 shadow-sm border border-base-300">
		<div class="card-body">
			<h2 class="card-title text-lg">{$t('settings.email')}</h2>

			<!-- Success / Error Messages -->
			{#if saveSuccess}
				<div class="alert alert-success text-sm">
					<span>{$t('settings.saveSuccess')}</span>
				</div>
			{/if}

			{#if testSuccess}
				<div class="alert alert-success text-sm">
					<span>{$t('settings.testSuccess')}</span>
				</div>
			{/if}

			{#if formError}
				<div class="alert alert-error text-sm">
					<span>{formError}</span>
				</div>
			{/if}

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
				<!-- SMTP Host -->
				<div class="form-control">
					<label class="label" for="smtp-host">
						<span class="label-text">{$t('settings.smtpHost')}</span>
					</label>
					<input
						id="smtp-host"
						type="text"
						class="input input-bordered w-full"
						placeholder="smtp.example.com"
						bind:value={smtpHost}
					/>
				</div>

				<!-- SMTP Port -->
				<div class="form-control">
					<label class="label" for="smtp-port">
						<span class="label-text">{$t('settings.smtpPort')}</span>
					</label>
					<input
						id="smtp-port"
						type="number"
						class="input input-bordered w-full"
						placeholder="587"
						bind:value={smtpPort}
					/>
				</div>

				<!-- SMTP User -->
				<div class="form-control">
					<label class="label" for="smtp-user">
						<span class="label-text">{$t('settings.smtpUser')}</span>
					</label>
					<input
						id="smtp-user"
						type="text"
						class="input input-bordered w-full"
						placeholder="user@example.com"
						bind:value={smtpUser}
					/>
				</div>

				<!-- SMTP Password -->
				<div class="form-control">
					<label class="label" for="smtp-pass">
						<span class="label-text">{$t('settings.smtpPass')}</span>
					</label>
					<input
						id="smtp-pass"
						type="password"
						class="input input-bordered w-full"
						bind:value={smtpPass}
					/>
				</div>

				<!-- SMTP From Address -->
				<div class="form-control sm:col-span-2">
					<label class="label" for="smtp-from">
						<span class="label-text">{$t('settings.smtpFrom')}</span>
					</label>
					<input
						id="smtp-from"
						type="email"
						class="input input-bordered w-full max-w-md"
						placeholder="noreply@example.com"
						bind:value={smtpFrom}
					/>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-2 mt-4">
				<!-- Save Email Settings -->
				<form
					method="POST"
					action="?/saveEmail"
					use:enhance={() => {
						saving = true;
						return async ({ update }) => {
							await update();
							saving = false;
						};
					}}
				>
					<input type="hidden" name="smtpHost" value={smtpHost} />
					<input type="hidden" name="smtpPort" value={smtpPort} />
					<input type="hidden" name="smtpUser" value={smtpUser} />
					<input type="hidden" name="smtpPass" value={smtpPass} />
					<input type="hidden" name="smtpFrom" value={smtpFrom} />
					<input type="hidden" name="orgName" value={orgName} />
					<button type="submit" class="btn btn-primary" disabled={saving}>
						{#if saving}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						{$t('common.save')}
					</button>
				</form>

				<!-- Test Email -->
				<form
					method="POST"
					action="?/testEmail"
					use:enhance={() => {
						testing = true;
						return async ({ update }) => {
							await update();
							testing = false;
						};
					}}
				>
					<input type="hidden" name="smtpHost" value={smtpHost} />
					<input type="hidden" name="smtpPort" value={smtpPort} />
					<input type="hidden" name="smtpUser" value={smtpUser} />
					<input type="hidden" name="smtpPass" value={smtpPass} />
					<input type="hidden" name="smtpFrom" value={smtpFrom} />
					<button type="submit" class="btn btn-outline" disabled={testing}>
						{#if testing}
							<span class="loading loading-spinner loading-sm"></span>
						{/if}
						{$t('settings.testEmail')}
					</button>
				</form>
			</div>
		</div>
	</div>
	{/if}
</div>
