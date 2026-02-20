<script lang="ts">
	import { page } from '$app/stores';
	import { base } from '$app/paths';
	import { t } from '$i18n';
</script>

{#if $page.status === 403}
	<div class="flex flex-col items-center justify-center py-20 text-center">
		<div class="text-6xl mb-4">🔒</div>
		<p class="text-lg opacity-70 max-w-md">
			{$t('common.accessDenied')}
		</p>
		<a href="{base}/dashboard" class="btn btn-primary mt-6">
			{$t('common.backToDashboard')}
		</a>
	</div>
{:else}
	<div class="flex flex-col items-center justify-center py-20 text-center">
		<div class="text-6xl mb-4">{$page.status}</div>
		<p class="text-lg opacity-70">{$page.error?.message}</p>
		<a href="{base}/dashboard" class="btn btn-primary mt-6">
			{$t('common.backToDashboard')}
		</a>
	</div>
{/if}
