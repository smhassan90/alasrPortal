import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card/Card';
import { StatCard } from '../../components/StatCard/StatCard';
import { Table } from '../../components/Table/Table';
import type { TableColumn } from '../../components/Table/Table';
import { Badge } from '../../components/Badge/Badge';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Select/Select';
import { Modal } from '../../components/Modal/Modal';
import { Text } from '../../components/Text/Text';
import { Button } from '../../components/Button/Button';
import { toast } from 'react-toastify';
import questionService from '../../services/questionService';
import type { Question } from '../../services/questionService';
import { StatsGrid } from '../../layouts';
import { colors } from '../../theme';

export const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      // Force refresh (bypass cache) when user explicitly loads the page
      const data = await questionService.getAllQuestions(false);
      setQuestions(data);
      
      if (data.length === 0) {
        toast.info('No questions found. Questions will appear here once users submit them.');
      }
    } catch (error: any) {
      console.error('Failed to load questions:', error);
      setQuestions([]);
      toast.error('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (question: Question) => {
    setSelectedQuestion(question);
    setShowDetailsModal(true);
  };

  const handleDeleteQuestion = async (question: Question) => {
    if (!confirm(`Are you sure you want to delete this question: "${question.title}"?`)) return;

    try {
      setLoading(true);
      await questionService.deleteQuestion(question.id);
      // Remove from local state immediately for better UX
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
      toast.success('Question deleted successfully');
      // Optionally reload from API to ensure sync
      loadQuestions();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete question';
      toast.error(errorMsg);
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (question.masjid_name && question.masjid_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'new' && question.status === 'New') ||
      (filterStatus === 'replied' && question.status === 'Replied');
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: questions.length,
    pending: questions.filter((q) => q.status === 'New').length,
    replied: questions.filter((q) => q.status === 'Replied').length,
  };

  const columns: TableColumn[] = [
    { key: 'id', label: 'ID', width: '8%' },
    { key: 'masjid_name', label: 'Masjid', width: '15%' },
    { key: 'user_name', label: 'User', width: '12%' },
    { key: 'user_email', label: 'Email', width: '15%' },
    { key: 'title', label: 'Title', width: '20%' },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (value) =>
        value === 'New' ? (
          <Badge variant="warning">New</Badge>
        ) : (
          <Badge variant="success">Replied</Badge>
        ),
    },
    {
      key: 'submitted_at',
      label: 'Submitted',
      width: '10%',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button size="small" variant="outline" onClick={() => handleViewDetails(row)}>
            View
          </Button>
          <Button size="small" variant="danger" onClick={() => handleDeleteQuestion(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <StatsGrid>
        <StatCard
          title="Total Questions"
          value={stats.total}
          icon="❓"
          color={colors.info}
        />
        <StatCard
          title="Pending Questions"
          value={stats.pending}
          icon="⏳"
          color={colors.warning}
        />
        <StatCard
          title="Replied Questions"
          value={stats.replied}
          icon="✅"
          color={colors.success}
        />
        <StatCard
          title="Avg Response Time"
          value="2.5h"
          icon="⏱️"
          color={colors.primary}
        />
      </StatsGrid>

      <Card
        title="Questions Overview"
        subtitle={`${filteredQuestions.length} questions found`}
        padding="none"
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #E0E0E0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Input
              placeholder="Search by title, user, or masjid..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<span>🔍</span>}
            />
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'new', label: 'New' },
                { value: 'replied', label: 'Replied' },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filter by status"
            />
          </div>
        </div>
        <Table
          columns={columns}
          data={filteredQuestions}
          loading={loading}
          emptyMessage="No questions found"
        />
      </Card>

      {/* Question Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Question Details"
        size="large"
      >
        {selectedQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Text size="sm" color="#888888">Masjid</Text>
              <Text size="lg" variant="semiBold">{selectedQuestion.masjid_name}</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">Submitted By</Text>
              <Text size="md">{selectedQuestion.user_name} ({selectedQuestion.user_email})</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">Status</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedQuestion.status === 'New' ? (
                  <Badge variant="warning">New</Badge>
                ) : (
                  <Badge variant="success">Replied</Badge>
                )}
              </div>
            </div>
            <div>
              <Text size="sm" color="#888888">Title</Text>
              <Text size="lg" variant="semiBold">{selectedQuestion.title}</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">Question</Text>
              <Text size="md">{selectedQuestion.question_text}</Text>
            </div>
            {selectedQuestion.reply && (
              <>
                <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '24px' }}>
                  <Text size="sm" color="#888888">Replied By</Text>
                  <Text size="md" variant="medium">{selectedQuestion.replied_by}</Text>
                </div>
                <div>
                  <Text size="sm" color="#888888">Reply</Text>
                  <Text size="md">{selectedQuestion.reply}</Text>
                </div>
                <div>
                  <Text size="sm" color="#888888">Replied At</Text>
                  <Text size="md">{new Date(selectedQuestion.replied_at!).toLocaleString()}</Text>
                </div>
              </>
            )}
            <div>
              <Text size="sm" color="#888888">Submitted At</Text>
              <Text size="md">{new Date(selectedQuestion.submitted_at).toLocaleString()}</Text>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

