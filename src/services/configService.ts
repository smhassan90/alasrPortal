import api from './api';

export interface AppConfig {
  maxFavoritesLimit: number;
}

export interface AppConfigResponse {
  data: AppConfig;
}

class ConfigService {
  async getAppConfig(): Promise<AppConfig> {
    const response = await api.get<AppConfigResponse>('/super-admin/config/app');
    // Handle both direct object and wrapped response
    return (response.data as any).data || response.data;
  }

  async updateAppConfig(config: Partial<AppConfig>): Promise<AppConfig> {
    const response = await api.put<AppConfigResponse>('/super-admin/config/app', config);
    // Handle both direct object and wrapped response
    return (response.data as any).data || response.data;
  }
}

export default new ConfigService();

