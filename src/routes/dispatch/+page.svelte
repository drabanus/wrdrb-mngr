<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Selected gig
	let selectedGigId = $state<string | null>(null);

	// Modal state
	let showAddGigModal = $state(false);
	let showDeleteConfirm = $state(false);
	let deleteGigId = $state<string | null>(null);

	// Selected gig derived
	let selectedGig = $derived(
		selectedGigId ? data.gigs.find((g: any) => g.id === selectedGigId) : null
	);

	// Determine bag dispatch status for the selected gig
	function getBagStatus(bagId: string): 'not_dispatched' | 'dispatched' | 'received' {
		if (!selectedGig) return 'not_dispatched';
		const events = selectedGig.dispatchEvents.filter((e: any) => e.bagId === bagId);
		if (events.length === 0) return 'not_dispatched';
		// Get the latest event for this bag
		const latest = events[events.length - 1];
		if (latest.action === 'receive') return 'received';
		if (latest.action === 'dispatch') return 'dispatched';
		return 'not_dispatched';
	}

	// Format date for display
	function formatDate(date: string | Date): string {
		return new Date(date).toLocaleDateString(undefined, {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
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

	// Bag dispatch status badge class
	function dispatchStatusClass(status: string): string {
		switch (status) {
			case 'dispatched':
				return 'badge-warning';
			case 'received':
				return 'badge-success';
			default:
				return 'badge-ghost';
		}
	}

	// Bag dispatch status label
	function dispatchStatusLabel(status: string): string {
		switch (status) {
			case 'dispatched':
				return $t('dispatch.dispatched');
			case 'received':
				return $t('dispatch.received');
			default:
				return '-';
		}
	}

	// Next gig status transition
	function getNextStatus(current: string): string | null {
		switch (current) {
			case 'upcoming':
				return 'dispatched';
			case 'dispatched':
				return 'completed';
			default:
				return null;
		}
	}

	function selectGig(id: string) {
		selectedGigId = selectedGigId === id ? null : id;
	}

	function openAddGigModal() {
		showAddGigModal = true;
	}

	function closeAddGigModal() {
		showAddGigModal = false;
	}

	function openDeleteConfirm(id: string) {
		deleteGigId = id;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		deleteGigId = null;
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('dispatch.title')}</h1>
		<button class="btn btn-primary btn-sm" onclick={openAddGigModal}>
			+ {$t('dispatch.addGig')}
		</button>
	</div>

	<!-- Gig list -->
	{#if data.gigs.length === 0}
		<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
	{:else}
		<div class="space-y-3">
			{#each data.gigs as gig (gig.id)}
				{@const isSelected = selectedGigId === gig.id}
				{@const nextStatus = getNextStatus(gig.status)}

				<div class="card bg-base-100 border border-base-300 {isSelected ? 'shadow-md ring-2 ring-primary/30' : 'shadow-sm'}">
					<!-- Gig header (clickable) -->
					<div
						class="card-body p-4 cursor-pointer"
						onclick={() => selectGig(gig.id)}
						onkeydown={(e) => { if (e.key === 'Enter') selectGig(gig.id); }}
						role="button"
						tabindex="0"
					>
						<div class="flex items-center justify-between gap-3">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<h3 class="font-semibold text-base">{gig.name}</h3>
									<span class="badge badge-sm {gigStatusClass(gig.status)}">
										{$t(`dispatch.gigs.${gig.status}`)}
									</span>
								</div>
								<div class="text-sm opacity-60 mt-1">
									{formatDate(gig.date)}
									{#if gig.location}
										&middot; {gig.location}
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-2 flex-shrink-0">
								<button
									class="btn btn-ghost btn-xs text-error"
									onclick={(e) => { e.stopPropagation(); openDeleteConfirm(gig.id); }}
								>
									{$t('common.delete')}
								</button>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 opacity-40 transition-transform {isSelected ? 'rotate-180' : ''}"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</div>
						</div>
					</div>

					<!-- Expanded content: dispatch actions -->
					{#if isSelected}
						<div class="border-t border-base-300 p-4 space-y-4">
							<!-- Status change actions -->
							{#if nextStatus}
								<div class="flex items-center gap-3">
									<span class="text-sm font-medium">{$t('dispatch.status')}:</span>
									<form method="POST" action="?/updateGigStatus" use:enhance>
										<input type="hidden" name="id" value={gig.id} />
										<input type="hidden" name="status" value={nextStatus} />
										<button type="submit" class="btn btn-sm btn-outline btn-primary">
											{$t(`dispatch.gigs.${nextStatus}`)}
										</button>
									</form>
								</div>
							{/if}

							<!-- Bags list -->
							<div>
								<h4 class="font-medium text-sm mb-2">
									{$t('dispatch.dispatchBags')} / {$t('dispatch.receiveBags')}
								</h4>

								{#if data.bags.length === 0}
									<p class="text-sm opacity-50 italic">{$t('common.noResults')}</p>
								{:else}
									<div class="space-y-2">
										{#each data.bags as bag (bag.id)}
											{@const status = getBagStatus(bag.id)}
											<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
												<div class="flex items-center gap-2 flex-1 min-w-0">
													<span class="font-medium text-sm truncate">{bag.label}</span>
													{#if bag.bagAssignment?.child}
														<span class="text-xs text-primary">
															{bag.bagAssignment.child.firstName} {bag.bagAssignment.child.lastName}
														</span>
													{/if}
													<span class="text-xs opacity-50">
														({bag.clothingPieces.length} {$t('inventory.clothing').toLowerCase()})
													</span>
													{#if status !== 'not_dispatched'}
														<span class="badge badge-xs {dispatchStatusClass(status)}">
															{dispatchStatusLabel(status)}
														</span>
													{/if}
												</div>
												<div class="flex gap-1 flex-shrink-0">
													{#if status === 'not_dispatched'}
														<form method="POST" action="?/dispatchBag" use:enhance>
															<input type="hidden" name="gigId" value={gig.id} />
															<input type="hidden" name="bagId" value={bag.id} />
															<button type="submit" class="btn btn-xs btn-primary">
																{$t('dispatch.dispatched')}
															</button>
														</form>
													{:else if status === 'dispatched'}
														<form method="POST" action="?/receiveBag" use:enhance>
															<input type="hidden" name="gigId" value={gig.id} />
															<input type="hidden" name="bagId" value={bag.id} />
															<button type="submit" class="btn btn-xs btn-success">
																{$t('dispatch.received')}
															</button>
														</form>
													{:else}
														<span class="text-xs text-success opacity-70">{$t('dispatch.received')}</span>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Gig Modal -->
{#if showAddGigModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">{$t('dispatch.addGig')}</h3>
			<form
				method="POST"
				action="?/createGig"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeAddGigModal();
					};
				}}
			>
				<div class="form-control mb-3">
					<label class="label" for="gig-name">
						<span class="label-text">{$t('dispatch.gigName')}</span>
					</label>
					<input
						id="gig-name"
						type="text"
						name="name"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control mb-3">
					<label class="label" for="gig-date">
						<span class="label-text">{$t('dispatch.gigDate')}</span>
					</label>
					<input
						id="gig-date"
						type="date"
						name="date"
						class="input input-bordered"
						required
					/>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="gig-location">
						<span class="label-text">{$t('dispatch.gigLocation')}</span>
					</label>
					<input
						id="gig-location"
						type="text"
						name="location"
						class="input input-bordered"
					/>
				</div>

				<div class="modal-action">
					<button type="button" class="btn" onclick={closeAddGigModal}>
						{$t('common.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('common.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeAddGigModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Delete Gig Confirmation Modal -->
{#if showDeleteConfirm && deleteGigId}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{$t('children.confirmDelete')}</h3>
			<div class="modal-action">
				<button class="btn" onclick={closeDeleteConfirm}>
					{$t('common.cancel')}
				</button>
				<form
					method="POST"
					action="?/deleteGig"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							closeDeleteConfirm();
							if (selectedGigId === deleteGigId) {
								selectedGigId = null;
							}
						};
					}}
				>
					<input type="hidden" name="id" value={deleteGigId} />
					<button type="submit" class="btn btn-error">
						{$t('common.delete')}
					</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeDeleteConfirm}>close</button>
		</form>
	</dialog>
{/if}
