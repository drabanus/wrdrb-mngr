<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Modal state
	let showModal = $state(false);
	let showDeleteConfirm = $state(false);

	// Edit state
	let editingUser = $state<any>(null);
	let deleteTargetId = $state('');
	let deleteTargetIsAdmin = $state(false);

	// Role options
	const roles = ['admin', 'receptionist', 'laundry', 'mender'];

	function openAdd() {
		editingUser = null;
		showModal = true;
	}

	function openEdit(user: any) {
		editingUser = { ...user };
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingUser = null;
	}

	function openDeleteConfirm(user: any) {
		deleteTargetId = user.id;
		deleteTargetIsAdmin = user.role === 'admin';
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		deleteTargetId = '';
		deleteTargetIsAdmin = false;
	}

	function roleBadgeClass(role: string): string {
		switch (role) {
			case 'admin':
				return 'badge-primary';
			case 'receptionist':
				return 'badge-info';
			case 'laundry':
				return 'badge-warning';
			case 'mender':
				return 'badge-secondary';
			default:
				return 'badge-ghost';
		}
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('personnel.title')}</h1>
		<button class="btn btn-primary btn-sm" onclick={openAdd}>
			+ {$t('personnel.addPerson')}
		</button>
	</div>

	<!-- Error/Success Messages -->
	{#if form?.error}
		<div class="alert alert-error text-sm">
			<span>{form.error}</span>
		</div>
	{/if}
	{#if form?.success}
		<div class="alert alert-success text-sm">
			<span>{$t('common.save')} OK</span>
		</div>
	{/if}

	<!-- Users Table (desktop) / Cards (mobile) -->
	{#if data.users.length === 0}
		<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
	{:else}
		<!-- Desktop Table -->
		<div class="hidden sm:block overflow-x-auto">
			<table class="table table-sm">
				<thead>
					<tr>
						<th>{$t('personnel.name')}</th>
						<th>{$t('personnel.username')}</th>
						<th>{$t('personnel.email')}</th>
						<th>{$t('personnel.role')}</th>
						<th>{$t('dispatch.status')}</th>
						<th>{$t('common.actions')}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.users as user (user.id)}
						<tr
							class="hover cursor-pointer"
							onclick={() => openEdit(user)}
							onkeydown={(e) => { if (e.key === 'Enter') openEdit(user); }}
							tabindex="0"
							role="button"
						>
							<td>
								<span class="font-medium">{user.name}</span>
							</td>
							<td class="opacity-70">{user.username}</td>
							<td class="opacity-70">{user.email}</td>
							<td>
								<span class="badge badge-sm {roleBadgeClass(user.role)}">
									{$t(`personnel.roles.${user.role}`)}
								</span>
							</td>
							<td>
								<span class="badge badge-sm" class:badge-success={user.active} class:badge-ghost={!user.active}>
									{user.active ? $t('personnel.active') : $t('personnel.inactive')}
								</span>
							</td>
							<td>
								<div class="flex gap-1" onclick={(e) => e.stopPropagation()}>
									<form
										method="POST"
										action="?/toggleActive"
										use:enhance={() => {
											return async ({ update }) => {
												await update();
											};
										}}
									>
										<input type="hidden" name="id" value={user.id} />
										<button
											type="submit"
											class="btn btn-ghost btn-xs"
											title={$t('personnel.toggleActive')}
										>
											{user.active ? 'Deactivate' : 'Activate'}
										</button>
									</form>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile Cards -->
		<div class="sm:hidden space-y-2">
			{#each data.users as user (user.id)}
				<div
					class="card bg-base-100 shadow-sm border border-base-300 cursor-pointer hover:shadow-md transition-shadow"
					onclick={() => openEdit(user)}
					onkeydown={(e) => { if (e.key === 'Enter') openEdit(user); }}
					role="button"
					tabindex="0"
				>
					<div class="card-body p-4">
						<div class="flex items-start justify-between gap-2">
							<div>
								<h3 class="font-semibold">{user.name}</h3>
								<p class="text-sm opacity-60">{user.username}</p>
								<p class="text-sm opacity-60">{user.email}</p>
							</div>
							<div class="flex flex-col items-end gap-1">
								<span class="badge badge-sm {roleBadgeClass(user.role)}">
									{$t(`personnel.roles.${user.role}`)}
								</span>
								<span class="badge badge-sm" class:badge-success={user.active} class:badge-ghost={!user.active}>
									{user.active ? $t('personnel.active') : $t('personnel.inactive')}
								</span>
							</div>
						</div>
						<div class="mt-2" onclick={(e) => e.stopPropagation()}>
							<form
								method="POST"
								action="?/toggleActive"
								use:enhance={() => {
									return async ({ update }) => {
										await update();
									};
								}}
							>
								<input type="hidden" name="id" value={user.id} />
								<button
									type="submit"
									class="btn btn-ghost btn-xs"
								>
									{$t('personnel.toggleActive')}
								</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add/Edit Person Modal -->
{#if showModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingUser ? $t('personnel.editPerson') : $t('personnel.addPerson')}
			</h3>
			<form
				method="POST"
				action={editingUser ? '?/update' : '?/create'}
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeModal();
					};
				}}
			>
				{#if editingUser}
					<input type="hidden" name="id" value={editingUser.id} />
				{/if}

				<div class="form-control mb-3">
					<label class="label" for="person-name">
						<span class="label-text">{$t('personnel.name')}</span>
					</label>
					<input
						id="person-name"
						type="text"
						name="name"
						class="input input-bordered"
						value={editingUser?.name ?? ''}
						required
					/>
				</div>

				<div class="form-control mb-3">
					<label class="label" for="person-username">
						<span class="label-text">{$t('personnel.username')}</span>
					</label>
					<input
						id="person-username"
						type="text"
						name="username"
						class="input input-bordered"
						value={editingUser?.username ?? ''}
						required
						disabled={!!editingUser}
					/>
					{#if editingUser}
						<input type="hidden" name="username" value={editingUser.username} />
					{/if}
				</div>

				<div class="form-control mb-3">
					<label class="label" for="person-password">
						<span class="label-text">{$t('personnel.password')}</span>
					</label>
					<input
						id="person-password"
						type="password"
						name="password"
						class="input input-bordered"
						required={!editingUser}
					/>
					{#if editingUser}
						<label class="label">
							<span class="label-text-alt opacity-60">{$t('personnel.passwordHint')}</span>
						</label>
					{/if}
				</div>

				<div class="form-control mb-3">
					<label class="label" for="person-email">
						<span class="label-text">{$t('personnel.email')}</span>
					</label>
					<input
						id="person-email"
						type="email"
						name="email"
						class="input input-bordered"
						value={editingUser?.email ?? ''}
						required
					/>
				</div>

				<div class="form-control mb-3">
					<label class="label" for="person-role">
						<span class="label-text">{$t('personnel.role')}</span>
					</label>
					<select
						id="person-role"
						name="role"
						class="select select-bordered"
						required
					>
						{#each roles as role}
							<option value={role} selected={editingUser?.role === role}>
								{$t(`personnel.roles.${role}`)}
							</option>
						{/each}
					</select>
				</div>

				{#if editingUser}
					<div class="form-control mb-4">
						<label class="label cursor-pointer justify-start gap-3">
							<input
								type="checkbox"
								name="active"
								class="toggle toggle-success"
								checked={editingUser.active}
							/>
							<span class="label-text">
								{editingUser.active ? $t('personnel.active') : $t('personnel.inactive')}
							</span>
						</label>
					</div>
				{/if}

				<div class="modal-action">
					{#if editingUser}
						<button
							type="button"
							class="btn btn-error btn-outline mr-auto"
							onclick={() => { closeModal(); openDeleteConfirm(editingUser); }}
						>
							{$t('personnel.delete')}
						</button>
					{/if}
					<button type="button" class="btn" onclick={closeModal}>
						{$t('personnel.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('personnel.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{$t('personnel.confirmDelete')}</h3>
			{#if deleteTargetIsAdmin}
				<div class="alert alert-warning mt-3 text-sm">
					<span>{$t('personnel.cannotDeleteLastAdmin')}</span>
				</div>
			{/if}
			<div class="modal-action">
				<button class="btn" onclick={closeDeleteConfirm}>
					{$t('personnel.cancel')}
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
						{$t('personnel.delete')}
					</button>
				</form>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeDeleteConfirm}>close</button>
		</form>
	</dialog>
{/if}
