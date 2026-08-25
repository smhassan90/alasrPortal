import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, StatsGrid, ChartsGrid } from '../../layouts';
import { StatCard } from '../../components/StatCard/StatCard';
import { Card } from '../../components/Card/Card';
import { Table } from '../../components/Table/Table';
import type { TableColumn } from '../../components/Table/Table';
import { Badge } from '../../components/Badge/Badge';
import { Text } from '../../components/Text/Text';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { colors } from '../../theme';
import { toast } from 'react-toastify';
import masjidService from '../../services/masjidService';
import userService from '../../services/userService';
import activityLogService, {
  actionLabel,
  formatRelativeTime,
} from '../../services/activityLogService';
import { IconClock, IconHelp, IconMosque, IconUser, IconUsers } from '../../components/Icons';

interface MonthlyData {
  month: string;
  count: number;
}

interface QuestionsMonthlyData {
  month: string;
  new: number;
  replied: number;
}

interface UserDistribution {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMasajids: 0,
    totalUsers: 0,
    totalQuestions: 0,
    pendingQuestions: 0,
    uniqueMasjidCreators: 0,
  });
  const [monthlyMasjidsData, setMonthlyMasjidsData] = useState<MonthlyData[]>([]);
  const [questionsData, setQuestionsData] = useState<QuestionsMonthlyData[]>([]);
  const [userDistributionData, setUserDistributionData] = useState<UserDistribution[]>([]);
  const [recentActivitiesData, setRecentActivitiesData] = useState<Activity[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const questionService = (await import('../../services/questionService')).default;
      
      const [masajids, users, questions, activityLogs] = await Promise.all([
        masjidService.getAllMasajids(),
        userService.getAllUsers(),
        questionService.getAllQuestions(true).catch(() => []), // Use cache to avoid rate limiting
        activityLogService.getAllLogs({ page: 1, limit: 8 }).catch(() => []),
      ]);

      console.log('📊 Dashboard Data Loaded:');
      console.log('  - Masajids:', masajids.length, masajids);
      console.log('  - Users:', users.length, users);
      console.log('  - Questions:', questions.length, questions);

      const pendingCount = questions.filter(q => q.status === 'New').length;

      // Calculate unique masjid creators
      const uniqueCreators = calculateUniqueMasjidCreators(masajids);

      setStats({
        totalMasajids: masajids.length,
        totalUsers: users.length,
        totalQuestions: questions.length,
        pendingQuestions: pendingCount,
        uniqueMasjidCreators: uniqueCreators,
      });

      // Calculate monthly masajids data from created_at
      const masjidsMonthly = calculateMonthlyMasajids(masajids);
      setMonthlyMasjidsData(masjidsMonthly);

      // Calculate questions statistics by month
      const questionsMonthly = calculateMonthlyQuestions(questions);
      setQuestionsData(questionsMonthly);

      // Calculate user distribution
      const userDist = calculateUserDistribution(users);
      setUserDistributionData(userDist);

      setRecentActivitiesData(
        activityLogs.map((log) => ({
          id: log.id,
          user: log.user?.name || 'Unknown',
          action: actionLabel(log.action),
          target: log.message || log.masjid?.name || '—',
          time: formatRelativeTime(log.created_at),
        })),
      );

    } catch (error: any) {
      console.error('❌ Dashboard load error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate masajids registration trend by month
  const calculateMonthlyMasajids = (masajids: any[]): MonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthCounts: { [key: string]: number } = {};
    
    // Initialize all months with 0
    months.forEach(month => monthCounts[month] = 0);
    
    // Count masajids by month (cumulative)
    masajids.forEach(masjid => {
      if (masjid.created_at) {
        const date = new Date(masjid.created_at);
        const monthIndex = date.getMonth();
        const month = months[monthIndex];
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    
    // Convert to cumulative counts
    let cumulative = 0;
    return months.map(month => {
      cumulative += monthCounts[month];
      return { month, count: cumulative };
    });
  };

  // Calculate questions by month
  const calculateMonthlyQuestions = (questions: any[]): QuestionsMonthlyData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthData: { [key: string]: { new: number; replied: number } } = {};
    
    // Initialize all months
    months.forEach(month => monthData[month] = { new: 0, replied: 0 });
    
    // Count questions by month and status
    questions.forEach(question => {
      if (question.submitted_at) {
        const date = new Date(question.submitted_at);
        const monthIndex = date.getMonth();
        const month = months[monthIndex];
        
        if (question.status === 'New') {
          monthData[month].new++;
        } else if (question.status === 'Replied') {
          monthData[month].replied++;
        }
      }
    });
    
    // Return last 6 months with data
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const month = months[monthIndex];
      last6Months.push({
        month,
        new: monthData[month].new,
        replied: monthData[month].replied,
      });
    }
    
    return last6Months;
  };

  // Calculate user distribution
  const calculateUserDistribution = (users: any[]): UserDistribution[] => {
    const superAdmins = users.filter(u => u.is_super_admin).length;
    const regularUsers = users.length - superAdmins;
    
    return [
      { name: 'Super Admins', value: superAdmins, color: colors.primary },
      { name: 'Regular Users', value: regularUsers, color: colors.info },
    ];
  };

  // Calculate unique masjid creators
  const calculateUniqueMasjidCreators = (masajids: any[]): number => {
    const creatorIds = new Set<string>();
    
    masajids.forEach(masjid => {
      // Check multiple possible field names for creator
      const creatorId = masjid.created_by || masjid.creator_id || masjid.creator?.id;
      if (creatorId) {
        creatorIds.add(creatorId);
      }
    });
    
    return creatorIds.size;
  };

  const activityColumns: TableColumn[] = [
    { key: 'user', label: 'Done by', width: '20%' },
    {
      key: 'action',
      label: 'Action',
      width: '18%',
      render: (value) => <Badge variant="info" size="small">{value}</Badge>,
    },
    { key: 'target', label: 'Details', width: '37%' },
    {
      key: 'time',
      label: 'Time',
      width: '25%',
      render: (value) => <Text size="sm" color={colors.textLight}>{value}</Text>,
    },
  ];

  return (
    <DashboardLayout>
      <StatsGrid>
        <StatCard
          title="Total Masajids"
          value={stats.totalMasajids}
          icon={<IconMosque />}
          color={colors.primary}
          onClick={() => navigate('/masajids')}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon={<IconUsers />}
          color={colors.info}
          onClick={() => navigate('/users')}
        />
        <StatCard
          title="Total Questions"
          value={stats.totalQuestions}
          icon={<IconHelp />}
          color={colors.secondary}
          onClick={() => navigate('/questions')}
        />
        <StatCard
          title="Pending Questions"
          value={stats.pendingQuestions}
          icon={<IconClock />}
          color={colors.warning}
          onClick={() => navigate('/questions')}
        />
        <StatCard
          title="Masjid Creators"
          value={stats.uniqueMasjidCreators}
          icon={<IconUser />}
          color={colors.success}
          onClick={() => navigate('/masajids')}
        />
      </StatsGrid>

      <ChartsGrid>
        <Card title="Masajids Registration Trend" padding="large">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyMasjidsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.textLight} style={{ fontSize: 12 }} />
              <YAxis stroke={colors.textLight} style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: 14,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Line
                type="monotone"
                dataKey="count"
                stroke={colors.primary}
                strokeWidth={2}
                name="Masajids"
                dot={{ fill: colors.primary, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Questions Statistics" padding="large">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={questionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="month" stroke={colors.textLight} style={{ fontSize: 12 }} />
              <YAxis stroke={colors.textLight} style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: 14,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="new" fill={colors.primary} name="New Questions" />
              <Bar dataKey="replied" fill={colors.success} name="Replied" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="User Distribution" padding="large">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill={colors.primary}
                dataKey="value"
              >
                {userDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: 14,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Recent Activity" padding="none">
          <Table
            columns={activityColumns}
            data={recentActivitiesData}
            loading={loading}
            emptyMessage="No recent activities"
          />
        </Card>
      </ChartsGrid>
    </DashboardLayout>
  );
};

