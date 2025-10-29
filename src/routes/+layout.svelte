<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import pb from '$lib/pocketbase';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let { children } = $props();
	let user = $state<any | null>(null);
	let avatarUrl = $state<string | null>(null);
	let userInitials = $state<string | null>(null);

	onMount(() => {
		updateUser();
		pb.authStore.onChange(updateUser);
	});

	function updateUser() {
		if (pb.authStore.isValid) {
			user = pb.authStore.model;
			if (user?.avatar) {
				avatarUrl = pb.files.getUrl(user, user.avatar);
			} else {
				avatarUrl = null;
				const name = user?.name || user?.email;
				if (name) {
					userInitials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
				} else {
					userInitials = null;
				}
			}
		} else {
			user = null;
			avatarUrl = null;
			userInitials = null;
		}
	}

	async function handleLogout() {
		pb.authStore.clear();
		goto('/login');
	}

	function goToProfile() {
		if (user) {
			goto('/profile');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href="/src/lib/assets/logo.svg" />
</svelte:head>

<div class="min-h-screen bg-background">
	<!-- Header -->
	<header class="bg-primary text-primary-foreground shadow-lg">
		<div class="container mx-auto px-6 py-4">
			<div class="flex items-center justify-between">
				<a href="/" class="flex items-center space-x-2">
					<img src="/src/lib/assets/logo.svg" alt="Maragha Logo" class="h-8 w-8" />
					<h1 class="text-3xl font-heading font-bold">Maragha</h1>
				</a>
				<nav class="hidden md:flex space-x-6 items-center">
					<a href="/" class="hover:text-accent transition-colors">Beranda</a>
					<a href="/dashboard" class="hover:text-accent transition-colors">Dashboard</a>
					{#if user && (user.akses === 'Editor' || user.akses === 'Penerjemah')}
						<a href="/penugasan" class="hover:text-accent transition-colors">Penugasan</a>
					{/if}
					{#if user}
						<button onclick={goToProfile} class="flex items-center space-x-2 hover:text-accent transition-colors">
							{#if avatarUrl}
								<img src={avatarUrl} alt="Avatar" class="w-8 h-8 rounded-full object-cover" />
							{:else if userInitials}
								<div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-primary-foreground font-bold">
									{userInitials}
								</div>
							{/if}
						</button>
						<button onclick={handleLogout} class="hover:text-accent transition-colors">Keluar</button>
					{:else}
						<a href="/login" class="hover:text-accent transition-colors">Masuk</a>
					{/if}
				</nav>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main class="container mx-auto px-6 py-8">
		{@render children?.()}
	</main>

	<!-- Footer -->
	<footer class="bg-primary text-primary-foreground py-8 mt-16">
		<div class="container mx-auto px-6 text-center">
			<p>&copy; 2025 Maragha. Made with ❤️ by <a href="https://almagazi.id">al-Magazi</a>.</p>
		</div>
	</footer>
</div>
