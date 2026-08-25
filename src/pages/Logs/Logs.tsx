import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card/Card';
import { Table } from '../../components/Table/Table';
import type { TableColumn } from '../../components/Table/Table';
import { Badge } from '../../components/Badge/Badge';
import { Text } from '../../components/Text/Text';
import { toast } from 'react-toastify';
import activityLogService, {
  actionLabel,
  formatRelativeTime,
} from '../../services/activityLogService';
import type { ActivityLog } from '../../services/activityLogService';
import { colors } from '../../theme';

export const Logs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await activityLogService.getAllLogs({ page: 1, limit: 100 });
      setLogs(data);
    } catch (error) {
      console.error('Failed to load activity logs:', error);
      setLogs([]);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'created_at',
      label: 'Time',
      width: '16%',
      render: (value) => (
        <Text size="sm" color={colors.textLight}>
          {formatRelativeTime(value)}
        </Text>
      ),
    },
    {
      key: 'user',
      label: 'Done by',
      width: '16%',
      render: (_value, row) => row.user?.name || 'Unknown',
    },
    {
      key: 'masjid',
      label: 'Masjid',
      width: '18%',
      render: (_value, row) => row.masjid?.name || '—',
    },
    {
      key: 'action',
      label: 'Action',
      width: '14%',
      render: (value) => (
        <Badge variant="info" size="small">
          {actionLabel(value)}
        </Badge>
      ),
    },
    {
      key: 'message',
      label: 'Details',
      width: '36%',
    },
  ];

  return (
    <Card
      title="Activity Logs"
      subtitle="Last 7 days of portal and masjid activity"
      padding="none"
    >
      <Table
        columns={columns}
        data={logs}
        loading={loading}
        emptyMessage="No activity in the last 7 days"
      />
    </Card>
  );
};
