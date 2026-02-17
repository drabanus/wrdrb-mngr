<script lang="ts">
	import { t } from '$i18n';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	// Current view date
	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth()); // 0-indexed

	// Modal state
	let showAddGigModal = $state(false);
	let showGigDetailModal = $state(false);
	let selectedDayGigs = $state<any[]>([]);
	let selectedDate = $state('');

	// Reminder state
	let sendingReminder = $state(false);

	// Days of the week headers
	const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	// Derived: current month/year display label
	let monthLabel = $derived(
		new Date(viewYear, viewMonth, 1).toLocaleString('default', {
			month: 'long',
			year: 'numeric'
		})
	);

	// Derived: days in the current view month
	let daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());

	// Derived: first day of month (0=Sun, convert to Mon=0 based)
	let firstDayOfWeek = $derived(() => {
		const day = new Date(viewYear, viewMonth, 1).getDay();
		// Convert: Sunday=0 -> 6, Monday=1 -> 0, etc.
		return day === 0 ? 6 : day - 1;
	});

	// Build calendar grid cells
	let calendarCells = $derived(() => {
		const cells: Array<{ day: number | null; dateStr: string }> = [];
		const offset = firstDayOfWeek();

		// Leading empty cells
		for (let i = 0; i < offset; i++) {
			cells.push({ day: null, dateStr: '' });
		}

		// Day cells
		for (let d = 1; d <= daysInMonth; d++) {
			const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
			cells.push({ day: d, dateStr });
		}

		// Trailing empty cells to fill last row
		const remainder = cells.length % 7;
		if (remainder > 0) {
			for (let i = 0; i < 7 - remainder; i++) {
				cells.push({ day: null, dateStr: '' });
			}
		}

		return cells;
	});

	// Derived: map of date string -> gigs for that date
	let gigsByDate = $derived(() => {
		const map = new Map<string, any[]>();
		for (const gig of data.gigs) {
			const d = new Date(gig.date);
			const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(gig);
		}
		return map;
	});

	// Derived: upcoming gigs (date >= today)
	let upcomingGigs = $derived(
		data.gigs.filter((gig: any) => new Date(gig.date) >= new Date(new Date().toDateString()))
	);

	// Today's date string
	let todayStr = $derived(() => {
		const now = new Date();
		return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
	});

	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear--;
		} else {
			viewMonth--;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear++;
		} else {
			viewMonth++;
		}
	}

	function goToToday() {
		const now = new Date();
		viewYear = now.getFullYear();
		viewMonth = now.getMonth();
	}

	function openDayDetail(dateStr: string) {
		const gigs = gigsByDate().get(dateStr);
		if (gigs && gigs.length > 0) {
			selectedDayGigs = gigs;
			selectedDate = dateStr;
			showGigDetailModal = true;
		}
	}

	function closeDayDetail() {
		showGigDetailModal = false;
		selectedDayGigs = [];
		selectedDate = '';
	}

	function openAddGig() {
		showAddGigModal = true;
	}

	function closeAddGig() {
		showAddGigModal = false;
	}

	function gigStatusClass(gig: any): string {
		if (gig.status === 'completed') return 'badge-success';
		if (gig.status === 'dispatched') return 'badge-warning';
		return 'badge-primary';
	}

	function gigDotClass(gig: any): string {
		if (gig.status === 'completed') return 'bg-success';
		if (gig.status === 'dispatched') return 'bg-warning';
		return 'bg-primary';
	}

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr);
		return d.toLocaleDateString('default', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
		<h1 class="text-2xl font-bold">{$t('calendar.title')}</h1>
		<div class="flex gap-2">
			<button class="btn btn-primary btn-sm" onclick={openAddGig}>
				+ {$t('calendar.addGig')}
			</button>
		</div>
	</div>

	<!-- Success/Error alerts -->
	{#if form?.success && form?.remindersSent}
		<div class="alert alert-success text-sm">
			<span>Reminders sent successfully!</span>
		</div>
	{/if}
	{#if form?.error}
		<div class="alert alert-error text-sm">
			<span>{form.error}</span>
		</div>
	{/if}

	<!-- Month Navigation -->
	<div class="flex items-center justify-between bg-base-200 p-3 rounded-lg">
		<button class="btn btn-ghost btn-sm" onclick={prevMonth}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</button>
		<div class="flex items-center gap-3">
			<span class="text-lg font-semibold">{monthLabel}</span>
			<button class="btn btn-ghost btn-xs" onclick={goToToday}>
				{$t('calendar.today')}
			</button>
		</div>
		<button class="btn btn-ghost btn-sm" onclick={nextMonth}>
			<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-4 h-4">
				<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
			</svg>
		</button>
	</div>

	<!-- Calendar Grid -->
	<div class="bg-base-100 border border-base-300 rounded-lg overflow-hidden">
		<!-- Weekday headers -->
		<div class="grid grid-cols-7 bg-base-200">
			{#each weekDays as day}
				<div class="text-center text-xs font-semibold py-2 text-base-content/70">
					{day}
				</div>
			{/each}
		</div>

		<!-- Day cells -->
		<div class="grid grid-cols-7">
			{#each calendarCells() as cell}
				{@const dayGigs = cell.dateStr ? (gigsByDate().get(cell.dateStr) || []) : []}
				{@const isToday = cell.dateStr === todayStr()}
				{@const hasGigs = dayGigs.length > 0}

				{#if cell.day === null}
					<div class="min-h-20 border-t border-r border-base-300 bg-base-200/30"></div>
				{:else}
					<div
						class="min-h-20 border-t border-r border-base-300 p-1 transition-colors {isToday ? 'bg-primary/5' : ''} {hasGigs ? 'cursor-pointer hover:bg-base-200' : ''}"
						onclick={() => { if (hasGigs) openDayDetail(cell.dateStr); }}
						onkeydown={(e) => { if (e.key === 'Enter' && hasGigs) openDayDetail(cell.dateStr); }}
						role={hasGigs ? 'button' : undefined}
						tabindex={hasGigs ? 0 : undefined}
					>
						<div class="flex items-start justify-between">
							<span
								class="text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full"
								class:bg-primary={isToday}
								class:text-primary-content={isToday}
							>
								{cell.day}
							</span>
							{#if dayGigs.length > 1}
								<span class="text-xs opacity-50">{dayGigs.length}</span>
							{/if}
						</div>
						{#if hasGigs}
							<div class="mt-1 space-y-0.5">
								{#each dayGigs.slice(0, 2) as gig}
									<div class="flex items-center gap-1">
										<span class="w-1.5 h-1.5 rounded-full flex-shrink-0 {gigDotClass(gig)}"></span>
										<span class="text-xs truncate">{gig.name}</span>
									</div>
								{/each}
								{#if dayGigs.length > 2}
									<span class="text-xs opacity-50">+{dayGigs.length - 2} more</span>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<!-- Upcoming Gigs with Reminder Buttons -->
	{#if upcomingGigs.length > 0}
		<div class="card bg-base-100 shadow-sm border border-base-300">
			<div class="card-body p-4">
				<h2 class="card-title text-base">{$t('dashboard.upcomingGigs')}</h2>
				<div class="space-y-2 mt-2">
					{#each upcomingGigs as gig (gig.id)}
						<div class="flex items-center justify-between bg-base-200 rounded-lg px-3 py-2">
							<div class="flex items-center gap-3">
								<span class="badge badge-sm {gigStatusClass(gig)}">
									{$t(`dispatch.gigs.${gig.status || 'upcoming'}`)}
								</span>
								<div>
									<span class="font-medium text-sm">{gig.name}</span>
									<span class="text-xs opacity-60 ml-2">
										{new Date(gig.date).toLocaleDateString()}
									</span>
									{#if gig.location}
										<span class="text-xs opacity-50 ml-1">- {gig.location}</span>
									{/if}
								</div>
							</div>
							<form
								method="POST"
								action="?/sendReminders"
								use:enhance={() => {
									sendingReminder = true;
									return async ({ update }) => {
										await update();
										sendingReminder = false;
									};
								}}
							>
								<input type="hidden" name="gigId" value={gig.id} />
								<button
									type="submit"
									class="btn btn-ghost btn-xs"
									disabled={sendingReminder}
								>
									{#if sendingReminder}
										<span class="loading loading-spinner loading-xs"></span>
									{/if}
									Send reminders
								</button>
							</form>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Add Gig Modal -->
{#if showAddGigModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-4">{$t('calendar.addGig')}</h3>
			<form
				method="POST"
				action="?/createGig"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						closeAddGig();
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

				<div class="form-control mb-3">
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

				<div class="form-control mb-4">
					<label class="label" for="gig-notes">
						<span class="label-text">{$t('children.notes')}</span>
					</label>
					<textarea
						id="gig-notes"
						name="notes"
						class="textarea textarea-bordered"
						rows="2"
					></textarea>
				</div>

				<div class="modal-action">
					<button type="button" class="btn" onclick={closeAddGig}>
						{$t('common.cancel')}
					</button>
					<button type="submit" class="btn btn-primary">
						{$t('common.save')}
					</button>
				</div>
			</form>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeAddGig}>close</button>
		</form>
	</dialog>
{/if}

<!-- Gig Detail Modal (day click) -->
{#if showGigDetailModal}
	<dialog class="modal modal-open">
		<div class="modal-box">
			<h3 class="font-bold text-lg mb-1">{formatDate(selectedDate)}</h3>
			<p class="text-sm opacity-60 mb-4">
				{selectedDayGigs.length} gig{selectedDayGigs.length !== 1 ? 's' : ''}
			</p>

			<div class="space-y-3">
				{#each selectedDayGigs as gig (gig.id)}
					<div class="bg-base-200 rounded-lg p-3">
						<div class="flex items-start justify-between">
							<div>
								<span class="font-semibold">{gig.name}</span>
								<span class="badge badge-sm ml-2 {gigStatusClass(gig)}">
									{$t(`dispatch.gigs.${gig.status || 'upcoming'}`)}
								</span>
							</div>
						</div>
						{#if gig.location}
							<p class="text-sm opacity-70 mt-1">{$t('dispatch.gigLocation')}: {gig.location}</p>
						{/if}
						{#if gig.notes}
							<p class="text-sm opacity-60 mt-1">{gig.notes}</p>
						{/if}
						<div class="mt-2">
							<form
								method="POST"
								action="?/sendReminders"
								use:enhance={() => {
									sendingReminder = true;
									return async ({ update }) => {
										await update();
										sendingReminder = false;
									};
								}}
							>
								<input type="hidden" name="gigId" value={gig.id} />
								<button
									type="submit"
									class="btn btn-ghost btn-xs"
									disabled={sendingReminder}
								>
									{#if sendingReminder}
										<span class="loading loading-spinner loading-xs"></span>
									{/if}
									Send reminders
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>

			<div class="modal-action">
				<button class="btn btn-sm" onclick={closeDayDetail}>
					{$t('common.close')}
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button type="button" onclick={closeDayDetail}>close</button>
		</form>
	</dialog>
{/if}
