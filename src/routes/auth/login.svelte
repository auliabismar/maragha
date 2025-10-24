<script lang="ts">
  import { pb } from '$lib/pocketbase';
  import { Button, Checkbox, Label, Input, Alert } from 'flowbite-svelte';
  import { navigate } from 'sv-router/generated';

  let email = '';
  let password = '';
  let error = '';

  async function login(event: Event) {
    event.preventDefault();
    try {
      await pb.collection('users').authWithPassword(email, password);
      navigate('/app');
    } catch (err) {
      error = 'Invalid email or password.';
      console.error(err);
    }
  }
</script>

<section class="bg-secondary-50 dark:bg-secondary-900">
  <div class="flex flex-col items-center justify-center px-6 py-8 mx-auto h-screen lg:py-0">
    <a href="/" class="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
      <img class="w-8 h-8 mr-2" src="/images/logo.svg" alt="logo" />
      Maragha
    </a>
    <div class="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-secondary-800 dark:border-secondary-700">
      <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Sign in to your account
        </h1>
        {#if error}
          <Alert color="red">{error}</Alert>
        {/if}
        <form class="space-y-4 md:space-y-6" onsubmit={login}>
          <div>
            <Label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</Label>
            <Input type="email" name="email" id="email" bind:value={email} placeholder="name@company.com" required />
          </div>
          <div>
            <Label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</Label>
            <Input type="password" name="password" id="password" bind:value={password} placeholder="••••••••" required />
          </div>
          <div class="flex items-center justify-between">
            <div class="flex items-start">
              <div class="flex items-center h-5">
                <Checkbox name="remember" id="remember">Remember me</Checkbox>
              </div>
              <div class="ml-3 text-sm">
                <Label for="remember" class="text-gray-500 dark:text-gray-300">Remember me</Label>
              </div>
            </div>
            <a href="/auth/reset" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
          </div>
          <Button type="submit" class="w-full">Sign in</Button>
          <p class="text-sm font-light text-gray-500 dark:text-gray-400">
            Don’t have an account yet? <a href="/auth/register" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</a>
          </p>
        </form>
      </div>
    </div>
  </div>
</section>