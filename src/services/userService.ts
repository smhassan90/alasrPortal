import api from './api';
import type { User } from './authService';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  is_super_admin?: boolean;
  masjid_assignment?: {
    masjid_id: string;
    role: 'admin' | 'imam';
    permissions?: {
      can_view_complaints?: boolean;
      can_answer_complaints?: boolean;
      can_view_questions?: boolean;
      can_answer_questions?: boolean;
      can_change_prayer_times?: boolean;
      can_create_events?: boolean;
      can_create_notifications?: boolean;
    };
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  is_active?: boolean;
  masjid_assignment?: {
    masjid_id: string;
    role: 'admin' | 'imam';
    permissions?: {
      can_view_complaints?: boolean;
      can_answer_complaints?: boolean;
      can_view_questions?: boolean;
      can_answer_questions?: boolean;
      can_change_prayer_times?: boolean;
      can_create_events?: boolean;
      can_create_notifications?: boolean;
    };
  } | null; // null means remove assignment
}

class UserService {
  // Cache for users to avoid rate limiting
  private usersCache: User[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 300000; // 5 minutes cache (increased from 1 minute)
  private pendingRequest: Promise<User[]> | null = null; // Prevent duplicate requests

  async getAllUsers(useCache: boolean = true): Promise<User[]> {
    // Check cache first
    const now = Date.now();
    if (useCache && this.usersCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached users data (age: ' + Math.floor((now - this.cacheTimestamp) / 1000) + 's)');
      return this.usersCache;
    }

    // If there's already a pending request, wait for it instead of making a new one
    if (this.pendingRequest) {
      console.log('⏳ Waiting for existing users request...');
      return this.pendingRequest;
    }

    // Create new request
    this.pendingRequest = this.fetchUsers();
    
    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      this.pendingRequest = null;
    }
  }

  private async fetchUsers(): Promise<User[]> {
    try {
      const response = await api.get<{ data: User[] } | User[]>('/super-admin/users');
      // Handle both direct array and wrapped response
      const users = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
      
      // Update cache
      this.usersCache = users;
      this.cacheTimestamp = Date.now();
      
      return users;
    } catch (error: any) {
      console.error('❌ Failed to fetch users');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      // Handle 429 (Too Many Requests) error
      if (error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for users, using cached data');
        if (this.usersCache) {
          return this.usersCache;
        }
      }
      
      // Handle network errors
      if (!error.response) {
        console.error('❌ Network error - no response from server');
        if (this.usersCache) {
          console.log('📦 Returning cached data due to network error');
          return this.usersCache;
        }
      }
      
      // Return cached data if available for any error
      if (this.usersCache) {
        console.log('📦 Returning cached data due to API error');
        return this.usersCache;
      }
      
      // No cache available, throw the error
      throw error;
    }
  }

  async getUserById(id: string): Promise<User> {
    const response = await api.get<{ data: User } | User>(`/super-admin/users/${id}`);
    // Handle both direct object and wrapped response
    return (response.data as any).data || response.data;
  }

  async createUser(data: CreateUserData): Promise<User> {
    console.log('📤 Creating user with data:', JSON.stringify(data, null, 2));
    
    // Use the new super-admin endpoint that supports masjid assignment
    const response = await api.post<{ data: { user: User; masjid_assignment?: any } } | User>(
      '/super-admin/users',
      data
    );
    
    console.log('📥 User created response:', response.data);
    
    // Clear cache when creating a user
    this.clearCache();
    
    // Handle both direct user object and wrapped response
    if ((response.data as any).data?.user) {
      return (response.data as any).data.user;
    }
    return response.data as User;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    // Trim the ID to remove any whitespace
    const trimmedId = id.trim();
    console.log('📤 Updating user:', trimmedId);
    console.log('📤 Update payload (raw):', JSON.stringify(data, null, 2));
    
    // Clean up the payload - remove undefined values but keep null values (for masjid_assignment removal)
    const cleanedData: any = {};
    Object.keys(data).forEach(key => {
      const value = (data as any)[key];
      if (value !== undefined) {
        cleanedData[key] = value;
      }
    });
    
    // Ensure masjid_assignment null is preserved correctly
    if ('masjid_assignment' in data && data.masjid_assignment === null) {
      cleanedData.masjid_assignment = null;
    }
    
    console.log('📤 Cleaned payload:', JSON.stringify(cleanedData, null, 2));
    console.log('📤 Full URL will be:', `${import.meta.env.VITE_API_BASE_URL}/super-admin/users/${trimmedId}`);
    
    try {
      const response = await api.put<{ data: { user: User; masjid_assignment?: any } } | User>(
        `/super-admin/users/${trimmedId}`,
        cleanedData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('📥 User updated response:', response.data);
      
      // Clear cache when updating a user
      this.clearCache();
      
      // Handle response format (matches create user response)
      if ((response.data as any).data?.user) {
        const userData = (response.data as any).data.user;
        // Merge masjid_assignment if present in response
        if ((response.data as any).data.masjid_assignment) {
          userData.masjid_assignment = (response.data as any).data.masjid_assignment;
        }
        return userData;
      }
      return response.data as User;
    } catch (error: any) {
      console.error('❌ Failed to update user');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      console.error('❌ Request URL:', error.config?.url);
      console.error('❌ Request baseURL:', error.config?.baseURL);
      console.error('❌ Full URL:', `${error.config?.baseURL}${error.config?.url}`);
      console.error('❌ Request payload:', JSON.stringify(cleanedData, null, 2));
      console.error('❌ Request headers:', error.config?.headers);
      console.error('❌ Response headers:', error.response?.headers);
      
      throw error;
    }
  }

  async promoteToSuperAdmin(id: string): Promise<User> {
    const response = await api.put<User>(`/super-admin/users/${id}/promote`);
    // Clear cache when promoting a user
    this.clearCache();
    return response.data;
  }

  async demoteFromSuperAdmin(id: string): Promise<User> {
    const response = await api.put<User>(`/super-admin/users/${id}/demote`);
    // Clear cache when demoting a user
    this.clearCache();
    return response.data;
  }

  async activateUser(id: string): Promise<User> {
    const response = await api.put<User>(`/super-admin/users/${id}/activate`);
    // Clear cache when activating a user
    this.clearCache();
    return response.data;
  }

  async deactivateUser(id: string): Promise<User> {
    const response = await api.put<User>(`/super-admin/users/${id}/deactivate`);
    // Clear cache when deactivating a user
    this.clearCache();
    return response.data;
  }

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/super-admin/users/${id}`);
    // Clear cache when deleting a user
    this.clearCache();
  }

  async getSuperAdmins(): Promise<User[]> {
    const response = await api.get<User[]>('/super-admin/list');
    return response.data;
  }

  // Method to clear cache manually
  clearCache(): void {
    this.usersCache = null;
    this.cacheTimestamp = 0;
  }
}

export default new UserService();

