<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// --- Helpers ---

	function getAge(birthDate: Date | string): number {
		const birth = new Date(birthDate);
		const now = new Date();
		let age = now.getFullYear() - birth.getFullYear();
		const m = now.getMonth() - birth.getMonth();
		if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
		return age;
	}

	function formatDate(date: Date | string): string {
		return new Date(date).toLocaleDateString();
	}

	function genderBadge(gender: string): string {
		return gender === 'girl' ? 'badge-secondary' : 'badge-accent';
	}

	// --- Filter / Search state ---

	let genderFilter = $state<'all' | 'girl' | 'boy'>('all');
	let searchText = $state('');

	let girlCount = $derived(data.children.filter((c: any) => c.gender === 'girl').length);
	let boyCount = $derived(data.children.filter((c: any) => c.gender === 'boy').length);

	let filteredChildren = $derived(
		data.children.filter((child: any) => {
			const matchesGender =
				genderFilter === 'all' || child.gender === genderFilter;
			const matchesSearch =
				!searchText ||
				`${child.firstName} ${child.lastName}`
					.toLowerCase()
					.includes(searchText.toLowerCase());
			return matchesGender && matchesSearch;
		})
	);

	// --- Add Child Modal ---

	let showAddModal = $state(false);

	function openAddModal() {
		showAddModal = true;
	}

	function closeAddModal() {
		showAddModal = false;
	}

	// --- Detail Modal ---

	let selectedChild = $state<any>(null);
	let detailTab = $state<'info' | 'measurements' | 'contacts' | 'equipment'>('info');

	function openDetail(child: any) {
		selectedChild = { ...child };
		detailTab = 'info';
		showMeasurementForm = false;
		showContactForm = false;
	}

	function closeDetail() {
		selectedChild = null;
	}

	// Reactive: keep selectedChild in sync with data after form submission
	let currentChild = $derived(
		selectedChild
			? data.children.find((c: any) => c.id === selectedChild.id) ?? null
			: null
	);

	// --- Measurement form toggle ---

	let showMeasurementForm = $state(false);

	function toggleMeasurementForm() {
		showMeasurementForm = !showMeasurementForm;
	}

	// --- Contact form toggle ---

	let showContactForm = $state(false);

	function toggleContactForm() {
		showContactForm = !showContactForm;
	}

	// --- Delete confirmation ---

	let showDeleteConfirm = $state(false);
	let deleteTargetId = $state('');

	function openDeleteConfirm(id: string) {
		deleteTargetId = id;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		deleteTargetId = '';
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('children.title')}</h1>
		<button class="btn btn-primary btn-sm" onclick={openAddModal}>
			+ {$t('children.addChild')}
		</button>
	</div>

	<!-- Filter tabs -->
	<div role="tablist" class="tabs tabs-boxed">
		<button
			role="tab"
			class="tab"
			class:tab-active={genderFilter === 'all'}
			onclick={() => genderFilter = 'all'}
		>
			{$t('children.allChildren')} ({data.children.length})
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={genderFilter === 'girl'}
			onclick={() => genderFilter = 'girl'}
		>
			{$t('children.girls')} ({girlCount})
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={genderFilter === 'boy'}
			onclick={() => genderFilter = 'boy'}
		>
			{$t('children.boys')} ({boyCount})
		</button>
	</div>

	<!-- Search -->
	<div class="bg-base-200 p-3 rounded-lg">
		<input
			type="text"
			placeholder={$t('common.search')}
			class="input input-sm input-bordered w-full sm:w-64"
			bind:value={searchText}
		/>
	</div>

	<!-- Children card grid -->
	{#if filteredChildren.length === 0}
		<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each filteredChildren as child (child.id)}
				{@const latestMeasurement = child.measurements?.[0]}
				<div
					class="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
					onclick={() => openDetail(child)}
					onkeydown={(e) => { if (e.key === 'Enter') openDetail(child); }}
					role="button"
					tabindex="0"
				>
					<div class="card-body p-4">
						<div class="flex items-start justify-between gap-2">
							<h3 class="card-title text-base">
								{child.firstName} {child.lastName}
							</h3>
							<span class="badge badge-sm {genderBadge(child.gender)}">
								{$t(`children.${child.gender}`)}
							</span>
						</div>
						<div class="flex flex-wrap gap-1 mt-1">
							<span class="badge badge-outline badge-sm">
								{getAge(child.birthDate)} {$t('children.years')}
							</span>
							{#if latestMeasurement?.clothingSize}
								<span class="badge badge-outline badge-sm">
									{$t('children.clothingSize')}: {latestMeasurement.clothingSize}
								</span>
							{/if}
						</div>
						{#if !child.active}
							<div class="mt-1">
								<span class="badge badge-ghost badge-sm">{$t('children.inactive')}</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Child Modal -->
{#if showAddModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">{$t('children.addChild')}</h3>
			<form
				method="POST"
				action="?/create"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeAddModal();
					};
				}}
			>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div class="form-control">
						<label class="label" for="add-firstName">
							<span class="label-text">{$t('children.firstName')}</span>
						</label>
						<input
							id="add-firstName"
							type="text"
							name="firstName"
							class="input input-bordered"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="add-lastName">
							<span class="label-text">{$t('children.lastName')}</span>
						</label>
						<input
							id="add-lastName"
							type="text"
							name="lastName"
							class="input input-bordered"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="add-birthDate">
							<span class="label-text">{$t('children.birthDate')}</span>
						</label>
						<input
							id="add-birthDate"
							type="date"
							name="birthDate"
							class="input input-bordered"
							required
						/>
					</div>

					<div class="form-control">
						<label class="label" for="add-gender">
							<span class="label-text">{$t('children.gender')}</span>
						</label>
						<select id="add-gender" name="gender" class="select select-bordered" required>
							<option value="girl">{$t('children.girl')}</option>
							<option value="boy">{$t('children.boy')}</option>
						</select>
					</div>
				</div>

				<div class="modal-action">
					<button type="button" class="btn" onclick={closeAddModal}>
						{$t('children.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('children.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeAddModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Detail Modal -->
{#if currentChild}
	<dialog class="modal modal-open">
		<div class="modal-box max-w-2xl">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-bold text-lg">
					{currentChild.firstName} {currentChild.lastName}
					<span class="badge badge-sm {genderBadge(currentChild.gender)} ml-2">
						{$t(`children.${currentChild.gender}`)}
					</span>
				</h3>
				<button class="btn btn-sm btn-ghost" onclick={closeDetail}>
					{$t('common.close')}
				</button>
			</div>

			<!-- Detail tabs -->
			<div role="tablist" class="tabs tabs-boxed mb-4">
				<button
					role="tab"
					class="tab"
					class:tab-active={detailTab === 'info'}
					onclick={() => detailTab = 'info'}
				>
					{$t('children.info')}
				</button>
				<button
					role="tab"
					class="tab"
					class:tab-active={detailTab === 'measurements'}
					onclick={() => detailTab = 'measurements'}
				>
					{$t('children.measurements')}
				</button>
				<button
					role="tab"
					class="tab"
					class:tab-active={detailTab === 'contacts'}
					onclick={() => detailTab = 'contacts'}
				>
					{$t('children.contacts')}
				</button>
				<button
					role="tab"
					class="tab"
					class:tab-active={detailTab === 'equipment'}
					onclick={() => detailTab = 'equipment'}
				>
					{$t('children.bags')}/{$t('children.clothingPieces')}
				</button>
			</div>

			<!-- Info Tab -->
			{#if detailTab === 'info'}
				<form
					method="POST"
					action="?/update"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<input type="hidden" name="id" value={currentChild.id} />

					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div class="form-control">
							<label class="label" for="edit-firstName">
								<span class="label-text">{$t('children.firstName')}</span>
							</label>
							<input
								id="edit-firstName"
								type="text"
								name="firstName"
								class="input input-bordered"
								value={currentChild.firstName}
								required
							/>
						</div>

						<div class="form-control">
							<label class="label" for="edit-lastName">
								<span class="label-text">{$t('children.lastName')}</span>
							</label>
							<input
								id="edit-lastName"
								type="text"
								name="lastName"
								class="input input-bordered"
								value={currentChild.lastName}
								required
							/>
						</div>

						<div class="form-control">
							<label class="label" for="edit-birthDate">
								<span class="label-text">{$t('children.birthDate')}</span>
							</label>
							<input
								id="edit-birthDate"
								type="date"
								name="birthDate"
								class="input input-bordered"
								value={new Date(currentChild.birthDate).toISOString().split('T')[0]}
								required
							/>
						</div>

						<div class="form-control">
							<label class="label" for="edit-gender">
								<span class="label-text">{$t('children.gender')}</span>
							</label>
							<select
								id="edit-gender"
								name="gender"
								class="select select-bordered"
								required
							>
								<option value="girl" selected={currentChild.gender === 'girl'}>
									{$t('children.girl')}
								</option>
								<option value="boy" selected={currentChild.gender === 'boy'}>
									{$t('children.boy')}
								</option>
							</select>
						</div>
					</div>

					<div class="form-control mt-3">
						<label class="label" for="edit-notes">
							<span class="label-text">{$t('children.notes')}</span>
						</label>
						<textarea
							id="edit-notes"
							name="notes"
							class="textarea textarea-bordered"
							rows="2"
						>{currentChild.notes ?? ''}</textarea>
					</div>

					<div class="form-control mt-3">
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="checkbox"
								name="active"
								class="toggle toggle-primary"
								checked={currentChild.active}
							/>
							<span class="label-text">
								{currentChild.active ? $t('children.active') : $t('children.inactive')}
							</span>
						</label>
					</div>

					<div class="flex items-center justify-between mt-4">
						<button
							type="button"
							class="btn btn-error btn-outline btn-sm"
							onclick={() => { closeDetail(); openDeleteConfirm(currentChild.id); }}
						>
							{$t('children.delete')}
						</button>
						<button type="submit" class="btn btn-primary btn-sm">
							{$t('children.save')}
						</button>
					</div>
				</form>
			{/if}

			<!-- Measurements Tab -->
			{#if detailTab === 'measurements'}
				{@const measurements = currentChild.measurements ?? []}
				{@const latest = measurements[0]}

				{#if latest}
					<div class="mb-4">
						<h4 class="font-semibold text-sm mb-2">{$t('children.latestMeasurements')}</h4>
						<div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
							{#if latest.heightCm != null}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.height')}</div>
									<div class="font-medium">{latest.heightCm}</div>
								</div>
							{/if}
							{#if latest.armLengthCm != null}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.armLength')}</div>
									<div class="font-medium">{latest.armLengthCm}</div>
								</div>
							{/if}
							{#if latest.legLengthCm != null}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.legLength')}</div>
									<div class="font-medium">{latest.legLengthCm}</div>
								</div>
							{/if}
							{#if latest.headCircCm != null}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.headCirc')}</div>
									<div class="font-medium">{latest.headCircCm}</div>
								</div>
							{/if}
							{#if latest.bellyCircCm != null}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.bellyCirc')}</div>
									<div class="font-medium">{latest.bellyCircCm}</div>
								</div>
							{/if}
							{#if latest.hipCircCm != null}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.hipCirc')}</div>
									<div class="font-medium">{latest.hipCircCm}</div>
								</div>
							{/if}
							{#if latest.clothingSize}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.clothingSize')}</div>
									<div class="font-medium">{latest.clothingSize}</div>
								</div>
							{/if}
							{#if latest.shoeSize}
								<div class="bg-base-200 rounded-lg p-2">
									<div class="opacity-60 text-xs">{$t('children.shoeSize')}</div>
									<div class="font-medium">{latest.shoeSize}</div>
								</div>
							{/if}
						</div>
						<div class="text-xs opacity-50 mt-1">
							{$t('children.measuredAt')}: {formatDate(latest.measuredAt)}
						</div>
					</div>
				{:else}
					<p class="text-sm opacity-50 italic mb-4">{$t('children.noMeasurements')}</p>
				{/if}

				<!-- Measurement history -->
				{#if measurements.length > 1}
					<div class="mb-4">
						<div class="collapse collapse-arrow bg-base-200 rounded-lg">
							<input type="checkbox" />
							<div class="collapse-title text-sm font-medium">
								{$t('children.measurements')} ({measurements.length})
							</div>
							<div class="collapse-content">
								<div class="overflow-x-auto">
									<table class="table table-xs">
										<thead>
											<tr>
												<th>{$t('children.measuredAt')}</th>
												<th>{$t('children.height')}</th>
												<th>{$t('children.clothingSize')}</th>
												<th>{$t('children.shoeSize')}</th>
											</tr>
										</thead>
										<tbody>
											{#each measurements as m (m.id)}
												<tr>
													<td>{formatDate(m.measuredAt)}</td>
													<td>{m.heightCm ?? '-'}</td>
													<td>{m.clothingSize ?? '-'}</td>
													<td>{m.shoeSize ?? '-'}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Add measurement form -->
				<div class="mt-2">
					<button
						class="btn btn-primary btn-sm"
						onclick={toggleMeasurementForm}
					>
						{showMeasurementForm ? $t('children.cancel') : `+ ${$t('children.addMeasurement')}`}
					</button>

					{#if showMeasurementForm}
						<form
							method="POST"
							action="?/addMeasurement"
							class="mt-3 space-y-3"
							use:enhance={() => {
								return async ({ update }) => {
									await update();
									showMeasurementForm = false;
								};
							}}
						>
							<input type="hidden" name="childId" value={currentChild.id} />

							<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
								<div class="form-control">
									<label class="label" for="m-height">
										<span class="label-text text-xs">{$t('children.height')}</span>
									</label>
									<input
										id="m-height"
										type="number"
										step="0.1"
										name="heightCm"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-armLength">
										<span class="label-text text-xs">{$t('children.armLength')}</span>
									</label>
									<input
										id="m-armLength"
										type="number"
										step="0.1"
										name="armLengthCm"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-legLength">
										<span class="label-text text-xs">{$t('children.legLength')}</span>
									</label>
									<input
										id="m-legLength"
										type="number"
										step="0.1"
										name="legLengthCm"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-headCirc">
										<span class="label-text text-xs">{$t('children.headCirc')}</span>
									</label>
									<input
										id="m-headCirc"
										type="number"
										step="0.1"
										name="headCircCm"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-bellyCirc">
										<span class="label-text text-xs">{$t('children.bellyCirc')}</span>
									</label>
									<input
										id="m-bellyCirc"
										type="number"
										step="0.1"
										name="bellyCircCm"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-hipCirc">
										<span class="label-text text-xs">{$t('children.hipCirc')}</span>
									</label>
									<input
										id="m-hipCirc"
										type="number"
										step="0.1"
										name="hipCircCm"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-clothingSize">
										<span class="label-text text-xs">{$t('children.clothingSize')}</span>
									</label>
									<input
										id="m-clothingSize"
										type="text"
										name="clothingSize"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="m-shoeSize">
										<span class="label-text text-xs">{$t('children.shoeSize')}</span>
									</label>
									<input
										id="m-shoeSize"
										type="text"
										name="shoeSize"
										class="input input-bordered input-sm"
									/>
								</div>
							</div>

							<button type="submit" class="btn btn-primary btn-sm">
								{$t('children.save')}
							</button>
						</form>
					{/if}
				</div>
			{/if}

			<!-- Contacts Tab -->
			{#if detailTab === 'contacts'}
				{@const parents = currentChild.parents ?? []}

				{#if parents.length === 0}
					<p class="text-sm opacity-50 italic mb-4">{$t('children.noContacts')}</p>
				{:else}
					<div class="space-y-2 mb-4">
						{#each parents as parent (parent.id)}
							<div class="bg-base-200 rounded-lg p-3">
								<div class="flex items-start justify-between gap-2">
									<div>
										<div class="font-medium text-sm">{parent.name}</div>
										<div class="text-xs opacity-60">
											{$t(`children.relationTypes.${parent.relation}`)}
										</div>
										{#if parent.phone}
											<div class="text-sm mt-1">{parent.phone}</div>
										{/if}
										{#if parent.email}
											<div class="text-sm">{parent.email}</div>
										{/if}
									</div>
									<div class="flex flex-col gap-1">
										{#if parent.phone}
											<a href="tel:{parent.phone}" class="btn btn-ghost btn-xs">
												{$t('children.call')}
											</a>
										{/if}
										{#if parent.email}
											<a href="mailto:{parent.email}" class="btn btn-ghost btn-xs">
												{$t('children.sendEmail')}
											</a>
										{/if}
										<form
											method="POST"
											action="?/deleteParent"
											use:enhance={() => {
												return async ({ update }) => {
													await update();
												};
											}}
										>
											<input type="hidden" name="id" value={parent.id} />
											<button type="submit" class="btn btn-ghost btn-xs text-error">
												{$t('children.deleteContact')}
											</button>
										</form>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add contact form -->
				<div>
					<button
						class="btn btn-primary btn-sm"
						onclick={toggleContactForm}
					>
						{showContactForm ? $t('children.cancel') : `+ ${$t('children.addParent')}`}
					</button>

					{#if showContactForm}
						<form
							method="POST"
							action="?/addParent"
							class="mt-3 space-y-3"
							use:enhance={() => {
								return async ({ update }) => {
									await update();
									showContactForm = false;
								};
							}}
						>
							<input type="hidden" name="childId" value={currentChild.id} />

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<div class="form-control">
									<label class="label" for="p-name">
										<span class="label-text text-xs">{$t('children.parentName')}</span>
									</label>
									<input
										id="p-name"
										type="text"
										name="name"
										class="input input-bordered input-sm"
										required
									/>
								</div>
								<div class="form-control">
									<label class="label" for="p-relation">
										<span class="label-text text-xs">{$t('children.relation')}</span>
									</label>
									<select
										id="p-relation"
										name="relation"
										class="select select-bordered select-sm"
									>
										<option value="parent">{$t('children.relationTypes.parent')}</option>
										<option value="guardian">{$t('children.relationTypes.guardian')}</option>
									</select>
								</div>
								<div class="form-control">
									<label class="label" for="p-phone">
										<span class="label-text text-xs">{$t('children.phone')}</span>
									</label>
									<input
										id="p-phone"
										type="tel"
										name="phone"
										class="input input-bordered input-sm"
									/>
								</div>
								<div class="form-control">
									<label class="label" for="p-email">
										<span class="label-text text-xs">{$t('children.email')}</span>
									</label>
									<input
										id="p-email"
										type="email"
										name="email"
										class="input input-bordered input-sm"
									/>
								</div>
							</div>

							<button type="submit" class="btn btn-primary btn-sm">
								{$t('children.save')}
							</button>
						</form>
					{/if}
				</div>
			{/if}

			<!-- Bags/Clothing Tab -->
			{#if detailTab === 'equipment'}
				{@const bagAssignments = currentChild.bagAssignments ?? []}
				{@const clothingAssignments = currentChild.clothingAssignments ?? []}

				<!-- Bags -->
				<div class="mb-4">
					<h4 class="font-semibold text-sm mb-2">{$t('children.bags')}</h4>
					{#if bagAssignments.length === 0}
						<p class="text-sm opacity-50 italic">{$t('children.noBags')}</p>
					{:else}
						<div class="space-y-1">
							{#each bagAssignments as assignment (assignment.id)}
								<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
									<div class="flex items-center gap-2">
										<span class="font-medium text-sm">{assignment.bag.label}</span>
										<span class="badge badge-outline badge-xs">
											{$t(`inventory.bagTypes.${assignment.bag.type}`)}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<div class="divider my-2"></div>

				<!-- Clothing -->
				<div>
					<h4 class="font-semibold text-sm mb-2">{$t('children.clothingPieces')}</h4>
					{#if clothingAssignments.length === 0}
						<p class="text-sm opacity-50 italic">{$t('children.noClothing')}</p>
					{:else}
						<div class="space-y-1">
							{#each clothingAssignments as assignment (assignment.id)}
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
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeDetail}>close</button>
		</form>
	</dialog>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && deleteTargetId}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{$t('children.confirmDelete')}</h3>
			<div class="modal-action">
				<button class="btn" onclick={closeDeleteConfirm}>
					{$t('children.cancel')}
				</button>
				<form
					method="POST"
					action="?/delete"
					use:enhance={() => {
						return async ({ update }) => {
							await update();
							closeDeleteConfirm();
						};
					}}
				>
					<input type="hidden" name="id" value={deleteTargetId} />
					<button type="submit" class="btn btn-error">
						{$t('children.delete')}
					</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeDeleteConfirm}>close</button>
		</form>
	</dialog>
{/if}
