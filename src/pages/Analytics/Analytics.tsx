import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card/Card';
import { StatCard } from '../../components/StatCard/StatCard';
import { Button } from '../../components/Button/Button';
import { StatsGrid, ChartsGrid } from '../../layouts';
import { colors } from '../../theme';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import masjidService from '../../services/masjidService';
import userService from '../../services/userService';

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [totalMasajids, setTotalMasajids] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [growthRate, setGrowthRate] = useState('0%');
  
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [activeMasjidsData, setActiveMasjidsData] = useState<any[]>([]);
  const [monthlyActivityData, setMonthlyActivityData] = useState<any[]>([]);
  
  const [todayStats, setTodayStats] = useState({
    questionsToday: 0,
    repliedToday: 0,
    newMasajids: 0,
    newUsers: 0,
  });

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const questionService = (await import('../../services/questionService')).default;
      
      const [masajids, users, questions] = await Promise.all([
        masjidService.getAllMasajids(),
        userService.getAllUsers(),
        questionService.getAllQuestions(true).catch(() => []), // Use cache to avoid rate limiting
      ]);

      setTotalMasajids(masajids.length);
      setTotalUsers(users.length);
      setTotalQuestions(questions.length);

      // Calculate user growth over last 6 months
      const userGrowth = calculateUserGrowth(users);
      setUserGrowthData(userGrowth);

      // Get top 5 active masajids by question count
      const topMasajids = calculateTopMasajids(masajids, questions);
      setActiveMasjidsData(topMasajids);

      // Calculate monthly activity trend
      const monthlyActivity = calculateMonthlyActivity(masajids, users, questions);
      setMonthlyActivityData(monthlyActivity);

      // Calculate today's stats
      const today = calculateTodayStats(masajids, users, questions);
      setTodayStats(today);

      // Calculate growth rate (simplified - based on data from last month)
      const growth = calculateGrowthRate(users);
      setGrowthRate(growth);

    } catch (error: any) {
      console.error('❌ Analytics load error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserGrowth = (users: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const month = months[monthIndex];
      
      // Count users created up to that month (cumulative)
      const monthEndDate = new Date();
      monthEndDate.setMonth(monthIndex + 1);
      monthEndDate.setDate(0); // Last day of the month
      
      const totalUsers = users.filter(u => new Date(u.created_at) <= monthEndDate).length;
      const superAdmins = users.filter(u => u.is_super_admin && new Date(u.created_at) <= monthEndDate).length;
      
      result.push({
        month,
        total: totalUsers,
        superAdmins,
        regular: totalUsers - superAdmins,
      });
    }

    return result;
  };

  const calculateTopMasajids = (masajids: any[], questions: any[]) => {
    // Count questions per masjid
    const masjidQuestionCounts = masajids.map(masjid => ({
      name: masjid.name,
      questions: questions.filter(q => q.masjid_id === masjid.id).length,
      events: masjid.total_events || 0,
    }));

    // Sort by question count and take top 5
    return masjidQuestionCounts
      .sort((a, b) => b.questions - a.questions)
      .slice(0, 5);
  };

  const calculateMonthlyActivity = (masajids: any[], users: any[], questions: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const month = months[monthIndex];
      
      const monthEndDate = new Date();
      monthEndDate.setMonth(monthIndex + 1);
      monthEndDate.setDate(0);
      
      const masjidsCount = masajids.filter(m => new Date(m.created_at) <= monthEndDate).length;
      const usersCount = users.filter(u => new Date(u.created_at) <= monthEndDate).length;
      const questionsCount = questions.filter(q => new Date(q.submitted_at) <= monthEndDate).length;
      
      result.push({
        month,
        masajids: masjidsCount,
        users: usersCount,
        questions: questionsCount,
      });
    }

    return result;
  };

  const calculateTodayStats = (masajids: any[], users: any[], questions: any[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return {
      questionsToday: questions.filter(q => new Date(q.submitted_at) >= today).length,
      repliedToday: questions.filter(q => q.replied_at && new Date(q.replied_at) >= today).length,
      newMasajids: masajids.filter(m => new Date(m.created_at) >= today).length,
      newUsers: users.filter(u => new Date(u.created_at) >= today).length,
    };
  };

  const calculateGrowthRate = (users: any[]) => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    const lastMonthUsers = users.filter(u => {
      const created = new Date(u.created_at);
      return created >= lastMonth && created < now;
    }).length;
    
    const previousMonthUsers = users.filter(u => {
      const created = new Date(u.created_at);
      return created >= twoMonthsAgo && created < lastMonth;
    }).length;
    
    if (previousMonthUsers === 0) return '0%';
    
    const growth = ((lastMonthUsers - previousMonthUsers) / previousMonthUsers) * 100;
    return `${growth.toFixed(1)}%`;
  };
  const handleExportPDF = () => {
    toast.info('Exporting to PDF...');
    // Implement PDF export logic
  };

  const handleExportExcel = () => {
    toast.info('Exporting to Excel...');
    // Implement Excel export logic
  };

  const handleExportCSV = () => {
    toast.info('Exporting to CSV...');
    // Implement CSV export logic
  };

  return (
    <>
      <Card
        title="Analytics & Reports"
        subtitle="View system statistics and generate reports"
        headerAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="outline" size="small" onClick={handleExportPDF}>
              📄 PDF
            </Button>
            <Button variant="outline" size="small" onClick={handleExportExcel}>
              📊 Excel
            </Button>
            <Button variant="outline" size="small" onClick={handleExportCSV}>
              📋 CSV
            </Button>
          </div>
        }
      >
        <div></div>
      </Card>

      <StatsGrid>
        <StatCard
          title="Total Masajids"
          value={totalMasajids}
          icon="🕌"
          color={colors.primary}
        />
        <StatCard
          title="Total Users"
          value={totalUsers}
          icon="👥"
          color={colors.info}
        />
        <StatCard
          title="Total Questions"
          value={totalQuestions}
          icon="❓"
          color={colors.secondary}
        />
        <StatCard
          title="Growth Rate"
          value={growthRate}
          icon="📈"
          color={colors.success}
        />
      </StatsGrid>

      <ChartsGrid>
        <Card title="User Growth Over Time" padding="large">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
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
              <Area
                type="monotone"
                dataKey="total"
                stroke={colors.primary}
                fill={colors.primary}
                fillOpacity={0.3}
                name="Total Users"
              />
              <Area
                type="monotone"
                dataKey="superAdmins"
                stroke={colors.error}
                fill={colors.error}
                fillOpacity={0.3}
                name="Super Admins"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top 5 Active Masajids" padding="large">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activeMasjidsData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis type="number" stroke={colors.textLight} style={{ fontSize: 12 }} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={colors.textLight}
                style={{ fontSize: 12 }}
                width={120}
              />
              <Tooltip
                contentStyle={{
                  background: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  fontSize: 14,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 14 }} />
              <Bar dataKey="questions" fill={colors.primary} name="Questions" />
              <Bar dataKey="events" fill={colors.secondary} name="Events" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Monthly Activity Trend" padding="large">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyActivityData}>
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
                dataKey="masajids"
                stroke={colors.primary}
                strokeWidth={2}
                name="Masajids"
              />
              <Line
                type="monotone"
                dataKey="users"
                stroke={colors.info}
                strokeWidth={2}
                name="Users"
              />
              <Line
                type="monotone"
                dataKey="questions"
                stroke={colors.success}
                strokeWidth={2}
                name="Questions"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="System Overview" padding="large">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
              }}
            >
              <div style={{ padding: '16px', background: colors.backgroundLight, borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: colors.textLight }}>Questions Today</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.primary }}>{todayStats.questionsToday}</div>
              </div>
              <div style={{ padding: '16px', background: colors.backgroundLight, borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: colors.textLight }}>Replied Today</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.success }}>{todayStats.repliedToday}</div>
              </div>
              <div style={{ padding: '16px', background: colors.backgroundLight, borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: colors.textLight }}>New Masajids</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.info }}>{todayStats.newMasajids}</div>
              </div>
              <div style={{ padding: '16px', background: colors.backgroundLight, borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', color: colors.textLight }}>New Users</div>
                <div style={{ fontSize: '24px', fontWeight: 700, color: colors.secondary }}>{todayStats.newUsers}</div>
              </div>
            </div>
          </div>
        </Card>
      </ChartsGrid>
    </>
  );
};

