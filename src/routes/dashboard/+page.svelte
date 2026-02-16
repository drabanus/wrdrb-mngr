<script lang="ts">
	import { t } from '$i18n';
	import { base } from '$app/paths';

	let { data } = $props();

	// Format date for display
	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	// Format timestamp for recent activity
	function formatTimestamp(date: string | Date): string {
		return new Date(date).toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	// Urgency badge class for growth alerts
	function urgencyClass(urgency: string): string {
		switch (urgency) {
			case 'high':
				return 'badge-error';
			case 'medium':
				return 'badge-warning';
			default:
				return 'badge-info';
		}
	}

	// Priority badge class for todos
	function priorityClass(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'badge-error';
			case 'high':
				return 'badge-warning';
			case 'normal':
				return 'badge-info';
			default:
				return 'badge-ghost';
		}
	}

	// Gig status badge class
	function gigStatusClass(status: string): string {
		switch (status) {
			case 'upcoming':
				return 'badge-info';
			case 'dispatched':
				return 'badge-warning';
			case 'completed':
				return 'badge-success';
			default:
				return 'badge-ghost';
		}
	}

	// Format predicted outgrow date
	function formatOutgrowDate(date: string | Date | null): string {
		if (!date) return '-';
		return new Date(date).toLocaleDateString(undefined, {
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<h1 class="text-2xl font-bold">{$t('dashboard.title')}</h1>

	<!-- Stat Cards -->
	<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
		<!-- Total Children -->
		<a href="{base}/children" class="stat bg-base-100 shadow-sm rounded-lg border border-base-300 hover:shadow-md transition-shadow">
			<div class="stat-title">{$t('dashboard.totalChildren')}</div>
			<div class="stat-value text-primary">{data.childCount}</div>
		</a>

		<!-- Upcoming Gigs -->
		<a href="{base}/dispatch" class="stat bg-base-100 shadow-sm rounded-lg border border-base-300 hover:shadow-md transition-shadow">
			<div class="stat-title">{$t('dashboard.activeGigs')}</div>
			<div class="stat-value text-secondary">{data.upcomingGigs.length}</div>
		</a>

		<!-- Open Tasks -->
		<a href="{base}/todos" class="stat bg-base-100 shadow-sm rounded-lg border border-base-300 hover:shadow-md transition-shadow">
			<div class="stat-title">{$t('dashboard.openTodos')}</div>
			<div class="stat-value text-accent">{data.openTodos.length}</div>
		</a>

		<!-- Pending Returns -->
		<a href="{base}/dispatch" class="stat bg-base-100 shadow-sm rounded-lg border border-base-300 hover:shadow-md transition-shadow">
			<div class="stat-title">{$t('dashboard.pendingReturns')}</div>
			<div class="stat-value text-warning">{data.pendingReturns}</div>
		</a>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Upcoming Gigs Section -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title text-lg">{$t('dashboard.upcomingGigs')}</h2>
					<a href="{base}/dispatch" class="btn btn-ghost btn-xs">{$t('common.actions')}</a>
				</div>

				{#if data.upcomingGigs.length === 0}
					<p class="text-sm opacity-60 py-4 text-center">{$t('common.noResults')}</p>
				{:else}
					<div class="space-y-2">
						{#each data.upcomingGigs as gig (gig.id)}
							<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm truncate">{gig.name}</div>
									<div class="text-xs opacity-60">
										{formatDate(gig.date)}
										{#if gig.location}
											&middot; {gig.location}
										{/if}
									</div>
								</div>
								<span class="badge badge-sm {gigStatusClass(gig.status)} ml-2 flex-shrink-0">
									{$t(`dispatch.gigs.${gig.status}`)}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Open Tasks Section -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title text-lg">{$t('dashboard.openTodos')}</h2>
					<a href="{base}/todos" class="btn btn-ghost btn-xs">{$t('common.actions')}</a>
				</div>

				{#if data.openTodos.length === 0}
					<p class="text-sm opacity-60 py-4 text-center">{$t('common.noResults')}</p>
				{:else}
					<div class="space-y-2">
						{#each data.openTodos as todo (todo.id)}
							<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="badge badge-xs {priorityClass(todo.priority)}">
											{$t(`todos.priority.${todo.priority}`)}
										</span>
										<span class="badge badge-outline badge-xs">
											{$t(`todos.types.${todo.type}`)}
										</span>
									</div>
									<div class="text-sm mt-1 truncate">{todo.description}</div>
								</div>
								{#if todo.assignedUser}
									<span class="text-xs opacity-60 ml-2 flex-shrink-0">
										{todo.assignedUser.name}
									</span>
								{/if}
							</div>
						{/each}
					</div>
				{/if}

				<!-- Tasks by type summary -->
				{#if Object.keys(data.todosByType).length > 0}
					<div class="divider my-2"></div>
					<div>
						<h3 class="text-sm font-medium mb-2 opacity-70">{$t('dashboard.todosByType')}</h3>
						<div class="flex flex-wrap gap-2">
							{#each Object.entries(data.todosByType) as [type, count]}
								<span class="badge badge-outline badge-sm gap-1">
									{$t(`todos.types.${type}`)}
									<span class="font-bold">{count}</span>
								</span>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Growth Alerts Section -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title text-lg">{$t('dashboard.growthAlerts')}</h2>
					<a href="{base}/children" class="btn btn-ghost btn-xs">{$t('common.actions')}</a>
				</div>

				{#if data.growthAlerts.length === 0}
					<p class="text-sm opacity-60 py-4 text-center">{$t('common.noResults')}</p>
				{:else}
					<div class="space-y-2">
						{#each data.growthAlerts as alert (alert.childId)}
							<a
								href="{base}/children"
								class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2 hover:bg-base-300 transition-colors"
							>
								<div class="flex-1 min-w-0">
									<div class="font-medium text-sm">{alert.childName}</div>
									<div class="text-xs opacity-60">
										{alert.currentHeight} cm &middot;
										{$t('children.clothingSize')}: {alert.currentSize}
										{#if alert.nextSize}
											&rarr; {alert.nextSize}
										{/if}
									</div>
									{#if alert.predictedOutgrowDate}
										<div class="text-xs opacity-50 mt-0.5">
											~{formatOutgrowDate(alert.predictedOutgrowDate)}
										</div>
									{/if}
								</div>
								<span class="badge badge-sm {urgencyClass(alert.urgency)} ml-2 flex-shrink-0">
									{alert.urgency}
								</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<!-- Recent Scan Activity Section -->
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body">
				<div class="flex items-center justify-between">
					<h2 class="card-title text-lg">{$t('dashboard.recentActivity')}</h2>
					<a href="{base}/scanning" class="btn btn-ghost btn-xs">{$t('common.actions')}</a>
				</div>

				{#if data.recentScans.length === 0}
					<p class="text-sm opacity-60 py-4 text-center">{$t('common.noResults')}</p>
				{:else}
					<div class="space-y-2">
						{#each data.recentScans as scan (scan.id)}
							<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<span class="badge badge-outline badge-xs">
											{scan.tag?.type?.toUpperCase() ?? '?'}
										</span>
										<span class="text-sm font-medium truncate">
											{scan.tag?.code ?? '-'}
										</span>
									</div>
									<div class="text-xs opacity-60 mt-0.5">
										{scan.action}
										{#if scan.user}
											&middot; {scan.user.name}
										{/if}
									</div>
								</div>
								<span class="text-xs opacity-50 ml-2 flex-shrink-0">
									{formatTimestamp(scan.timestamp)}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
