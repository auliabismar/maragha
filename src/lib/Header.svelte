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
    DropdownDivider,
    Tooltip,
    Hr,
    P
  } from "flowbite-svelte";
  import { UserGraduateOutline } from "flowbite-svelte-icons";
  import { currentUser, pb } from "$lib/pocketbase";
  import { navigate } from "sv-router/generated";
  import { canAccessMejaKerja } from '$lib/auth';

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
  function getRoleClasses(role: string) {
    switch (role) {
      case 'Editor':
        return 'bg-purple-600 text-purple-400';
      case 'Penerjemah':
        return 'bg-blue-600 text-blue-400';
      case 'Tamu':
        return 'bg-gray-600 text-gray-400';
      default:
        return 'bg-stone-600 text-stone-400';
    }
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
        <Avatar border src={getAvatarUrl()} id="user-drop" class="{getRoleClasses($currentUser?.role)}"/>
        {:else}
        <Avatar border id="user-drop" class="{getRoleClasses($currentUser?.role)} text-primary-900 bg-primary-100 dark:bg-primary-800 dark:text-primary-100">
          <UserGraduateOutline color="stroke-secondary-900"/>
        </Avatar>
        {/if}
        <Tooltip>
          <P align='center' class='text-gray-100'>{$currentUser?.name}</P>
          <Hr class="m-1 h-px w-48 rounded-sm" />
          <P align='center' class='text-gray-100'>{$currentUser?.email}</P>
        </Tooltip>
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
  </Navbar>
</header>