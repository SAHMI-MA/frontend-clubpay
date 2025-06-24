import { api } from './api';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
  description?: string;
  profilePicture?: string;
  isActive?: boolean;
  lastLogin?: string;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  userCount?: number;
}

export interface Permission {
  id: number;
  name: string;
  page: string;
  description?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  description?: string;
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  description?: string;
  isActive?: boolean;
  isAdmin?: boolean;
}

export interface CreateRoleDto {
  name: string;
  description?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface CreatePermissionDto {
  name: string;
  page: string;
}

export interface UpdatePermissionDto {
  name?: string;
  page?: string;
}

export interface UserHistory {
  id: number;
  dateTime: string;
  description: string;
  sessionTime?: string;
  ipAddress?: string;
  user?: {
    id: number;
    email: string;
  };
}

/**
 * User API service
 */
export const userService = {
  /**
   * Get all users
   * @returns List of users
   */
  getAllUsers(): Promise<User[]> {
    return api.get<User[]>('users');
  },

  /**
   * Get user by ID
   * @param id - User ID
   * @returns User details
   */
  getUserById(id: number): Promise<User> {
    return api.get<User>(`users/${id}`);
  },

  /**
   * Create a new user (admin only)
   * @param userData - User data
   * @returns Created user
   */
  createUser(userData: CreateUserDto): Promise<User> {
    return api.post<User>('users', userData);
  },

  /**
   * Update a user
   * @param id - User ID
   * @param userData - Updated user data
   * @returns Updated user
   */
  updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    return api.patch<User>(`users/${id}`, userData);
  },

  /**
   * Delete a user (admin only)
   * @param id - User ID
   */
  deleteUser(id: number): Promise<void> {
    return api.delete<void>(`users/${id}`);
  },

  /**
   * Assign a role to a user
   * @param userId - User ID
   * @param roleId - Role ID
   * @returns Updated user
   */
  assignRoleToUser(userId: number, roleId: number): Promise<User> {
    return api.post<User>(`users/${userId}/roles/${roleId}`, {});
  },
  /**
   * Remove a role from a user
   * @param userId - User ID
   * @param roleId - Role ID
   * @returns Updated user
   */
  removeRoleFromUser(userId: number, roleId: number): Promise<User> {
    // Ensure correct endpoint format for DELETE request
    return api.delete<User>(`users/${userId}/roles/${roleId}`);
  }
};

/**
 * Role API service
 */
export const roleService = {
  /**
   * Get all roles
   * @returns List of roles
   */
  getAllRoles(): Promise<Role[]> {
    return api.get<Role[]>('roles');
  },

  /**
   * Get role by ID
   * @param id - Role ID
   * @returns Role details
   */
  getRoleById(id: number): Promise<Role> {
    return api.get<Role>(`roles/${id}`);
  },

  /**
   * Create a new role (admin only)
   * @param roleData - Role data
   * @returns Created role
   */
  createRole(roleData: CreateRoleDto): Promise<Role> {
    return api.post<Role>('roles', roleData);
  },

  /**
   * Update a role (admin only)
   * @param id - Role ID
   * @param roleData - Updated role data
   * @returns Updated role
   */
  updateRole(id: number, roleData: UpdateRoleDto): Promise<Role> {
    return api.patch<Role>(`roles/${id}`, roleData);
  },
  /**
   * Delete a role (admin only)
   * @param id - Role ID
   */
  deleteRole(id: number): Promise<void> {
    // Make sure we're using the correct endpoint format for role deletion
    return api.delete<void>(`roles/${id}`);
  },

  /**
   * Add a permission to a role
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns Updated role
   */
  addPermissionToRole(roleId: number, permissionId: number): Promise<Role> {
    return api.post<Role>(`roles/${roleId}/permissions/${permissionId}`, {});
  },

  /**
   * Remove a permission from a role
   * @param roleId - Role ID
   * @param permissionId - Permission ID
   * @returns Updated role
   */
  removePermissionFromRole(roleId: number, permissionId: number): Promise<Role> {
    return api.delete<Role>(`roles/${roleId}/permissions/${permissionId}`);
  }
};

/**
 * Permission API service
 */
export const permissionService = {
  /**
   * Get all permissions
   * @returns List of permissions
   */
  getAllPermissions(): Promise<Permission[]> {
    return api.get<Permission[]>('permissions');
  },

  /**
   * Get permission by ID
   * @param id - Permission ID
   * @returns Permission details
   */
  getPermissionById(id: number): Promise<Permission> {
    return api.get<Permission>(`permissions/${id}`);
  },

  /**
   * Create a new permission (admin only)
   * @param permissionData - Permission data
   * @returns Created permission
   */
  createPermission(permissionData: CreatePermissionDto): Promise<Permission> {
    return api.post<Permission>('permissions', permissionData);
  },

  /**
   * Update a permission (admin only)
   * @param id - Permission ID
   * @param permissionData - Updated permission data
   * @returns Updated permission
   */
  updatePermission(id: number, permissionData: UpdatePermissionDto): Promise<Permission> {
    return api.patch<Permission>(`permissions/${id}`, permissionData);
  },

  /**
   * Delete a permission (admin only)
   * @param id - Permission ID
   */
  deletePermission(id: number): Promise<void> {
    return api.delete<void>(`permissions/${id}`);
  }
};

/**
 * User History API service
 */
export const historyService = {
  /**
   * Get all history entries
   * @returns List of history entries
   */
  getAllHistory(): Promise<UserHistory[]> {
    return api.get<UserHistory[]>('history');
  },

  /**
   * Get history entries for a user
   * @param userId - User ID
   * @returns List of history entries for the user
   */
  getUserHistory(userId: number): Promise<UserHistory[]> {
    return api.get<UserHistory[]>(`history/user/${userId}`);
  }
};
