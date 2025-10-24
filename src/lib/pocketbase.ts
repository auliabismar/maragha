import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';

// Create a single instance of PocketBase
// The URL is exposed via a public environment variable
export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL);

// Create a writable store for the current user
export const currentUser = writable(pb.authStore.model);

// Update the store when the auth state changes
pb.authStore.onChange(() => {
  currentUser.set(pb.authStore.model);
});