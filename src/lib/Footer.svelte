<script lang="ts">
  import { Footer, FooterBrand, FooterLinkGroup, FooterLink } from "flowbite-svelte";
</script>

<Footer footerType="socialmedia" class="bg-secondary-100 dark:bg-secondary-900">
  <div class="mx-auto max-w-screen-xl text-center">
    <FooterBrand href="/" src="/images/logo.svg" alt="Maragha" name="Maragha Project" aClass="flex justify-center items-center text-2xl font-semibold text-gray-900 dark:text-white" />
    <p class="my-6 text-gray-500 dark:text-gray-400">Open-source library of over 400+ web components and interactive elements built for better web.</p>
    <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">
      © 2025 <a href="/" class="hover:underline">Maragha Project</a>
      . All Rights Reserved.
    </span>
  </div>
</Footer>