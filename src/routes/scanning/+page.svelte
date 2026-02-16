<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$app/paths';
	import { browser } from '$app/environment';
	import { t } from '$i18n';
	import { onMount, onDestroy } from 'svelte';

	let { data, form } = $props();

	// Scanning mode: 'qr' or 'nfc'
	let scanMode = $state<'qr' | 'nfc'>('qr');

	// QR Scanner state
	let Html5Qrcode: any;
	let scanner: any = null;
	let qrScanning = $state(false);
	let qrError = $state('');
	let scanResult = $state<string | null>(null);

	// NFC state
	let nfcSupported = $state(false);
	let nfcScanning = $state(false);
	let nfcError = $state('');
	let nfcReader: any = null;

	// Found tag state
	let foundTag = $state<any>(null);
	let tagNotFound = $state(false);

	// Registration form state
	let showRegisterForm = $state(false);
	let registerCode = $state('');
	let registerType = $state<'qr' | 'nfc'>('qr');
	let linkedToType = $state<'bag' | 'clothing_piece'>('bag');

	// Scan log form state
	let showLogForm = $state(false);
	let logAction = $state('inventory_check');
	let logNotes = $state('');

	// Tag list filter
	let tagFilter = $state('');

	const filteredTags = $derived(
		data.tags.filter((tag: any) => {
			if (!tagFilter) return true;
			const search = tagFilter.toLowerCase();
			return (
				tag.code.toLowerCase().includes(search) ||
				tag.type.toLowerCase().includes(search) ||
				tag.linkedToType.toLowerCase().includes(search) ||
				(tag.bag && tag.bag.label.toLowerCase().includes(search)) ||
				(tag.clothingPiece && tag.clothingPiece.type.toLowerCase().includes(search))
			);
		})
	);

	onMount(async () => {
		if (browser) {
			try {
				const mod = await import('html5-qrcode');
				Html5Qrcode = mod.Html5Qrcode;
			} catch (e) {
				qrError = 'Failed to load QR scanner library';
			}

			// Check NFC support
			nfcSupported = 'NDEFReader' in window;
		}
	});

	onDestroy(() => {
		stopQrScanner();
		stopNfc();
	});

	async function startQrScanner() {
		if (!Html5Qrcode) {
			qrError = 'QR scanner library not loaded';
			return;
		}

		try {
			qrError = '';
			scanResult = null;
			foundTag = null;
			tagNotFound = false;

			scanner = new Html5Qrcode('qr-reader');
			await scanner.start(
				{ facingMode: 'environment' },
				{
					fps: 10,
					qrbox: { width: 250, height: 250 }
				},
				(decodedText: string) => {
					handleScanResult(decodedText);
				},
				() => {
					// Ignore scan failures (no QR found in frame)
				}
			);
			qrScanning = true;
		} catch (err: any) {
			qrError = err?.message || $t('scanning.cameraNotAvailable');
		}
	}

	async function stopQrScanner() {
		if (scanner && qrScanning) {
			try {
				await scanner.stop();
			} catch {
				// Ignore stop errors
			}
			qrScanning = false;
		}
	}

	async function startNfc() {
		if (!nfcSupported) return;

		try {
			nfcError = '';
			scanResult = null;
			foundTag = null;
			tagNotFound = false;

			nfcReader = new (window as any).NDEFReader();
			await nfcReader.scan();
			nfcScanning = true;

			nfcReader.addEventListener('reading', ({ serialNumber }: any) => {
				if (serialNumber) {
					handleScanResult(serialNumber);
				}
			});

			nfcReader.addEventListener('readingerror', () => {
				nfcError = 'Error reading NFC tag. Try again.';
			});
		} catch (err: any) {
			nfcError = err?.message || 'Failed to start NFC reader';
			nfcScanning = false;
		}
	}

	function stopNfc() {
		nfcScanning = false;
		nfcReader = null;
	}

	function handleScanResult(code: string) {
		scanResult = code;
		// Look up the code in loaded tags
		const tag = data.tags.find((t: any) => t.code === code);
		if (tag) {
			foundTag = tag;
			tagNotFound = false;
			showRegisterForm = false;
			showLogForm = true;
		} else {
			foundTag = null;
			tagNotFound = true;
			registerCode = code;
			registerType = scanMode;
			showRegisterForm = true;
			showLogForm = false;
		}

		// Stop scanning after successful read
		if (scanMode === 'qr') {
			stopQrScanner();
		}
	}

	function resetScan() {
		scanResult = null;
		foundTag = null;
		tagNotFound = false;
		showRegisterForm = false;
		showLogForm = false;
		logAction = 'inventory_check';
		logNotes = '';
	}

	function getLinkedItemLabel(tag: any): string {
		if (tag.linkedToType === 'bag' && tag.bag) {
			return `${tag.bag.label} (${tag.bag.type})`;
		}
		if (tag.linkedToType === 'clothing_piece' && tag.clothingPiece) {
			return `${tag.clothingPiece.type} - ${tag.clothingPiece.size} ${tag.clothingPiece.color}`;
		}
		return 'Unknown';
	}
