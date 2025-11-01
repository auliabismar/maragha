<script lang="ts">
	// Function to initiate Google OAuth2 login
	async function signInWithGoogle() {
		// Get the current page URL to redirect back after login
		const currentPage = window.location.pathname;
		// Encode the current page for the state parameter
		const state = encodeURIComponent(currentPage);

		// Get the client ID from environment variables
		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

		// Get the callback URL - this will be the URL that Google redirects to after authentication
		const callbackUrl = `https://pbmaragha.almagazi.id/api/oauth2-redirect`;

		// Define the scopes for the OAuth2 request
		const scope = encodeURIComponent('openid email profile');

		// Construct the OAuth2 URL for Google
		const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=${scope}&state=${state}`;

		// Redirect to Google OAuth2
		window.location.href = authUrl;
	}
</script>

<!-- Google Sign-In Button -->
<button
	type="button"
	on:click={signInWithGoogle}
	class="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
	aria-label="Sign in with Google"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 48 48"
		class="w-5 h-5 mr-2"
		aria-hidden="true"
		role="img"
	>
		<path
			fill="#EA4335"
			d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
		></path>
		<path
			fill="#4285F4"
			d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
		></path>
		<path
			fill="#FBBC05"
			d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
		></path>
		<path
			fill="#34A853"
			d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
		></path>
		<path fill="none" d="M0 0h48v48H0z"></path>
	</svg>
	Masuk dengan Google
</button>