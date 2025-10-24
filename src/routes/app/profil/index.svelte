<script lang="ts">
  import { currentUser, pb } from '$lib/pocketbase';
  import { Card, Avatar, Badge, Button, Label, Input } from 'flowbite-svelte';
  import { UserGraduateOutline, EditOutline } from 'flowbite-svelte-icons';
  import { getRoleDisplayName, getAccessibleResources } from '$lib/auth';

  let isEditing = $state(false);
  let name = $state($currentUser?.name || '');
  let email = $state($currentUser?.email || '');

  function getAvatarUrl() {
    if ($currentUser && $currentUser.avatar) {
      return pb.files.getUrl($currentUser, $currentUser.avatar);
    }
    return null;
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case 'Editor':
        return 'purple';
      case 'Penerjemah':
        return 'blue';
      case 'Tamu':
        return 'gray';
      default:
        return 'dark';
    }
  }

  function toggleEdit() {
    isEditing = !isEditing;
    if (isEditing) {
      name = $currentUser?.name || '';
      email = $currentUser?.email || '';
    }
  }

  async function saveProfile() {
    try {
      // Update profile logic here
      // await pb.collection('users').update($currentUser.id, { name, email });
      isEditing = false;
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  }

  // Get accessible resources for display
  const accessibleResources = getAccessibleResources();

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

<div class="max-w-4xl mx-auto py-8">
  <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
    Profil Saya
  </h1>

  <div class="grid grid-cols-1 justify-center md:grid-cols-3 gap-6">
    <!-- Profile Card -->
    <div class="col-span-2 md:col-span-1">
      <Card>
        <div class="flex flex-col items-center m-2 pb-4 bg-primary-50 dark:bg-primary-900">
          {#if $currentUser?.avatar}
            <Avatar border src={getAvatarUrl()} size="lg" class="mb-4 {getRoleClasses($currentUser?.role )}" />
          {:else}
            <Avatar border size="lg" class="mb-4 {getRoleClasses($currentUser?.role)} text-primary-900 bg-primary-100 dark:bg-primary-800 dark:text-primary-100">
              <UserGraduateOutline size="xl" />
            </Avatar>
          {/if}
          
          <h5 class="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {$currentUser?.name || 'User'}
          </h5>
          
          <span class="text-sm text-gray-500 dark:text-gray-400 mb-3">
            {$currentUser?.email}
          </span>
          
          <Badge color={getRoleBadgeColor($currentUser?.role)} class="mb-4">
            {getRoleDisplayName($currentUser?.role)}
          </Badge>
          
          <Button on:click={toggleEdit} color="light" class="w-full">
            <EditOutline class="w-4 h-4 mr-2" />
            {isEditing ? 'Batal' : 'Edit Profil'}
          </Button>
        </div>
      </Card>
    </div>

    <!-- Details Card -->
    <div class="md:col-span-2">
      <Card class="p-6 bg-primary-50 dark:bg-primary-900">
        <h5 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Informasi Akun
        </h5>
        
        {#if isEditing}
          <form on:submit|preventDefault={saveProfile} class="space-y-4">
            <div>
              <Label for="name" class="mb-2">Nama Lengkap</Label>
              <Input id="name" type="text" bind:value={name} required />
            </div>
            
            <div>
              <Label for="email" class="mb-2">Email</Label>
              <Input id="email" type="email" bind:value={email} required disabled />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email tidak dapat diubah
              </p>
            </div>
            
            <div class="flex gap-2">
              <Button type="submit" color="primary">Simpan</Button>
              <Button type="button" color="light" on:click={toggleEdit}>Batal</Button>
            </div>
          </form>
        {:else}
          <div class="space-y-4">
            <div>
              <Label class="mb-2">Nama Lengkap</Label>
              <p class="text-gray-900 dark:text-white">{$currentUser?.name || '-'}</p>
            </div>
            
            <div>
              <Label class="mb-2">Email</Label>
              <p class="text-gray-900 dark:text-white">{$currentUser?.email || '-'}</p>
            </div>
            
            <div>
              <Label class="mb-2">Role</Label>
              <p class="text-gray-900 dark:text-white">{getRoleDisplayName($currentUser?.role)}</p>
            </div>
            
            <div>
              <Label class="mb-2">Tanggal Bergabung</Label>
              <p class="text-gray-900 dark:text-white">
                {new Date($currentUser?.created).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        {/if}
      </Card>

      <!-- Permissions Card -->
      <Card class="mt-6 p-6 bg-primary-50 dark:bg-primary-900">
        <h5 class="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Hak Akses Anda
        </h5>
        
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Berikut adalah daftar resource yang dapat Anda akses dan kelola:
        </p>
        
        <div class="space-y-3">
          {#each Object.entries(accessibleResources) as [resource, permissions]}
            {#if permissions.length > 0}
              <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex-1">
                  <p class="font-medium text-gray-900 dark:text-white capitalize">
                    {resource}
                  </p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    {#each permissions as permission}
                      <Badge color="blue" class="text-xs">
                        {permission === 'view' ? 'Lihat' : 
                         permission === 'create' ? 'Buat' :
                         permission === 'edit' ? 'Edit' : 'Hapus'}
                      </Badge>
                    {/each}
                  </div>
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </Card>
    </div>
  </div>
</div>