</script>

<div class="max-w-4xl mx-auto space-y-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold">{$t('scanning.title')}</h1>
	</div>

	{#if form?.error}
		<div class="alert alert-error">
			<span>{form.error}</span>
		</div>
	{/if}

	{#if form?.success}
		<div class="alert alert-success">
			<span>{form.scanLogged ? 'Scan logged successfully' : 'Tag registered successfully'}</span>
		</div>
	{/if}

	<!-- Scan Mode Tabs -->
	<div class="tabs tabs-boxed">
		<button
			class="tab"
			class:tab-active={scanMode === 'qr'}
			onclick={() => { scanMode = 'qr'; resetScan(); stopNfc(); }}
		>
			{$t('scanning.scanQR')}
		</button>
		<button
			class="tab"
			class:tab-active={scanMode === 'nfc'}
			onclick={() => { scanMode = 'nfc'; resetScan(); stopQrScanner(); }}
		>
			{$t('scanning.scanNFC')}
		</button>
	</div>

	<!-- QR Scanner -->
	{#if scanMode === 'qr'}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">{$t('scanning.scanQR')}</h2>

				<div id="qr-reader" class="w-full max-w-md mx-auto rounded-lg overflow-hidden"></div>

				{#if qrError}
					<div class="alert alert-warning mt-2">
						<span>{qrError}</span>
					</div>
				{/if}

				<div class="card-actions justify-center mt-4">
					{#if !qrScanning}
						<button class="btn btn-primary" onclick={startQrScanner}>
							{$t('scanning.startCamera')}
						</button>
					{:else}
						<button class="btn btn-secondary" onclick={stopQrScanner}>
							{$t('scanning.stopCamera')}
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- NFC Scanner -->
	{#if scanMode === 'nfc'}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">{$t('scanning.scanNFC')}</h2>

				{#if !nfcSupported}
					<div class="alert alert-warning">
						<span>{$t('scanning.nfcNotSupported')}</span>
					</div>
				{:else if nfcScanning}
					<div class="flex flex-col items-center gap-4 py-8">
						<span class="loading loading-spinner loading-lg text-primary"></span>
						<p class="text-lg">{$t('scanning.waitingForNFC')}</p>
					</div>

					<div class="card-actions justify-center">
						<button class="btn btn-secondary" onclick={stopNfc}>
							{$t('scanning.stopCamera')}
						</button>
					</div>
				{:else}
					<div class="card-actions justify-center">
						<button class="btn btn-primary" onclick={startNfc}>
							{$t('scanning.scanNFC')}
						</button>
					</div>
				{/if}

				{#if nfcError}
					<div class="alert alert-warning mt-2">
						<span>{nfcError}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Scan Result -->
	{#if scanResult}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				{#if foundTag}
					<div class="alert alert-success mb-4">
						<span>{$t('scanning.tagFound')}</span>
					</div>

					<div class="grid grid-cols-2 gap-2 text-sm">
						<div class="font-semibold">{$t('scanning.tagType')}:</div>
						<div>
							<span class="badge badge-outline">{foundTag.type.toUpperCase()}</span>
						</div>
						<div class="font-semibold">{$t('scanning.tagCode')}:</div>
						<div><code class="bg-base-200 px-2 py-0.5 rounded">{foundTag.code}</code></div>
						<div class="font-semibold">{$t('scanning.linkTo')}:</div>
						<div>{getLinkedItemLabel(foundTag)}</div>
					</div>

					<!-- Scan Log Form -->
					{#if showLogForm}
						<div class="divider"></div>
						<h3 class="font-semibold">Log Scan Event</h3>
						<form method="POST" action="{base}/scanning?/logScan" use:enhance class="space-y-3">
							<input type="hidden" name="tagId" value={foundTag.id} />

							<div class="form-control">
								<label class="label" for="logAction">
									<span class="label-text">Action</span>
								</label>
								<select
									id="logAction"
									name="action"
									class="select select-bordered w-full"
									bind:value={logAction}
								>
									<option value="inventory_check">Inventory Check</option>
									<option value="dispatch">Dispatch</option>
									<option value="receive">Receive</option>
								</select>
							</div>

							<div class="form-control">
								<label class="label" for="logNotes">
									<span class="label-text">Notes</span>
								</label>
								<textarea
									id="logNotes"
									name="notes"
									class="textarea textarea-bordered"
									bind:value={logNotes}
									rows="2"
								></textarea>
							</div>

							<button type="submit" class="btn btn-primary btn-sm">Log Scan</button>
						</form>
					{/if}
				{:else if tagNotFound}
					<div class="alert alert-warning mb-4">
						<span>{$t('scanning.tagNotRegistered')}</span>
					</div>
					<p class="text-sm">
						{$t('scanning.tagCode')}: <code class="bg-base-200 px-2 py-0.5 rounded">{scanResult}</code>
					</p>
					<div class="mt-2">
						<button class="btn btn-primary btn-sm" onclick={() => { showRegisterForm = true; }}>
							{$t('scanning.registerTag')}
						</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Tag Registration Form -->
	{#if showRegisterForm}
		<div class="card bg-base-100 shadow">
			<div class="card-body">
				<h2 class="card-title">{$t('scanning.registerTag')}</h2>

				<form method="POST" action="{base}/scanning?/registerTag" use:enhance class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div class="form-control">
							<label class="label" for="tagType">
								<span class="label-text">{$t('scanning.tagType')}</span>
							</label>
							<select
								id="tagType"
								name="type"
								class="select select-bordered w-full"
								bind:value={registerType}
							>
								<option value="qr">QR</option>
								<option value="nfc">NFC</option>
							</select>
						</div>

						<div class="form-control">
							<label class="label" for="tagCode">
								<span class="label-text">{$t('scanning.tagCode')}</span>
							</label>
							<input
								id="tagCode"
								name="code"
								type="text"
								class="input input-bordered w-full"
								bind:value={registerCode}
								required
							/>
						</div>
					</div>

					<div class="form-control">
						<label class="label" for="linkedToType">
							<span class="label-text">{$t('scanning.linkTo')}</span>
						</label>
						<select
							id="linkedToType"
							name="linkedToType"
							class="select select-bordered w-full"
							bind:value={linkedToType}
						>
							<option value="bag">Bag</option>
							<option value="clothing_piece">Clothing Piece</option>
						</select>
					</div>

					{#if linkedToType === 'bag'}
						<div class="form-control">
							<label class="label" for="linkedToBagId">
								<span class="label-text">Select Bag</span>
							</label>
							<select
								id="linkedToBagId"
								name="linkedToBagId"
								class="select select-bordered w-full"
								required
							>
								<option value="">-- Select --</option>
								{#each data.bags as bag}
									<option value={bag.id}>{bag.label} ({bag.type})</option>
								{/each}
							</select>
						</div>
					{:else}
						<div class="form-control">
							<label class="label" for="linkedToPieceId">
								<span class="label-text">Select Clothing Piece</span>
							</label>
							<select
								id="linkedToPieceId"
								name="linkedToPieceId"
								class="select select-bordered w-full"
								required
							>
								<option value="">-- Select --</option>
								{#each data.clothingPieces as piece}
									<option value={piece.id}>{piece.type} - {piece.size} {piece.color}</option>
								{/each}
							</select>
						</div>
					{/if}

					<div class="flex gap-2">
						<button type="submit" class="btn btn-primary">{$t('scanning.registerTag')}</button>
						<button
							type="button"
							class="btn btn-ghost"
							onclick={() => { showRegisterForm = false; }}
						>
							Cancel
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- Registered Tags List -->
	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<div class="flex items-center justify-between mb-4">
				<h2 class="card-title">Registered Tags</h2>
				<button
					class="btn btn-primary btn-sm"
					onclick={() => { showRegisterForm = true; registerCode = ''; resetScan(); }}
				>
					{$t('scanning.registerTag')}
				</button>
			</div>

			<div class="form-control mb-4">
				<input
					type="text"
					placeholder="Filter tags..."
					class="input input-bordered input-sm w-full max-w-xs"
					bind:value={tagFilter}
				/>
			</div>

			{#if filteredTags.length === 0}
				<p class="text-center text-base-content/60 py-4">No tags found</p>
			{:else}
				<div class="overflow-x-auto">
					<table class="table table-sm">
						<thead>
							<tr>
								<th>{$t('scanning.tagType')}</th>
								<th>{$t('scanning.tagCode')}</th>
								<th>{$t('scanning.linkTo')}</th>
								<th>Linked Item</th>
								<th></th>
							</tr>
						</thead>
						<tbody>
							{#each filteredTags as tag}
								<tr>
									<td>
										<span class="badge badge-sm" class:badge-primary={tag.type === 'qr'} class:badge-secondary={tag.type === 'nfc'}>
											{tag.type.toUpperCase()}
										</span>
									</td>
									<td>
										<code class="bg-base-200 px-1.5 py-0.5 rounded text-xs">{tag.code}</code>
									</td>
									<td>{tag.linkedToType === 'bag' ? 'Bag' : 'Clothing'}</td>
									<td>{getLinkedItemLabel(tag)}</td>
									<td>
										<form method="POST" action="{base}/scanning?/deleteTag" use:enhance>
											<input type="hidden" name="id" value={tag.id} />
											<button type="submit" class="btn btn-ghost btn-xs text-error">
												Delete
											</button>
										</form>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	</div>
</div>
