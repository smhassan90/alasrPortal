import api from './api';

export type ActivityLogAction =
  | 'prayer_time_updated'
  | 'event_created'
  | 'question_answered'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_promoted'
  | 'user_demoted'
  | 'user_activated'
  | 'user_deactivated'
  | 'member_added'
  | 'member_removed'
  | 'member_role_updated'
  | 'masjid_created'
  | 'masjid_updated'
  | 'masjid_deactivated';

export interface ActivityLog {
  id: string;
  masjid_id?: string | null;
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

const ACTION_LABELS: Record<string, string> = {
  prayer_time_updated: 'Prayer time',
  event_created: 'Event',
  question_answered: 'Question',
  user_created: 'Created user',
  user_updated: 'Updated user',
  user_deleted: 'Deleted user',
  user_promoted: 'Promoted',
  user_demoted: 'Demoted',
  user_activated: 'Activated user',
  user_deactivated: 'Deactivated user',
  member_added: 'Added member',
  member_removed: 'Removed member',
  member_role_updated: 'Updated role',
  masjid_created: 'Created masjid',
  masjid_updated: 'Updated masjid',
  masjid_deactivated: 'Deactivated masjid',
};

export const actionLabel = (action: string): string => {
  return ACTION_LABELS[action] || action.replace(/_/g, ' ');
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
