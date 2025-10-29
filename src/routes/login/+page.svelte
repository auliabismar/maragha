<script lang="ts">
	import { goto } from '$app/navigation';
	import pb from '$lib/pocketbase';

	let email = $state<string>('');
	let password = $state<string>('');
	let error = $state<string | null>(null);
	let loading = $state<boolean>(false);

	async function handleLogin() {
		loading = true;
		error = null;
		try {
			await pb.collection('users').authWithPassword(email, password);
			// Redirect to dashboard or home page on successful login
			goto('/dashboard');
		} catch (err: any) {
			error = err.message || 'An unknown error occurred during login.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Maragha - Masuk</title>
	<meta name="description" content="Masuk ke akun Maragha Anda" />
</svelte:head>

<div class="flex items-center justify-center min-h-screen">
	<div class="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg">
		<h2 class="text-3xl font-heading font-bold text-center text-foreground">Masuk</h2>
		<form onsubmit={(e) => { e.preventDefault(); handleLogin(); }} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-muted-foreground">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					required
					class="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-muted-foreground">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					required
					class="mt-1 block w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
				/>
			</div>

			{#if error}
				<p class="text-sm text-red-500">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
			>
				{#if loading}
					Memuat...
				{:else}
					Masuk
				{/if}
			</button>
		</form>
		<p class="text-center text-sm text-muted-foreground">
			Belum punya akun? <a href="/register" class="font-medium text-primary hover:text-accent">Daftar</a>
		</p>
	</div>
</div>