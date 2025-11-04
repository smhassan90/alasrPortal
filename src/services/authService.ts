import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  is_super_admin: boolean;
  is_active: boolean;
  created_at: string;
  masjid_assignment?: {
    masjid_id: string;
    masjid_name?: string;
    role: 'admin' | 'imam' | 'Admin' | 'Imam';
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

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    
    // Log the response for debugging
    console.log('API Response:', response.data);
    
    // Validate response structure
    if (!response.data || !response.data.data) {
      throw new Error('Invalid response from server');
    }
    
    const { user, accessToken, refreshToken } = response.data.data;
    
    if (!user) {
      throw new Error('User data not found in response');
    }
    
    // Check if user is super admin
    if (!user.is_super_admin) {
      throw new Error('Access denied. Only super admins can access this portal.');
    }

    // Store tokens and user info
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  async refreshToken(refreshToken: string): Promise<string> {
    const response = await api.post<{ access_token: string }>('/auth/refresh-token', {
      refresh_token: refreshToken,
    });
    localStorage.setItem('access_token', response.data.access_token);
    return response.data.access_token;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('access_token');
    const user = this.getCurrentUser();
    return !!token && !!user && user.is_super_admin;
  }
}

export default new AuthService();

