<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Modal state
	let showAssignBagModal = $state(false);
	let showAssignClothingModal = $state(false);
	let showUnassignConfirm = $state(false);

	// Current child for assignment
	let selectedChildId = $state('');
	let selectedChildName = $state('');

	// Unassign target
	let unassignTarget = $state<{ type: 'bag' | 'clothing'; id: string } | null>(null);

	// Search within assignment modals
	let bagSearch = $state('');
	let clothingSearch = $state('');

	// Expanded accordion panels
	let expandedChildren = $state<Set<string>>(new Set());

	function toggleChild(childId: string) {
		const next = new Set(expandedChildren);
		if (next.has(childId)) {
			next.delete(childId);
		} else {
			next.add(childId);
		}
		expandedChildren = next;
	}

	function isExpanded(childId: string): boolean {
		return expandedChildren.has(childId);
	}

	function openAssignBag(childId: string, childName: string) {
		selectedChildId = childId;
		selectedChildName = childName;
		bagSearch = '';
		showAssignBagModal = true;
	}

	function closeAssignBagModal() {
		showAssignBagModal = false;
		selectedChildId = '';
		selectedChildName = '';
	}

	function openAssignClothing(childId: string, childName: string) {
		selectedChildId = childId;
		selectedChildName = childName;
		clothingSearch = '';
		showAssignClothingModal = true;
	}

	function closeAssignClothingModal() {
		showAssignClothingModal = false;
		selectedChildId = '';
		selectedChildName = '';
	}

	function openUnassignConfirm(type: 'bag' | 'clothing', id: string) {
		unassignTarget = { type, id };
		showUnassignConfirm = true;
	}

	function closeUnassignConfirm() {
		showUnassignConfirm = false;
		unassignTarget = null;
	}

	let filteredUnassignedBags = $derived(
		data.unassignedBags.filter((bag: any) => {
			if (!bagSearch) return true;
			const search = bagSearch.toLowerCase();
			return (
				bag.label.toLowerCase().includes(search) ||
				bag.type.toLowerCase().includes(search)
			);
		})
	);

	let filteredUnassignedClothing = $derived(
		data.unassignedClothing.filter((piece: any) => {
			if (!clothingSearch) return true;
			const search = clothingSearch.toLowerCase();
			return (
				piece.type.toLowerCase().includes(search) ||
				piece.size.toLowerCase().includes(search) ||
				(piece.color && piece.color.toLowerCase().includes(search))
			);
		})
	);

	function conditionClass(condition: string): string {
		switch (condition) {
			case 'good':
				return 'badge-success';
			case 'worn':
				return 'badge-warning';
			case 'needs_repair':
				return 'badge-error';
			case 'needs_laundry':
				return 'badge-info';
			default:
				return 'badge-ghost';
		}
	}

	function genderBadge(gender: string): string {
		return gender === 'girl' ? 'badge-secondary' : 'badge-accent';
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('assignments.title')}</h1>
		<div class="text-sm opacity-60">
			{data.unassignedBags.length} {$t('assignments.bag').toLowerCase()}(s) &middot;
			{data.unassignedClothing.length} {$t('assignments.clothing').toLowerCase()} {$t('inventory.unassigned').toLowerCase()}
		</div>
	</div>

	<!-- Children list -->
	{#if data.children.length === 0}
		<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
	{:else}
		<div class="space-y-2">
			{#each data.children as child (child.id)}
				{@const totalBags = child.bagAssignments.length}
				{@const totalClothing = child.clothingAssignments.length}
				{@const expanded = isExpanded(child.id)}

				<div class="collapse collapse-arrow bg-base-100 border border-base-300 rounded-lg">
					<input
						type="checkbox"
						checked={expanded}
						onchange={() => toggleChild(child.id)}
					/>
					<div class="collapse-title">
						<div class="flex items-center gap-3 pr-4">
							<div class="flex-1">
								<span class="font-semibold text-base">
									{child.firstName} {child.lastName}
								</span>
								<span class="badge badge-sm {genderBadge(child.gender)} ml-2">
									{$t(`children.${child.gender}`)}
								</span>
							</div>
							<div class="flex gap-2 text-sm opacity-60">
								<span class="badge badge-ghost badge-sm">
									{totalBags} {$t('inventory.bags').toLowerCase()}
								</span>
								<span class="badge badge-ghost badge-sm">
									{totalClothing} {$t('inventory.clothing').toLowerCase()}
								</span>
							</div>
						</div>
					</div>
					<div class="collapse-content">
						<div class="space-y-4 pt-2">
							<!-- Assigned Bags -->
							<div>
								<div class="flex items-center justify-between mb-2">
									<h4 class="font-medium text-sm">{$t('inventory.bags')}</h4>
									<button
										class="btn btn-primary btn-xs"
										onclick={() => openAssignBag(child.id, `${child.firstName} ${child.lastName}`)}
										disabled={data.unassignedBags.length === 0}
									>
										+ {$t('assignments.assignBag')}
									</button>
								</div>
								{#if child.bagAssignments.length === 0}
									<p class="text-sm opacity-50 italic">{$t('children.noBags')}</p>
								{:else}
									<div class="space-y-1">
										{#each child.bagAssignments as assignment (assignment.id)}
											<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
												<div class="flex items-center gap-2">
													<span class="font-medium text-sm">{assignment.bag.label}</span>
													<span class="badge badge-outline badge-xs">
														{$t(`inventory.bagTypes.${assignment.bag.type}`)}
													</span>
													<span class="text-xs opacity-50">
														({assignment.bag.clothingPieces.length} {$t('inventory.clothing').toLowerCase()})
													</span>
												</div>
												<button
													class="btn btn-ghost btn-xs text-error"
													onclick={() => openUnassignConfirm('bag', assignment.id)}
												>
													{$t('assignments.unassign')}
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Divider -->
							<div class="divider my-0"></div>

							<!-- Assigned Clothing -->
							<div>
								<div class="flex items-center justify-between mb-2">
									<h4 class="font-medium text-sm">{$t('inventory.clothing')}</h4>
									<button
										class="btn btn-primary btn-xs"
										onclick={() => openAssignClothing(child.id, `${child.firstName} ${child.lastName}`)}
										disabled={data.unassignedClothing.length === 0}
									>
										+ {$t('assignments.assignClothing')}
									</button>
								</div>
								{#if child.clothingAssignments.length === 0}
									<p class="text-sm opacity-50 italic">{$t('children.noClothing')}</p>
								{:else}
									<div class="space-y-1">
										{#each child.clothingAssignments as assignment (assignment.id)}
											<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
												<div class="flex items-center gap-2 flex-wrap">
													<span class="font-medium text-sm">
														{$t(`inventory.clothingTypes.${assignment.clothingPiece.type}`)}
													</span>
													<span class="badge badge-outline badge-xs">
														{$t('inventory.size')}: {assignment.clothingPiece.size}
													</span>
													{#if assignment.clothingPiece.color}
														<span class="badge badge-outline badge-xs">
															{assignment.clothingPiece.color}
														</span>
													{/if}
													<span class="badge badge-xs {conditionClass(assignment.clothingPiece.condition)}">
														{$t(`inventory.conditions.${assignment.clothingPiece.condition}`)}
													</span>
													{#if assignment.clothingPiece.bag}
														<span class="text-xs opacity-50">
															({$t('inventory.inBag')}: {assignment.clothingPiece.bag.label})
														</span>
													{/if}
												</div>
												<button
													class="btn btn-ghost btn-xs text-error flex-shrink-0"
													onclick={() => openUnassignConfirm('clothing', assignment.id)}
												>
													{$t('assignments.unassign')}
												</button>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Assign Bag Modal -->
{#if showAssignBagModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-1">{$t('assignments.assignBag')}</h3>
			<p class="text-sm opacity-60 mb-4">{$t('assignments.child')}: {selectedChildName}</p>

			<input
				type="text"
				placeholder={$t('common.search')}
				class="input input-bordered input-sm w-full mb-3"
				bind:value={bagSearch}
			/>

			{#if filteredUnassignedBags.length === 0}
				<p class="text-sm opacity-50 italic py-4 text-center">{$t('common.noResults')}</p>
			{:else}
				<div class="space-y-1 max-h-64 overflow-y-auto">
					{#each filteredUnassignedBags as bag (bag.id)}
						<form
							method="POST"
							action="?/assignBag"
							use:enhance={() => {
								return async ({ update }) => {
									await update();
									closeAssignBagModal();
								};
							}}
						>
							<input type="hidden" name="bagId" value={bag.id} />
							<input type="hidden" name="childId" value={selectedChildId} />
							<button
								type="submit"
								class="w-full text-left flex items-center justify-between bg-base-200 hover:bg-base-300 rounded-lg px-3 py-2 transition-colors"
							>
								<div class="flex items-center gap-2">
									<span class="font-medium text-sm">{bag.label}</span>
									<span class="badge badge-outline badge-xs">
										{$t(`inventory.bagTypes.${bag.type}`)}
									</span>
								</div>
								<span class="text-xs text-primary">{$t('assignments.save')}</span>
							</button>
						</form>
					{/each}
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-sm" onclick={closeAssignBagModal}>
					{$t('inventory.cancel')}
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeAssignBagModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Assign Clothing Modal -->
{#if showAssignClothingModal}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<h3 class="font-bold text-lg mb-1">{$t('assignments.assignClothing')}</h3>
			<p class="text-sm opacity-60 mb-4">{$t('assignments.child')}: {selectedChildName}</p>

			<input
				type="text"
				placeholder={$t('common.search')}
				class="input input-bordered input-sm w-full mb-3"
				bind:value={clothingSearch}
			/>

			{#if filteredUnassignedClothing.length === 0}
				<p class="text-sm opacity-50 italic py-4 text-center">{$t('common.noResults')}</p>
			{:else}
				<div class="space-y-1 max-h-72 overflow-y-auto">
					{#each filteredUnassignedClothing as piece (piece.id)}
						<form
							method="POST"
							action="?/assignClothing"
							use:enhance={() => {
								return async ({ update }) => {
									await update();
									closeAssignClothingModal();
								};
							}}
						>
							<input type="hidden" name="clothingPieceId" value={piece.id} />
							<input type="hidden" name="childId" value={selectedChildId} />
							<input type="hidden" name="notes" value="" />
							<button
								type="submit"
								class="w-full text-left flex items-center justify-between bg-base-200 hover:bg-base-300 rounded-lg px-3 py-2 transition-colors"
							>
								<div class="flex items-center gap-2 flex-wrap">
									<span class="font-medium text-sm">
										{$t(`inventory.clothingTypes.${piece.type}`)}
									</span>
									<span class="badge badge-outline badge-xs">
										{$t('inventory.size')}: {piece.size}
									</span>
									{#if piece.color}
										<span class="badge badge-outline badge-xs">{piece.color}</span>
									{/if}
									<span class="badge badge-xs {conditionClass(piece.condition)}">
										{$t(`inventory.conditions.${piece.condition}`)}
									</span>
									{#if piece.bag}
										<span class="text-xs opacity-50">
											({$t('inventory.inBag')}: {piece.bag.label})
										</span>
									{/if}
								</div>
								<span class="text-xs text-primary flex-shrink-0 ml-2">{$t('assignments.save')}</span>
							</button>
						</form>
					{/each}
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-sm" onclick={closeAssignClothingModal}>
					{$t('inventory.cancel')}
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeAssignClothingModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Unassign Confirmation Modal -->
{#if showUnassignConfirm && unassignTarget}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{$t('children.confirmDelete')}</h3>
			<p class="py-4 text-sm opacity-70">{$t('assignments.unassign')}?</p>
			<div class="modal-action">
				<button class="btn btn-sm" onclick={closeUnassignConfirm}>
					{$t('inventory.cancel')}
				</button>
				<form
					method="POST"
					action={unassignTarget.type === 'bag' ? '?/unassignBag' : '?/unassignClothing'}
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							closeUnassignConfirm();
						};
					}}
				>
					<input type="hidden" name="id" value={unassignTarget.id} />
					<button type="submit" class="btn btn-error btn-sm">
						{$t('assignments.unassign')}
					</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeUnassignConfirm}>close</button>
		</form>
	</dialog>
{/if}
