import api from './api';

export type ActivityLogAction =
  | 'prayer_time_updated'
  | 'event_created'
  | 'question_answered';

export interface ActivityLog {
  id: string;
  masjid_id: string;
  user_id?: string | null;
  action: ActivityLogAction | string;
  message: string;
  metadata?: Record<string, any> | null;
  created_at: string;
  user?: {
    id: string;
    name: string;
  } | null;
  masjid?: {
    id: string;
    name: string;
  } | null;
}

export const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) {
    return '';
  }
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) {
    return dateString;
  }
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? 'Yesterday' : `${days}d ago`;
};

export const actionLabel = (action: string): string => {
  if (action === 'prayer_time_updated') {
    return 'Prayer time';
  }
  if (action === 'event_created') {
    return 'Event';
  }
  if (action === 'question_answered') {
    return 'Question';
  }
  return action.replace(/_/g, ' ');
};

class ActivityLogService {
  async getAllLogs(params?: {page?: number; limit?: number}): Promise<ActivityLog[]> {
    const response = await api.get('/super-admin/activity-logs', {params});
    const payload = response.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return [];
  }
}

export default new ActivityLogService();
