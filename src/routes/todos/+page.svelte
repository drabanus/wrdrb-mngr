<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Constants
	const todoTypes = ['laundry', 'repair', 'return_reminder', 'size_change', 'custom'] as const;
	const priorities = ['low', 'normal', 'high', 'urgent'] as const;
	const statuses = ['open', 'in_progress', 'done'] as const;

	// Filter state
	let filterStatus = $state('');
	let filterType = $state('');
	let filterPriority = $state('');
	let filterAssignedTo = $state('');

	// Modal state
	let showEditModal = $state(false);
	let showDeleteConfirm = $state(false);
	let editingTodo = $state<any>(null);
	let deleteTargetId = $state('');

	// Filtered items
	let filteredTodos = $derived(
		data.todoItems.filter((todo: any) => {
			const matchesStatus = !filterStatus || todo.status === filterStatus;
			const matchesType = !filterType || todo.type === filterType;
			const matchesPriority = !filterPriority || todo.priority === filterPriority;
			const matchesAssigned = !filterAssignedTo || todo.assignedTo === filterAssignedTo;
			return matchesStatus && matchesType && matchesPriority && matchesAssigned;
		})
	);

	// Counts per status for filter bar
	let statusCounts = $derived({
		all: data.todoItems.length,
		open: data.todoItems.filter((t: any) => t.status === 'open').length,
		in_progress: data.todoItems.filter((t: any) => t.status === 'in_progress').length,
		done: data.todoItems.filter((t: any) => t.status === 'done').length
	});

	function priorityClass(priority: string): string {
		switch (priority) {
			case 'urgent':
				return 'badge-error';
			case 'high':
				return 'badge-warning';
			case 'normal':
				return 'badge-info';
			case 'low':
				return 'badge-ghost';
			default:
				return 'badge-ghost';
		}
	}

	function statusClass(status: string): string {
		switch (status) {
			case 'open':
				return 'badge-outline';
			case 'in_progress':
				return 'badge-warning';
			case 'done':
				return 'badge-success';
			default:
				return 'badge-outline';
		}
	}

	function openAddModal() {
		editingTodo = { id: '', title: '', type: 'custom', priority: 'normal', status: 'open', assignedTo: '', dueDate: '', description: '' };
		showEditModal = true;
	}

	function openEditModal(todo: any) {
		editingTodo = { ...todo, dueDate: formatDateForInput(todo.dueDate ?? null) };
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editingTodo = null;
	}

	function openDeleteConfirm(id: string) {
		deleteTargetId = id;
		showDeleteConfirm = true;
	}

	function closeDeleteConfirm() {
		showDeleteConfirm = false;
		deleteTargetId = '';
	}

	function resetFilters() {
		filterStatus = '';
		filterType = '';
		filterPriority = '';
		filterAssignedTo = '';
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function formatDateForInput(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		return date.toISOString().split('T')[0];
	}

	function isOverdue(todo: any): boolean {
		if (!todo.dueDate || todo.status === 'done') return false;
		return new Date(todo.dueDate) < new Date();
	}

	function getAssignedUserName(todo: any): string {
		if (todo.assignedUser) {
			return todo.assignedUser.name;
		}
		return '';
	}

	let hasActiveFilters = $derived(
		filterStatus !== '' || filterType !== '' || filterPriority !== '' || filterAssignedTo !== ''
	);
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('todos.title')}</h1>
		<button class="btn btn-primary btn-sm" onclick={openAddModal}>
			+ {$t('todos.addTask')}
		</button>
	</div>

	<!-- Status filter tabs -->
	<div role="tablist" class="tabs tabs-boxed">
		<button
			role="tab"
			class="tab"
			class:tab-active={filterStatus === ''}
			onclick={() => { filterStatus = ''; }}
		>
			{$t('common.all')} ({statusCounts.all})
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={filterStatus === 'open'}
			onclick={() => { filterStatus = 'open'; }}
		>
			{$t('todos.statuses.open')} ({statusCounts.open})
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={filterStatus === 'in_progress'}
			onclick={() => { filterStatus = 'in_progress'; }}
		>
			{$t('todos.statuses.in_progress')} ({statusCounts.in_progress})
		</button>
		<button
			role="tab"
			class="tab"
			class:tab-active={filterStatus === 'done'}
			onclick={() => { filterStatus = 'done'; }}
		>
			{$t('todos.statuses.done')} ({statusCounts.done})
		</button>
	</div>

	<!-- Filter bar -->
	<div class="flex flex-wrap gap-2 items-center bg-base-200 p-3 rounded-lg">
		<select class="select select-sm select-bordered" bind:value={filterType}>
			<option value="">{$t('todos.type')}</option>
			{#each todoTypes as tt}
				<option value={tt}>{$t(`todos.types.${tt}`)}</option>
			{/each}
		</select>

		<select class="select select-sm select-bordered" bind:value={filterPriority}>
			<option value="">{$t('todos.priority')}</option>
			{#each priorities as p}
				<option value={p}>{$t(`todos.priorities.${p}`)}</option>
			{/each}
		</select>

		<select class="select select-sm select-bordered" bind:value={filterAssignedTo}>
			<option value="">{$t('todos.assignedTo')}</option>
			{#each data.users as user}
				<option value={user.id}>{user.name}</option>
			{/each}
		</select>

		{#if hasActiveFilters}
			<button class="btn btn-ghost btn-sm" onclick={resetFilters}>
				{$t('common.close')}
			</button>
		{/if}
	</div>

	<!-- Task cards -->
	{#if filteredTodos.length === 0}
		<div class="text-center py-12 opacity-60">{$t('common.noResults')}</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
			{#each filteredTodos as todo (todo.id)}
				<div
					class="card bg-base-100 shadow-sm border cursor-pointer hover:shadow-md transition-shadow"
					class:border-error={isOverdue(todo)}
					class:border-base-300={!isOverdue(todo)}
					onclick={() => openEditModal(todo)}
					onkeydown={(e) => { if (e.key === 'Enter') openEditModal(todo); }}
					role="button"
					tabindex="0"
				>
					<div class="card-body p-4">
						<!-- Title and priority -->
						<div class="flex items-start justify-between gap-2">
							<h3 class="card-title text-base line-clamp-2">{todo.title}</h3>
							<span class="badge badge-sm {priorityClass(todo.priority)} flex-shrink-0">
								{$t(`todos.priorities.${todo.priority}`)}
							</span>
						</div>

						<!-- Type badge and status -->
						<div class="flex flex-wrap gap-1 mt-1">
							<span class="badge badge-outline badge-sm">
								{$t(`todos.types.${todo.type}`)}
							</span>
							<span class="badge badge-sm {statusClass(todo.status)}">
								{$t(`todos.statuses.${todo.status}`)}
							</span>
						</div>

						<!-- Assigned user -->
						{#if getAssignedUserName(todo)}
							<div class="text-sm opacity-70 mt-2">
								<span class="text-primary font-medium">{getAssignedUserName(todo)}</span>
							</div>
						{:else}
							<div class="text-sm opacity-50 italic mt-2">
								{$t('todos.unassigned')}
							</div>
						{/if}

						<!-- Due date -->
						{#if todo.dueDate}
							<div class="text-xs mt-1" class:text-error={isOverdue(todo)} class:opacity-50={!isOverdue(todo)}>
								{$t('todos.dueDate')}: {formatDate(todo.dueDate)}
							</div>
						{/if}

						<!-- Quick status actions -->
						<div class="card-actions justify-end mt-2">
							{#if todo.status !== 'in_progress'}
								<form
									method="POST"
									action="?/updateStatus"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={todo.id} />
									<input type="hidden" name="status" value="in_progress" />
									<button
										type="submit"
										class="btn btn-warning btn-xs"
										onclick={(e) => e.stopPropagation()}
									>
										{$t('todos.markInProgress')}
									</button>
								</form>
							{/if}
							{#if todo.status !== 'done'}
								<form
									method="POST"
									action="?/updateStatus"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
										};
									}}
								>
									<input type="hidden" name="id" value={todo.id} />
									<input type="hidden" name="status" value="done" />
									<button
										type="submit"
										class="btn btn-success btn-xs"
										onclick={(e) => e.stopPropagation()}
									>
										{$t('todos.markDone')}
									</button>
								</form>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add/Edit Modal -->
{#if showEditModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">
				{editingTodo?.id ? $t('todos.editTask') : $t('todos.addTask')}
			</h3>
			<form
				method="POST"
				action={editingTodo?.id ? '?/update' : '?/create'}
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeEditModal();
					};
				}}
			>
				{#if editingTodo?.id}
					<input type="hidden" name="id" value={editingTodo.id} />
				{/if}

				<div class="form-control mb-3">
					<label class="label" for="todo-title">
						<span class="label-text">{$t('todos.titleField')}</span>
					</label>
					<input
						id="todo-title"
						type="text"
						name="title"
						class="input input-bordered"
						bind:value={editingTodo.title}
						required
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div class="form-control">
						<label class="label" for="todo-type">
							<span class="label-text">{$t('todos.type')}</span>
						</label>
						<select id="todo-type" name="type" class="select select-bordered" bind:value={editingTodo.type} required>
							{#each todoTypes as tt}
								<option value={tt}>
									{$t(`todos.types.${tt}`)}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-control">
						<label class="label" for="todo-priority">
							<span class="label-text">{$t('todos.priority')}</span>
						</label>
						<select id="todo-priority" name="priority" class="select select-bordered" bind:value={editingTodo.priority}>
							{#each priorities as p}
								<option value={p}>
									{$t(`todos.priorities.${p}`)}
								</option>
							{/each}
						</select>
					</div>
				</div>

				{#if editingTodo?.id}
					<div class="form-control mt-3">
						<label class="label" for="todo-status">
							<span class="label-text">{$t('todos.status')}</span>
						</label>
						<select id="todo-status" name="status" class="select select-bordered" bind:value={editingTodo.status}>
							{#each statuses as s}
								<option value={s}>
									{$t(`todos.statuses.${s}`)}
								</option>
							{/each}
						</select>
					</div>
				{/if}

				<div class="form-control mt-3">
					<label class="label" for="todo-assigned">
						<span class="label-text">{$t('todos.assignedTo')}</span>
					</label>
					<select id="todo-assigned" name="assignedTo" class="select select-bordered" bind:value={editingTodo.assignedTo}>
						<option value="">-</option>
						{#each data.users as user}
							<option value={user.id}>
								{user.name}
							</option>
						{/each}
					</select>
				</div>

				<div class="form-control mt-3">
					<label class="label" for="todo-due">
						<span class="label-text">{$t('todos.dueDate')}</span>
					</label>
					<input
						id="todo-due"
						type="date"
						name="dueDate"
						class="input input-bordered"
						bind:value={editingTodo.dueDate}
					/>
				</div>

				<div class="form-control mt-3">
					<label class="label" for="todo-description">
						<span class="label-text">{$t('todos.description')}</span>
					</label>
					<textarea
						id="todo-description"
						name="description"
						class="textarea textarea-bordered"
						rows="3"
						bind:value={editingTodo.description}
					></textarea>
				</div>

				<div class="modal-action">
					{#if editingTodo?.id}
						<button
							type="button"
							class="btn btn-error btn-outline mr-auto"
							onclick={() => { closeEditModal(); openDeleteConfirm(editingTodo.id); }}
						>
							{$t('common.delete')}
						</button>
					{/if}
					<button type="button" class="btn" onclick={closeEditModal}>
						{$t('common.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('common.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeEditModal}>close</button>
		</form>
	</dialog>
{/if}

<!-- Delete Confirmation Modal -->
{#if showDeleteConfirm && deleteTargetId}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg">{$t('todos.confirmDelete')}</h3>
			<p class="py-4 text-sm opacity-70">{$t('todos.confirmDeleteMessage')}</p>
			<div class="modal-action">
				<button class="btn" onclick={closeDeleteConfirm}>
					{$t('common.cancel')}
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
