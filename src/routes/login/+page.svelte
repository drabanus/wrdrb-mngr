<script lang="ts">
	import { enhance } from '$app/forms';
	import { base } from '$app/paths';

	let { form } = $props();
</script>

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
	<div class="card w-full max-w-sm bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="text-center mb-4">
				<h1 class="text-3xl font-bold">Garderobe</h1>
				<p class="text-sm opacity-60 mt-1">Wardrobe Management System</p>
			</div>

			{#if form?.error}
				<div class="alert alert-error text-sm">
					<span>{form.error}</span>
				</div>
			{/if}

			<form method="POST" action="{base}/login" use:enhance>
				<div class="form-control mb-3">
					<label class="label" for="username">
						<span class="label-text">Username</span>
					</label>
					<input
						id="username"
						name="username"
						type="text"
						placeholder="Enter your username"
						class="input input-bordered w-full"
						required
						autocomplete="username"
					/>
				</div>

				<div class="form-control mb-6">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						name="password"
						type="password"
						placeholder="Enter your password"
						class="input input-bordered w-full"
						required
						autocomplete="current-password"
					/>
				</div>

				<button type="submit" class="btn btn-primary btn-block">
					Sign In
				</button>
			</form>
		</div>
	</div>
</div>
