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
import { Textarea } from '../../components/Textarea/Textarea';
import { Button } from '../../components/Button/Button';
import { toast } from 'react-toastify';
import questionService from '../../services/questionService';
import type { Question } from '../../services/questionService';
import { StatsGrid } from '../../layouts';
import { colors } from '../../theme';
import { IconCheck, IconClock, IconHelp } from '../../components/Icons';

export const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
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

  const getMasjidName = (question: Question) => question.masjid?.name || '—';

  const openQuestionModal = (question: Question) => {
    setSelectedQuestion(question);
    setReplyText(question.reply || '');
    setShowDetailsModal(true);
  };

  const closeQuestionModal = () => {
    setShowDetailsModal(false);
    setSelectedQuestion(null);
    setReplyText('');
  };

  const handleDeleteQuestion = async (question: Question) => {
    const preview = question.question.slice(0, 60) + (question.question.length > 60 ? '…' : '');
    if (!confirm(`Are you sure you want to delete this question: "${preview}"?`)) return;

    try {
      setLoading(true);
      await questionService.deleteQuestion(question.id);
      setQuestions((prev) => prev.filter((q) => q.id !== question.id));
      toast.success('Question deleted successfully');
      loadQuestions();
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to delete question';
      toast.error(errorMsg);
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedQuestion) return;

    const trimmed = replyText.trim();
    if (trimmed.length < 10) {
      toast.error('Reply must be at least 10 characters');
      return;
    }

    try {
      setReplying(true);
      const updated = await questionService.replyToQuestion(selectedQuestion.id, trimmed);
      setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      setSelectedQuestion(updated);
      setReplyText(updated.reply || trimmed);
      toast.success(selectedQuestion.status === 'replied' ? 'Reply updated successfully' : 'Reply sent successfully');
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        error.message ||
        'Failed to send reply';
      toast.error(errorMsg);
    } finally {
      setReplying(false);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const masjidName = getMasjidName(question).toLowerCase();
    const matchesSearch =
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      masjidName.includes(searchTerm.toLowerCase()) ||
      (question.title && question.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'new' && question.status === 'new') ||
      (filterStatus === 'replied' && question.status === 'replied');
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: questions.length,
    pending: questions.filter((q) => q.status === 'new').length,
    replied: questions.filter((q) => q.status === 'replied').length,
  };

  const columns: TableColumn[] = [
    {
      key: 'question',
      label: 'Question',
      width: '36%',
      render: (value) => {
        const text = value || '';
        return text.length > 120 ? `${text.slice(0, 120)}…` : text;
      },
    },
    {
      key: 'masjid',
      label: 'Masjid',
      width: '18%',
      render: (_, row: Question) => getMasjidName(row),
    },
    {
      key: 'status',
      label: 'Status',
      width: '10%',
      render: (value) =>
        value === 'new' ? (
          <Badge variant="warning">New</Badge>
        ) : (
          <Badge variant="success">Replied</Badge>
        ),
    },
    {
      key: 'user_name',
      label: 'Asked By',
      width: '14%',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '22%',
      render: (_, row: Question) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size="small" variant="outline" onClick={() => openQuestionModal(row)}>
            View
          </Button>
          <Button size="small" variant="primary" onClick={() => openQuestionModal(row)}>
            {row.status === 'replied' ? 'Edit Reply' : 'Reply'}
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
          icon={<IconHelp />}
          color={colors.info}
        />
        <StatCard
          title="Pending Questions"
          value={stats.pending}
          icon={<IconClock />}
          color={colors.warning}
        />
        <StatCard
          title="Replied Questions"
          value={stats.replied}
          icon={<IconCheck />}
          color={colors.success}
        />
      </StatsGrid>

      <Card
        title="Questions Overview"
        subtitle={`${filteredQuestions.length} questions found`}
        padding="none"
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #E0E0E0' }}>
          <div className="filterBarTwo">
            <Input
              placeholder="Search by question, user, or masjid..."
              value={searchTerm}
              onChange={setSearchTerm}
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

      <Modal
        isOpen={showDetailsModal}
        onClose={closeQuestionModal}
        title="Question Details"
        size="large"
        footer={
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={closeQuestionModal} disabled={replying}>
              Close
            </Button>
            <Button variant="primary" onClick={handleReply} disabled={replying || loading}>
              {replying
                ? 'Sending...'
                : selectedQuestion?.status === 'replied'
                  ? 'Update Reply'
                  : 'Send Reply'}
            </Button>
          </div>
        }
      >
        {selectedQuestion && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Text size="sm" color="#888888">
                Masjid
              </Text>
              <Text size="lg" variant="semiBold">
                {getMasjidName(selectedQuestion)}
              </Text>
            </div>
            <div>
              <Text size="sm" color="#888888">
                Asked By
              </Text>
              <Text size="md">
                {selectedQuestion.user_name}
                {selectedQuestion.user_email ? ` (${selectedQuestion.user_email})` : ''}
              </Text>
            </div>
            <div>
              <Text size="sm" color="#888888">
                Status
              </Text>
              <div style={{ marginTop: '8px' }}>
                {selectedQuestion.status === 'new' ? (
                  <Badge variant="warning">New</Badge>
                ) : (
                  <Badge variant="success">Replied</Badge>
                )}
              </div>
            </div>
            {selectedQuestion.title && (
              <div>
                <Text size="sm" color="#888888">
                  Title
                </Text>
                <Text size="lg" variant="semiBold">
                  {selectedQuestion.title}
                </Text>
              </div>
            )}
            <div>
              <Text size="sm" color="#888888">
                Question
              </Text>
              <Text size="md">{selectedQuestion.question}</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">
                Submitted At
              </Text>
              <Text size="md">{new Date(selectedQuestion.created_at).toLocaleString()}</Text>
            </div>

            {selectedQuestion.status === 'replied' &&
              (selectedQuestion.replied_by_name || selectedQuestion.replier?.name) && (
                <div>
                  <Text size="sm" color="#888888">
                    Previously Replied By
                  </Text>
                  <Text size="md" variant="medium">
                    {selectedQuestion.replied_by_name || selectedQuestion.replier?.name}
                    {selectedQuestion.replied_at
                      ? ` · ${new Date(selectedQuestion.replied_at).toLocaleString()}`
                      : ''}
                  </Text>
                </div>
              )}

            <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '24px' }}>
              <Textarea
                label="Your Reply"
                placeholder="Write your reply to this question (minimum 10 characters)..."
                value={replyText}
                onChange={setReplyText}
                rows={5}
                required
                fullWidth
                disabled={replying}
                helperText={`${replyText.trim().length}/10 characters minimum`}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};
