<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data } = $props();

	// Tab state
	let activeTab = $state<'bags' | 'clothing'>('bags');

	// Filter state
	let searchText = $state('');
	let filterType = $state('');
	let filterCondition = $state('');
	let filterSeason = $state('');

	// Modal state
	let showBagModal = $state(false);
	let showClothingModal = $state(false);
	let showDeleteConfirm = $state(false);

	// Edit state
	let editingBag = $state<any>(null);
	let editingClothing = $state<any>(null);
	let deleteTarget = $state<{ type: 'bag' | 'clothing'; id: string } | null>(null);

	// Bag types and clothing types for filters
	const bagTypes = ['clothing_bag', 'shoe_bag'];
	const clothingTypes = ['kleid', 'schuerze', 'hemd', 'weste', 'hose', 'shorts', 'suspenders', 'shoes'];
	const conditions = ['good', 'worn', 'needs_repair', 'needs_laundry'];
	const bagConditions = ['good', 'worn', 'needs_repair'];
	const seasons = ['all', 'winter', 'summer'];

	// Filtered bags
	let filteredBags = $derived(
		data.bags.filter((bag: any) => {
			const matchesSearch =
				!searchText ||
				bag.label.toLowerCase().includes(searchText.toLowerCase()) ||
				bag.notes?.toLowerCase().includes(searchText.toLowerCase());
			const matchesType = !filterType || bag.type === filterType;
			const matchesCondition = !filterCondition || bag.condition === filterCondition;
			return matchesSearch && matchesType && matchesCondition;
		})
	);

	// Filtered clothing
	let filteredClothing = $derived(
		data.clothingPieces.filter((piece: any) => {
			const matchesSearch =
				!searchText ||
				piece.color?.toLowerCase().includes(searchText.toLowerCase()) ||
				(piece.sizeDe || '').toLowerCase().includes(searchText.toLowerCase()) ||
				(piece.sizeEu || '').toLowerCase().includes(searchText.toLowerCase()) ||
				piece.notes?.toLowerCase().includes(searchText.toLowerCase());
			const matchesType = !filterType || piece.type === filterType;
			const matchesCondition = !filterCondition || piece.condition === filterCondition;
			const matchesSeason = !filterSeason || piece.season === filterSeason;
			return matchesSearch && matchesType && matchesCondition && matchesSeason;
		})
	);

	function openAddBag() {
		editingBag = null;
		showBagModal = true;
	}

	function openEditBag(bag: any) {
		editingBag = { ...bag };
		showBagModal = true;
	}

	function closeBagModal() {
		showBagModal = false;
		editingBag = null;
	}

	function openAddClothing() {
		editingClothing = null;
		showClothingModal = true;
	}

	function openEditClothing(piece: any) {
		editingClothing = { ...piece };
		showClothingModal = true;
	}

	function closeClothingModal() {
		showClothingModal = false;
		editingClothing = null;
	}

	function openDeleteConfirm(type: 'bag' | 'clothing', id: string) {
		deleteTarget = { type, id };
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		deleteTarget = null;
	}

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

	function seasonClass(season: string): string {
		switch (season) {
			case 'winter':
				return 'badge-info';
			case 'summer':
				return 'badge-warning';
			default:
				return 'badge-ghost';
		}
	}

	function resetFilters() {
		searchText = '';
		filterType = '';
		filterCondition = '';
		filterSeason = '';
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('inventory.title')}</h1>
		<div class="flex gap-2">
			{#if activeTab === 'bags'}
				<button class="btn btn-primary btn-sm" onclick={openAddBag}>
					+ {$t('inventory.addBag')}
				</button>
			{:else}
				<button class="btn btn-primary btn-sm" onclick={openAddClothing}>
					+ {$t('inventory.addClothing')}
				</button>
			{/if}
		</div>
	</div>

	<!-- Tabs -->
	<div role="tablist" class="tabs tabs-boxed">
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'bags'}
			onclick={() => { activeTab = 'bags'; resetFilters(); }}
		>
			{$t('inventory.bags')} ({data.bags.length})
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={activeTab === 'clothing'}
			onclick={() => { activeTab = 'clothing'; resetFilters(); }}
		>
			{$t('inventory.clothing')} ({data.clothingPieces.length})
		</button>
	</div>

	<!-- Filter bar -->
	<div class="flex flex-wrap gap-2 items-center bg-base-200 p-3 rounded-lg">
		<input
			type="text"
			placeholder={$t('common.search')}
			class="input input-sm input-bordered w-48"
			bind:value={searchText}
		/>

		{#if activeTab === 'bags'}
			<select class="select select-sm select-bordered" bind:value={filterType}>
				<option value="">{$t('inventory.type')}</option>
				{#each bagTypes as bt}
					<option value={bt}>{$t(`inventory.bagTypes.${bt}`)}</option>
				{/each}
			</select>
			<select class="select select-sm select-bordered" bind:value={filterCondition}>
				<option value="">{$t('inventory.condition')}</option>
				{#each bagConditions as c}
					<option value={c}>{$t(`inventory.conditions.${c}`)}</option>
				{/each}
			</select>
		{:else}
			<select class="select select-sm select-bordered" bind:value={filterType}>
				<option value="">{$t('inventory.type')}</option>
				{#each clothingTypes as ct}
					<option value={ct}>{$t(`inventory.clothingTypes.${ct}`)}</option>
				{/each}
			</select>
			<select class="select select-sm select-bordered" bind:value={filterCondition}>
				<option value="">{$t('inventory.condition')}</option>
				{#each conditions as c}
					<option value={c}>{$t(`inventory.conditions.${c}`)}</option>
				{/each}
			</select>
			<select class="select select-sm select-bordered" bind:value={filterSeason}>
				<option value="">{$t('inventory.season')}</option>
				{#each seasons as s}
					<option value={s}>{$t(`inventory.seasons.${s}`)}</option>
				{/each}
			</select>
		{/if}

		{#if searchText || filterType || filterCondition || filterSeason}
			<button class="btn btn-ghost btn-sm" onclick={resetFilters}>
				{$t('common.close')}
			</button>
		{/if}
	</div>

	<!-- Bags Tab Content -->
	{#if activeTab === 'bags'}
		{#if filteredBags.length === 0}
			<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each filteredBags as bag (bag.id)}
					<div
						class="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
						onclick={() => openEditBag(bag)}
						onkeydown={(e) => { if (e.key === 'Enter') openEditBag(bag); }}
						role="button"
						tabindex="0"
					>
						<div class="card-body p-4">
							<div class="flex items-start justify-between gap-2">
								<h3 class="card-title text-base">{bag.label}</h3>
								<span class="badge badge-sm {conditionClass(bag.condition)}">
									{$t(`inventory.conditions.${bag.condition}`)}
								</span>
							</div>
							<div class="flex flex-wrap gap-1 mt-1">
								<span class="badge badge-outline badge-sm">
									{$t(`inventory.bagTypes.${bag.type}`)}
								</span>
							</div>
							<div class="text-sm opacity-70 mt-2">
								{#if bag.bagAssignment?.child}
									<span class="text-primary font-medium">
										{bag.bagAssignment.child.firstName} {bag.bagAssignment.child.lastName}
									</span>
								{:else}
									<span class="italic">{$t('inventory.unassigned')}</span>
								{/if}
							</div>
							<div class="text-xs opacity-50 mt-1">
								{bag.clothingPieces.length} {$t('inventory.clothing').toLowerCase()}
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- Clothing Tab Content -->
	{#if activeTab === 'clothing'}
		{#if filteredClothing.length === 0}
			<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead>
						<tr>
							<th>{$t('inventory.type')}</th>
							<th>{$t('inventory.size')}</th>
							<th>{$t('inventory.color')}</th>
							<th>{$t('inventory.condition')}</th>
							<th>{$t('inventory.season')}</th>
							<th>{$t('inventory.inBag')}</th>
							<th>{$t('assignments.child')}</th>
						</tr>
					</thead>
					<tbody>
						{#each filteredClothing as piece (piece.id)}
							<tr
								class="hover cursor-pointer"
								onclick={() => openEditClothing(piece)}
								onkeydown={(e) => { if (e.key === 'Enter') openEditClothing(piece); }}
								tabindex="0"
								role="button"
							>
								<td>
									<span class="font-medium">{$t(`inventory.clothingTypes.${piece.type}`)}</span>
								</td>
								<td>{piece.sizeDe || piece.sizeEu || '-'}</td>
								<td>{piece.color || '-'}</td>
								<td>
									<span class="badge badge-sm {conditionClass(piece.condition)}">
										{$t(`inventory.conditions.${piece.condition}`)}
									</span>
								</td>
								<td>
									<span class="badge badge-sm {seasonClass(piece.season)}">
										{$t(`inventory.seasons.${piece.season}`)}
									</span>
								</td>
								<td>
									{#if piece.bag}
										{piece.bag.label}
									{:else}
										<span class="opacity-50">-</span>
									{/if}
								</td>
								<td>
									{#if piece.clothingAssignment?.child}
										<span class="text-primary font-medium">
											{piece.clothingAssignment.child.firstName} {piece.clothingAssignment.child.lastName}
										</span>
									{:else}
										<span class="italic opacity-50">{$t('inventory.unassigned')}</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	{/if}
</div>

<!-- Bag Add/Edit Modal -->
{#if showBagModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingBag ? $t('common.edit') : $t('inventory.addBag')}
			</h3>
			<form
				method="POST"
				action={editingBag ? '?/updateBag' : '?/createBag'}
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeBagModal();
					};
				}}
			>
				{#if editingBag}
					<input type="hidden" name="id" value={editingBag.id} />
				{/if}

				<div class="form-control mb-3">
					<label class="label" for="bag-label">
						<span class="label-text">{$t('inventory.label')}</span>
					</label>
					<input
						id="bag-label"
						type="text"
						name="label"
						class="input input-bordered"
						value={editingBag?.label ?? ''}
						required
					/>
				</div>

				<div class="form-control mb-3">
					<label class="label" for="bag-type">
						<span class="label-text">{$t('inventory.type')}</span>
					</label>
					<select id="bag-type" name="type" class="select select-bordered" required>
						{#each bagTypes as bt}
							<option value={bt} selected={editingBag?.type === bt}>
								{$t(`inventory.bagTypes.${bt}`)}
							</option>
						{/each}
					</select>
				</div>

				<div class="form-control mb-3">
					<label class="label" for="bag-condition">
						<span class="label-text">{$t('inventory.condition')}</span>
					</label>
					<select id="bag-condition" name="condition" class="select select-bordered">
						{#each bagConditions as c}
							<option value={c} selected={editingBag?.condition === c}>
								{$t(`inventory.conditions.${c}`)}
							</option>
						{/each}
					</select>
				</div>

				<div class="form-control mb-4">
					<label class="label" for="bag-notes">
						<span class="label-text">{$t('children.notes')}</span>
					</label>
					<textarea
						id="bag-notes"
						name="notes"
						class="textarea textarea-bordered"
						rows="2"
					>{editingBag?.notes ?? ''}</textarea>
				</div>

				<div class="modal-action">
					{#if editingBag}
						<button
							type="button"
							class="btn btn-error btn-outline mr-auto"
							onclick={() => { closeBagModal(); openDeleteConfirm('bag', editingBag.id); }}
						>
							{$t('inventory.delete')}
						</button>
					{/if}
					<button type="button" class="btn" onclick={closeBagModal}>
						{$t('inventory.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('inventory.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeBagModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Clothing Add/Edit Modal -->
{#if showClothingModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingClothing ? $t('common.edit') : $t('inventory.addClothing')}
			</h3>
			<form
				method="POST"
				action={editingClothing ? '?/updateClothing' : '?/createClothing'}
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeClothingModal();
					};
				}}
			>
				{#if editingClothing}
					<input type="hidden" name="id" value={editingClothing.id} />
				{/if}

				<div class="grid grid-cols-2 gap-3">
					<div class="form-control">
						<label class="label" for="clothing-type">
							<span class="label-text">{$t('inventory.type')}</span>
						</label>
						<select id="clothing-type" name="type" class="select select-bordered" required>
							{#each clothingTypes as ct}
								<option value={ct} selected={editingClothing?.type === ct}>
									{$t(`inventory.clothingTypes.${ct}`)}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-sizeDe">
							<span class="label-text">{$t('inventory.sizeDe')}</span>
						</label>
						<input
							id="clothing-sizeDe"
							type="text"
							name="sizeDe"
							class="input input-bordered"
							value={editingClothing?.sizeDe ?? ''}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-sizeEu">
							<span class="label-text">{$t('inventory.sizeEu')}</span>
						</label>
						<input
							id="clothing-sizeEu"
							type="text"
							name="sizeEu"
							class="input input-bordered"
							value={editingClothing?.sizeEu ?? ''}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-sizeUs">
							<span class="label-text">{$t('inventory.sizeUs')}</span>
						</label>
						<input
							id="clothing-sizeUs"
							type="text"
							name="sizeUs"
							class="input input-bordered"
							value={editingClothing?.sizeUs ?? ''}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-sizeUk">
							<span class="label-text">{$t('inventory.sizeUk')}</span>
						</label>
						<input
							id="clothing-sizeUk"
							type="text"
							name="sizeUk"
							class="input input-bordered"
							value={editingClothing?.sizeUk ?? ''}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-color">
							<span class="label-text">{$t('inventory.color')}</span>
						</label>
						<input
							id="clothing-color"
							type="text"
							name="color"
							class="input input-bordered"
							value={editingClothing?.color ?? ''}
						/>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-condition">
							<span class="label-text">{$t('inventory.condition')}</span>
						</label>
						<select id="clothing-condition" name="condition" class="select select-bordered">
							{#each conditions as c}
								<option value={c} selected={editingClothing?.condition === c}>
									{$t(`inventory.conditions.${c}`)}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-season">
							<span class="label-text">{$t('inventory.season')}</span>
						</label>
						<select id="clothing-season" name="season" class="select select-bordered">
							{#each seasons as s}
								<option value={s} selected={editingClothing?.season === s}>
									{$t(`inventory.seasons.${s}`)}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="clothing-bag">
							<span class="label-text">{$t('inventory.inBag')}</span>
						</label>
						<select id="clothing-bag" name="bagId" class="select select-bordered">
							<option value="">-</option>
							{#each data.allBags as bag}
								<option value={bag.id} selected={editingClothing?.bagId === bag.id}>
									{bag.label}
								</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-control mt-3">
					<label class="label" for="clothing-notes">
						<span class="label-text">{$t('children.notes')}</span>
					</label>
					<textarea
						id="clothing-notes"
						name="notes"
						class="textarea textarea-bordered"
						rows="2"
					>{editingClothing?.notes ?? ''}</textarea>
				</div>

				<div class="modal-action">
					{#if editingClothing}
						<button
							type="button"
							class="btn btn-error btn-outline mr-auto"
							onclick={() => { closeClothingModal(); openDeleteConfirm('clothing', editingClothing.id); }}
						>
							{$t('inventory.delete')}
						</button>
					{/if}
					<button type="button" class="btn" onclick={closeClothingModal}>
						{$t('inventory.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('inventory.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeClothingModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && deleteTarget}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{$t('children.confirmDelete')}</h3>
			<div class="modal-action">
				<button class="btn" onclick={closeDeleteConfirm}>
					{$t('inventory.cancel')}
				</button>
				<form
					method="POST"
					action={deleteTarget.type === 'bag' ? '?/deleteBag' : '?/deleteClothing'}
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							closeDeleteConfirm();
						};
					}}
				>
					<input type="hidden" name="id" value={deleteTarget.id} />
					<button type="submit" class="btn btn-error">
						{$t('inventory.delete')}
					</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeDeleteConfirm}>close</button>
		</form>
	</dialog>
{/if}
