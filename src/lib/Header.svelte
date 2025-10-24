<script lang="ts">
  import {
    Navbar,
    NavBrand,
    NavHamburger,
    NavUl,
    NavLi,
    Button,
    Avatar,
    Dropdown,
    DropdownItem,
    DropdownHeader,
    DropdownDivider
  } from "flowbite-svelte";
  import { UserGraduateOutline } from "flowbite-svelte-icons";
  import { currentUser, pb } from "$lib/pocketbase";
  import { navigate } from "sv-router/generated";

  function logout() {
    pb.authStore.clear();
    navigate('/');
  }

  function getAvatarUrl() {
    if ($currentUser && $currentUser.avatar) {
      console.log(pb.files.getUrl($currentUser, $currentUser.avatar))
      return pb.files.getUrl($currentUser, $currentUser.avatar);
    }
    return null;
  }
</script>
<header class="bg-secondary-100 dark:bg-secondary-900">
  <Navbar>
    <NavBrand href="/">
      <img src="/images/logo.svg" class="mr-3 h-6 sm:h-9" alt="Flowbite Logo" />
      <span class="self-center text-xl font-bold whitespace-nowrap dark:text-white">Maragha Project</span>
    </NavBrand>
    <div class="flex items-center lg:order-2">
      {#if $currentUser}
        {#if $currentUser.avatar}
          <Avatar src={getAvatarUrl()} id="user-drop" />
        {:else}
          <Avatar id="user-drop" class="text-primary-900 bg-primary-100 dark:bg-primary-800 dark:text-primary-100">
            <UserGraduateOutline color="stroke-secondary-900"/>
          </Avatar>
        {/if}
        <Dropdown triggeredBy="#user-drop">
          <DropdownHeader>
            <span class="block text-sm">{$currentUser.name || 'User'}</span>
            <span class="block truncate text-sm font-medium">{$currentUser.email}</span>
          </DropdownHeader>
          <DropdownItem>Dashboard</DropdownItem>
          <DropdownItem>Settings</DropdownItem>
          <DropdownDivider />
          <DropdownItem onclick={logout}>Sign out</DropdownItem>
        </Dropdown>
      {:else}
        <Button href="/auth/login" color="secondary">Log in</Button>
      {/if}
      <NavHamburger />
    </div>
    <NavUl>
      <NavLi href="/">Home</NavLi>
      <NavLi href="/">Company</NavLi>
      <NavLi href="/">Marketplace</NavLi>
      <NavLi href="/">Features</NavLi>
      <NavLi href="/">Team</NavLi>
      <NavLi href="/">Contact</NavLi>
    </NavUl>
  </Navbar>
</header>