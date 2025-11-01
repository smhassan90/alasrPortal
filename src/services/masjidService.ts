import api from './api';

export interface Masjid {
  id: string;
  name: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_email?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateMasjidData {
  name: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateMasjidData {
  name?: string;
  location?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface MasjidStatistics {
  total_questions: number;
  pending_questions: number;
  total_events: number;
  upcoming_events: number;
  total_members: number;
}

export interface MasjidMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: 'Admin' | 'Imam';
  permissions: string[];
  assigned_at: string;
}

export interface AddMemberData {
  user_id: string;
  role: 'Admin' | 'Imam';
  permissions: string[];
}

// Backend expects this format
interface BackendAddMemberData {
  userId: string;
  role: 'admin' | 'imam';
  permissions: {
    can_view_complaints: boolean;
    can_answer_complaints: boolean;
    can_view_questions: boolean;
    can_answer_questions: boolean;
    can_change_prayer_times: boolean;
    can_create_events: boolean;
    can_create_notifications: boolean;
  };
}

class MasjidService {
  // Cache for masajids to avoid rate limiting
  private masajidsCache: Masjid[] | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_DURATION = 300000; // 5 minutes cache (increased from 1 minute)
  private pendingRequest: Promise<Masjid[]> | null = null; // Prevent duplicate requests

  async getAllMasajids(useCache: boolean = true): Promise<Masjid[]> {
    // Check cache first
    const now = Date.now();
    if (useCache && this.masajidsCache && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      console.log('📦 Using cached masajids data (age: ' + Math.floor((now - this.cacheTimestamp) / 1000) + 's)');
      return this.masajidsCache;
    }

    // If there's already a pending request, wait for it instead of making a new one
    if (this.pendingRequest) {
      console.log('⏳ Waiting for existing masajids request...');
      return this.pendingRequest;
    }

    // Create new request
    this.pendingRequest = this.fetchMasajids();
    
    try {
      const result = await this.pendingRequest;
      return result;
    } finally {
      this.pendingRequest = null;
    }
  }

  private async fetchMasajids(): Promise<Masjid[]> {
    try {
      const response = await api.get<{ data: Masjid[] } | Masjid[]>('/masajids');
      console.log('🔍 Raw API Response for /masajids:', response.data);
      console.log('🔍 Response type:', typeof response.data);
      console.log('🔍 Is Array?', Array.isArray(response.data));
      
      // Handle both direct array and wrapped response
      let masajids: Masjid[] = [];
      if (Array.isArray(response.data)) {
        console.log('✅ Direct array format detected');
        masajids = response.data;
      } else if ((response.data as any).data) {
        console.log('✅ Wrapped format detected, extracting data');
        masajids = (response.data as any).data;
      } else {
        console.warn('⚠️ Unknown response format:', response.data);
        masajids = [];
      }
      
      // Update cache
      const now = Date.now();
      this.masajidsCache = masajids;
      this.cacheTimestamp = now;
      
      return masajids;
    } catch (error: any) {
      console.error('❌ Failed to fetch masajids');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error:', error);
      
      // Handle 429 (Too Many Requests) error
      if (error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for masajids, using cached data');
        if (this.masajidsCache) {
          return this.masajidsCache;
        }
      }
      
      // Handle network errors
      if (!error.response) {
        console.error('❌ Network error - no response from server');
        if (this.masajidsCache) {
          console.log('📦 Returning cached data due to network error');
          return this.masajidsCache;
        }
      }
      
      // Return cached data if available for any error
      if (this.masajidsCache) {
        console.log('📦 Returning cached data due to API error');
        return this.masajidsCache;
      }
      
      // No cache available, throw the error
      throw error;
    }
  }

  async getMasjidById(id: string): Promise<Masjid> {
    const response = await api.get<{ data: Masjid } | Masjid>(`/masajids/${id}`);
    // Handle both direct object and wrapped response
    return (response.data as any).data || response.data;
  }

  async createMasjid(data: CreateMasjidData): Promise<Masjid> {
    const response = await api.post<{ data: Masjid } | Masjid>('/masajids', data);
    // Clear cache when creating a masjid
    this.clearCache();
    return (response.data as any).data || response.data;
  }

  async updateMasjid(id: string, data: UpdateMasjidData): Promise<Masjid> {
    const response = await api.put<Masjid>(`/masajids/${id}`, data);
    // Clear cache when updating a masjid
    this.clearCache();
    return response.data;
  }

  async deleteMasjid(id: string): Promise<void> {
    await api.delete(`/masajids/${id}`);
    // Clear cache when deleting a masjid
    this.clearCache();
  }

  async getMasjidStatistics(id: string): Promise<MasjidStatistics> {
    const response = await api.get<MasjidStatistics>(`/masajids/${id}/statistics`);
    return response.data;
  }

  async getMasjidMembers(id: string): Promise<MasjidMember[]> {
    console.log('📥 Fetching members for masjid:', id);
    console.log('📥 Endpoint: GET /masajids/' + id + '/members');
    
    try {
      const response = await api.get<any>(`/masajids/${id}/members`);
      console.log('📥 Raw members response:', response.data);
      console.log('📥 Response type:', typeof response.data);
      console.log('📥 Is array?:', Array.isArray(response.data));
    
    // Handle multiple response formats
    let members: any[] = [];
    
    if (Array.isArray(response.data)) {
      // Direct array: [...]
      members = response.data;
    } else if (response.data.data) {
      // Wrapped format
      if (Array.isArray(response.data.data)) {
        // Format: { data: [...] }
        members = response.data.data;
      } else if (response.data.data.members) {
        // Format: { data: { members: [...] } }  ← Backend's actual format!
        members = response.data.data.members;
      }
    }
    
    console.log('📥 Extracted members array:', members);
    console.log('📥 Total members count:', members.length);
    
    // Transform backend format to frontend format if needed
    // Backend might return: { userId, role: "admin", permissions: {...} }
    // Frontend expects: { user_id, role: "Admin", permissions: [...] }
    members = members.map((member: any) => {
      // If permissions is an object, convert to array
      let permissions = member.permissions;
      if (permissions && typeof permissions === 'object' && !Array.isArray(permissions)) {
        // Convert { can_view_questions: true, ... } to ["can_view_questions", ...]
        permissions = Object.keys(permissions).filter(key => permissions[key] === true);
      }
      
      return {
        id: member.id || member._id,
        user_id: member.user_id || member.userId,
        user_name: member.user_name || member.userName || member.name,
        user_email: member.user_email || member.userEmail || member.email,
        role: member.role ? (member.role.charAt(0).toUpperCase() + member.role.slice(1)) : member.role,
        permissions: Array.isArray(permissions) ? permissions : [],
        assigned_at: member.assigned_at || member.assignedAt || member.created_at || member.createdAt,
      };
    });
    
    console.log('📥 Transformed members:', members);
    
    return members;
    } catch (error: any) {
      console.error('❌ Failed to fetch members');
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      console.error('❌ Error message:', error.message);
      
      // Return empty array if endpoint doesn't exist
      if (error.response?.status === 404) {
        console.warn('⚠️ Members endpoint not found, returning empty array');
        return [];
      }
      
      throw error;
    }
  }

  async addMemberToMasjid(masjidId: string, data: AddMemberData): Promise<MasjidMember> {
    console.log('📤 POST /masajids/' + masjidId + '/users');
    console.log('📤 Frontend data:', JSON.stringify(data, null, 2));
    
    // Convert frontend format to backend format
    // Backend expects: { userId: string, role: lowercase, permissions: object with booleans }
    const permissionsObject: any = {};
    data.permissions.forEach(permission => {
      permissionsObject[permission] = true;
    });
    
    const backendPayload: BackendAddMemberData = {
      userId: data.user_id,
      role: data.role.toLowerCase() as 'admin' | 'imam',
      permissions: {
        can_view_complaints: permissionsObject['can_view_complaints'] || false,
        can_answer_complaints: permissionsObject['can_answer_complaints'] || false,
        can_view_questions: permissionsObject['can_view_questions'] || false,
        can_answer_questions: permissionsObject['can_answer_questions'] || false,
        can_change_prayer_times: permissionsObject['can_change_prayer_times'] || false,
        can_create_events: permissionsObject['can_create_events'] || false,
        can_create_notifications: permissionsObject['can_create_notifications'] || false,
      }
    };
    
    console.log('📤 Backend payload:', JSON.stringify(backendPayload, null, 2));
    
    try {
      const response = await api.post<{ data: MasjidMember } | MasjidMember>(
        `/masajids/${masjidId}/users`, 
        backendPayload
      );
      console.log('✅ Member added successfully!');
      console.log('📥 Success Response:', response.data);
      // Handle both direct object and wrapped response
      return (response.data as any).data || response.data;
    } catch (error: any) {
      console.error('❌ Failed to add member');
      console.error('📥 Error Response Status:', error.response?.status);
      console.error('📥 Error Response Data:', error.response?.data);
      console.error('📥 Error Message:', error.message);
      
      // Log detailed validation errors
      if (error.response?.data?.errors) {
        console.error('📋 Validation errors:');
        error.response.data.errors.forEach((err: any, index: number) => {
          console.error(`   ${index + 1}.`, err);
        });
      }
      
      throw error;
    }
  }

  async removeMemberFromMasjid(masjidId: string, userId: string): Promise<void> {
    await api.delete(`/masajids/${masjidId}/users/${userId}`);
  }

  // Method to clear cache manually
  clearCache(): void {
    this.masajidsCache = null;
    this.cacheTimestamp = 0;
  }
}

export default new MasjidService();

