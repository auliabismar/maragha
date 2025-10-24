// src/lib/auth.ts
import { currentUser } from '$lib/pocketbase';
import { get } from 'svelte/store';

export const roles = {
  TAMU: 'Tamu',
  EDITOR: 'Editor',
  PENERJEMAH: 'Penerjemah'
} as const;

export type Role = typeof roles[keyof typeof roles];

// Resource types in meja_kerja
export const resources = {
  BUKU: 'buku',
  HALAMAN: 'halaman',
  KATEGORI: 'kategori',
  PENULIS: 'penulis',
  PENERBIT: 'penerbit'
} as const;

export type Resource = typeof resources[keyof typeof resources];

// Permission types
export type Permission = 'view' | 'create' | 'edit' | 'delete';

/**
 * Check if user can access profile section
 */
export function canAccessProfile(): boolean {
  const user = get(currentUser);
  return user !== null;
}

/**
 * Check if user can access meja_kerja section
 */
export function canAccessMejaKerja(): boolean {
  const user = get(currentUser);
  return user?.role === roles.EDITOR || user?.role === roles.PENERJEMAH;
}

/**
 * Check if user has specific role(s)
 */
export function hasRole(allowedRoles: Role[]): boolean {
  const user = get(currentUser);
  return user !== null && allowedRoles.includes(user.role as Role);
}

/**
 * Check if user can perform action on a resource
 * 
 * Permission Matrix:
 * - Editor: Full access (view, create, edit, delete) to all resources
 * - Penerjemah: Can only view and edit /halaman, view other resources
 * - Tamu: No access to meja_kerja
 */
export function canAccess(
  resource: Resource,
  permission: Permission = 'view'
): boolean {
  const user = get(currentUser);
  
  if (!user) return false;

  const userRole = user.role as Role;

  // Tamu has no access to meja_kerja
  if (userRole === roles.TAMU) {
    return false;
  }

  // Editor has full access to everything
  if (userRole === roles.EDITOR) {
    return true;
  }

  // Penerjemah specific rules
  if (userRole === roles.PENERJEMAH) {
    // Can view all resources in meja_kerja
    if (permission === 'view') {
      return true;
    }

    // Can only edit halaman (pages)
    if (permission === 'edit' && resource === resources.HALAMAN) {
      return true;
    }

    // Cannot create or delete anything
    // Cannot edit other resources
    return false;
  }

  return false;
}

/**
 * Get accessible resources for current user with their permissions
 */
export function getAccessibleResources(): Record<Resource, Permission[]> {
  const user = get(currentUser);
  
  if (!user) {
    return {
      buku: [],
      halaman: [],
      kategori: [],
      penulis: [],
      penerbit: []
    };
  }

  const userRole = user.role as Role;

  if (userRole === roles.EDITOR) {
    // Editor has all permissions on all resources
    return {
      buku: ['view', 'create', 'edit', 'delete'],
      halaman: ['view', 'create', 'edit', 'delete'],
      kategori: ['view', 'create', 'edit', 'delete'],
      penulis: ['view', 'create', 'edit', 'delete'],
      penerbit: ['view', 'create', 'edit', 'delete']
    };
  }

  if (userRole === roles.PENERJEMAH) {
    // Penerjemah can only view all and edit halaman
    return {
      buku: ['view'],
      halaman: ['view', 'edit'],
      kategori: ['view'],
      penulis: ['view'],
      penerbit: ['view']
    };
  }

  // Tamu has no access
  return {
    buku: [],
    halaman: [],
    kategori: [],
    penulis: [],
    penerbit: []
  };
}

/**
 * Check if user can view a resource
 */
export function canView(resource: Resource): boolean {
  return canAccess(resource, 'view');
}

/**
 * Check if user can create a resource
 */
export function canCreate(resource: Resource): boolean {
  return canAccess(resource, 'create');
}

/**
 * Check if user can edit a resource
 */
export function canEdit(resource: Resource): boolean {
  return canAccess(resource, 'edit');
}

/**
 * Check if user can delete a resource
 */
export function canDelete(resource: Resource): boolean {
  return canAccess(resource, 'delete');
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role?: string): string {
  switch (role) {
    case roles.EDITOR:
      return 'Editor';
    case roles.PENERJEMAH:
      return 'Penerjemah';
    case roles.TAMU:
      return 'Tamu';
    default:
      return 'Unknown';
  }
}

/**
 * Check if current user is an editor
 */
export function isEditor(): boolean {
  return hasRole([roles.EDITOR]);
}

/**
 * Check if current user is a penerjemah
 */
export function isPenerjemah(): boolean {
  return hasRole([roles.PENERJEMAH]);
}

/**
 * Check if current user is a tamu
 */
export function isTamu(): boolean {
  return hasRole([roles.TAMU]);
}