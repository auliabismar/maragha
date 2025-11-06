<script lang="ts">
	import pb from '$lib/pocketbase';
  import { goto } from '$app/navigation';

  let loading = $state(false);
  let error = $state<string | null>(null);
  // Function to initiate Google OAuth2 login
  async function handleGithubLogin() {
    loading = true;
    error = null;
    try {
      // Use PocketBase's built-in OAuth2 method to handle the authentication flow
      await pb.collection('users').authWithOAuth2({
        provider: 'github',
        createData: {
          akses: 'Pembaca'
        }
      });
      goto('/');
    } catch (err: any) {
      error = err.message || 'An error occurred during authentication.';
      console.error('OAuth2 error:', err);
    } finally {
      loading = false;
    }
	}
</script>

<button
	onclick={handleGithubLogin}
	class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
>
	Masuk dengan GitHub
</button>