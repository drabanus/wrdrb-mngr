<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { t, locale } from '$i18n';
	import { settings } from '$lib/stores/settings';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	let { children, data } = $props();

	let drawerOpen = $state(false);

	const navItems = $derived([
		{ href: `${base}/dashboard`, icon: '📊', key: 'nav.dashboard' },
		{ href: `${base}/children`, icon: '👧', key: 'nav.children' },
		{ href: `${base}/personnel`, icon: '👤', key: 'nav.personnel' },
		{ href: `${base}/inventory`, icon: '👗', key: 'nav.inventory' },
		{ href: `${base}/assignments`, icon: '🔗', key: 'nav.assignments' },
		{ href: `${base}/scanning`, icon: '📱', key: 'nav.scanning' },
		{ href: `${base}/dispatch`, icon: '📦', key: 'nav.dispatch' },
		{ href: `${base}/todos`, icon: '✅', key: 'nav.todos' },
		{ href: `${base}/calendar`, icon: '📅', key: 'nav.calendar' },
		{ href: `${base}/settings`, icon: '⚙️', key: 'nav.settings' }
	]);

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}

	onMount(() => {
		const s = $settings;
		document.documentElement.setAttribute('data-theme', s.theme);
		document.documentElement.setAttribute('data-font-size', s.fontSize);
		locale.set(s.language);
	});

	// Sync language setting to locale
	$effect(() => {
		locale.set($settings.language);
	});

	const isLoginPage = $derived($page.url.pathname === `${base}/login`);
</script>

{#if isLoginPage}
	{@render children()}
{:else}
	<div class="drawer lg:drawer-open">
		<input id="main-drawer" type="checkbox" class="drawer-toggle" bind:checked={drawerOpen} />

		<div class="drawer-content flex flex-col min-h-screen">
			<!-- Top navbar for mobile -->
			<div class="navbar bg-base-200 lg:hidden sticky top-0 z-30">
				<div class="flex-none">
					<label for="main-drawer" class="btn btn-square btn-ghost">
						<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-6 h-6 stroke-current">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
						</svg>
					</label>
				</div>
				<div class="flex-1">
					<span class="text-lg font-bold">Garderobe</span>
				</div>
				{#if data.user}
					<div class="flex-none text-sm opacity-70">{data.user.name}</div>
				{/if}
			</div>

			<!-- Main content -->
			<main class="flex-1 p-4 lg:p-6">
				{@render children()}
			</main>
		</div>

		<!-- Sidebar -->
		<div class="drawer-side z-40">
			<label for="main-drawer" aria-label="close sidebar" class="drawer-overlay"></label>
			<aside class="bg-base-200 min-h-full w-64 flex flex-col">
				<!-- Logo area -->
				<div class="p-4 border-b border-base-300">
					<h1 class="text-xl font-bold">{$t('app.name')}</h1>
					<p class="text-xs opacity-60">{$t('app.subtitle')}</p>
				</div>

				<!-- Navigation -->
				<ul class="menu flex-1 p-2 gap-0.5">
					{#each navItems as item}
						<li>
							<a
								href={item.href}
								class:active={isActive(item.href)}
								onclick={() => drawerOpen = false}
							>
								<span>{item.icon}</span>
								<span>{$t(item.key)}</span>
							</a>
						</li>
					{/each}
				</ul>

				<!-- User info & logout -->
				{#if data.user}
					<div class="p-4 border-t border-base-300">
						<div class="text-sm font-medium">{data.user.name}</div>
						<div class="text-xs opacity-60 mb-2">{data.user.role}</div>
						<form method="POST" action="{base}/login?/logout" use:enhance>
							<button type="submit" class="btn btn-ghost btn-sm btn-block justify-start">
								{$t('nav.logout')}
							</button>
						</form>
					</div>
				{/if}
			</aside>
		</div>
	</div>
{/if}
