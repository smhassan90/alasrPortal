import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Table } from '../../components/Table/Table';
import type { TableColumn } from '../../components/Table/Table';
import { Badge } from '../../components/Badge/Badge';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Select/Select';
import { Modal } from '../../components/Modal/Modal';
import { Textarea } from '../../components/Textarea/Textarea';
import { Text } from '../../components/Text/Text';
import { toast } from 'react-toastify';
import masjidService from '../../services/masjidService';
import type { Masjid, MasjidMember } from '../../services/masjidService';
import userService from '../../services/userService';
import type { User } from '../../services/authService';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setMasajids, addMasjid, updateMasjid as updateMasjidState, removeMasjid } from '../../redux/masjidsSlice';

const PERMISSIONS = [
  'can_view_questions',
  'can_answer_questions',
  'can_change_prayer_times',
  'can_create_events',
  'can_create_notifications',
  'can_view_complaints',
  'can_answer_complaints',
];

export const Masajids: React.FC = () => {
  const dispatch = useAppDispatch();
  const masajids = useAppSelector((state) => state.masajids.masajids) || [];
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Create/Edit Masjid Modal
  const [showMasjidModal, setShowMasjidModal] = useState(false);
  const [editingMasjid, setEditingMasjid] = useState<Masjid | null>(null);
  const [masjidForm, setMasjidForm] = useState({
    name: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    contact_email: '',
    contact_phone: '',
  });

  // Members Management Modal
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedMasjid, setSelectedMasjid] = useState<Masjid | null>(null);
  const [members, setMembers] = useState<MasjidMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  // Add Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberForm, setMemberForm] = useState({
    user_id: '',
    role: 'Admin' as 'Admin' | 'Imam',
    permissions: [] as string[],
  });

  useEffect(() => {
    loadMasajids();
    loadAllUsers();
  }, []);

  const loadMasajids = async () => {
    try {
      setLoading(true);
      // Force refresh when explicitly loading masajids page
      const data = await masjidService.getAllMasajids(false);
      console.log('📍 Masajids loaded from API:', data);
      console.log('📍 Number of masajids:', data?.length);
      dispatch(setMasajids(data));
      
      if (!data || data.length === 0) {
        toast.info('No masajids found in database');
      }
    } catch (error: any) {
      console.error('❌ Failed to load masajids:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const errorMessage = error.response?.status === 429 
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Failed to load masajids: ' + (error.response?.data?.message || error.message);
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      // Use cache to avoid rate limiting
      const data = await userService.getAllUsers(true);
      setAllUsers(data);
    } catch (error: any) {
      console.error('Failed to load users', error);
      
      const errorMessage = error.response?.status === 429 
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Failed to load users';
      
      toast.error(errorMessage);
    }
  };

  const handleCreateMasjid = () => {
    setEditingMasjid(null);
    setMasjidForm({
      name: '',
      location: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postal_code: '',
      contact_email: '',
      contact_phone: '',
    });
    setShowMasjidModal(true);
  };

  const handleEditMasjid = (masjid: Masjid) => {
    setEditingMasjid(masjid);
    setMasjidForm({
      name: masjid.name,
      location: masjid.location || '',
      address: masjid.address || '',
      city: masjid.city || '',
      state: masjid.state || '',
      country: masjid.country || '',
      postal_code: masjid.postal_code || '',
      contact_email: masjid.contact_email || '',
      contact_phone: masjid.contact_phone || '',
    });
    setShowMasjidModal(true);
  };

  const handleSaveMasjid = async () => {
    try {
      if (!masjidForm.name) {
        toast.error('Masjid name is required');
        return;
      }

      setLoading(true);
      if (editingMasjid) {
        const updated = await masjidService.updateMasjid(editingMasjid.id, masjidForm);
        dispatch(updateMasjidState(updated));
        toast.success('Masjid updated successfully');
      } else {
        const created = await masjidService.createMasjid(masjidForm);
        dispatch(addMasjid(created));
        toast.success('Masjid created successfully');
      }
      setShowMasjidModal(false);
      loadMasajids();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save masjid');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMasjid = async (masjid: Masjid) => {
    if (!confirm(`Are you sure you want to delete ${masjid.name}?`)) return;

    try {
      setLoading(true);
      await masjidService.deleteMasjid(masjid.id);
      dispatch(removeMasjid(masjid.id));
      toast.success('Masjid deleted successfully');
      loadMasajids();
    } catch (error: any) {
      toast.error('Failed to delete masjid');
    } finally {
      setLoading(false);
    }
  };

  const handleManageMembers = async (masjid: Masjid) => {
    setSelectedMasjid(masjid);
    try {
      setLoading(true);
      console.log('👥 Loading members for masjid:', masjid.id, masjid.name);
      const data = await masjidService.getMasjidMembers(masjid.id);
      console.log('👥 Members loaded successfully:', data.length, 'members');
      setMembers(data);
      setShowMembersModal(true);
    } catch (error: any) {
      console.error('❌ Failed to load members:', error);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error data:', error.response?.data);
      
      const errorMessage = error.response?.status === 404 
        ? 'Members endpoint not found. Please check backend API.'
        : error.response?.data?.message || 'Failed to load members';
      
      toast.error(errorMessage);
      // Still open the modal but with empty members
      setMembers([]);
      setShowMembersModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = () => {
    console.log('🔍 Opening add member modal');
    console.log('🔍 Available users:', allUsers.length);
    console.log('🔍 Users list:', allUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));
    
    setMemberForm({
      user_id: '',
      role: 'Admin',
      permissions: [],
    });
    setShowAddMemberModal(true);
  };

  const handleSaveMember = async () => {
    console.log('🔍 handleSaveMember called');
    console.log('🔍 selectedMasjid:', selectedMasjid);
    console.log('🔍 memberForm:', memberForm);
    console.log('🔍 memberForm.user_id type:', typeof memberForm.user_id);
    console.log('🔍 memberForm.user_id value:', memberForm.user_id);
    console.log('🔍 memberForm.user_id length:', memberForm.user_id?.length);
    
    if (!selectedMasjid) {
      toast.error('No masjid selected');
      return;
    }
    
    if (!memberForm.user_id || memberForm.user_id.trim() === '') {
      toast.error('Please select a user');
      console.error('❌ user_id is empty or invalid:', memberForm.user_id);
      return;
    }

    if (memberForm.permissions.length === 0) {
      toast.error('Please select at least one permission');
      return;
    }

    try {
      setLoading(true);
      console.log('🔧 Adding member with data:');
      console.log('  - Masjid ID:', selectedMasjid.id);
      console.log('  - User ID:', memberForm.user_id);
      console.log('  - Role:', memberForm.role);
      console.log('  - Permissions:', memberForm.permissions);
      console.log('  - Full memberForm:', JSON.stringify(memberForm, null, 2));
      
      await masjidService.addMemberToMasjid(selectedMasjid.id, memberForm);
      toast.success('Member added successfully');
      setShowAddMemberModal(false);
      
      // Reload members
      console.log('🔄 Reloading members for masjid:', selectedMasjid.id);
      const data = await masjidService.getMasjidMembers(selectedMasjid.id);
      console.log('🔄 Members loaded:', data);
      setMembers(data);
      console.log('✅ Members state updated');
    } catch (error: any) {
      console.error('❌ Failed to add member:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Show validation errors if available
      if (error.response?.data?.errors) {
        console.error('❌ Validation errors:', error.response.data.errors);
        const errorMessages = error.response.data.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Failed to add member';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (_memberId: string, userId: string) => {
    if (!selectedMasjid) return;
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      setLoading(true);
      await masjidService.removeMemberFromMasjid(selectedMasjid.id, userId);
      toast.success('Member removed successfully');
      const data = await masjidService.getMasjidMembers(selectedMasjid.id);
      setMembers(data);
    } catch (error: any) {
      toast.error('Failed to remove member');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setMemberForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const setAllPermissions = () => {
    setMemberForm((prev) => ({ ...prev, permissions: [...PERMISSIONS] }));
  };

  const clearAllPermissions = () => {
    setMemberForm((prev) => ({ ...prev, permissions: [] }));
  };

  const filteredMasajids = masajids.filter((masjid) => {
    const matchesSearch =
      masjid.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (masjid.city && masjid.city.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && masjid.is_active) ||
      (filterStatus === 'inactive' && !masjid.is_active);
    return matchesSearch && matchesStatus;
  });

  const columns: TableColumn[] = [
    { key: 'name', label: 'Masjid Name', width: '25%' },
    { key: 'city', label: 'City', width: '15%' },
    { key: 'state', label: 'State', width: '10%' },
    { key: 'country', label: 'Country', width: '10%' },
    {
      key: 'is_active',
      label: 'Status',
      width: '10%',
      render: (value) =>
        value ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="error">Inactive</Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      width: '10%',
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '20%',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size="small" variant="primary" onClick={() => handleEditMasjid(row)}>
            Edit
          </Button>
          <Button size="small" variant="outline" onClick={() => handleManageMembers(row)}>
            Members
          </Button>
          <Button size="small" variant="danger" onClick={() => handleDeleteMasjid(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const memberColumns: TableColumn[] = [
    { key: 'user_name', label: 'Name', width: '25%' },
    { key: 'user_email', label: 'Email', width: '25%' },
    {
      key: 'role',
      label: 'Role',
      width: '15%',
      render: (value) => <Badge variant="info">{value}</Badge>,
    },
    {
      key: 'permissions',
      label: 'Permissions',
      width: '25%',
      render: (value: string[]) => (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {value.slice(0, 2).map((p) => (
            <Badge key={p} variant="default" size="small">
              {p.replace('can_', '').replace(/_/g, ' ')}
            </Badge>
          ))}
          {value.length > 2 && (
            <Badge variant="default" size="small">
              +{value.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '10%',
      render: (_, row) => (
        <Button
          size="small"
          variant="danger"
          onClick={() => handleRemoveMember(row.id, row.user_id)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Masajids Management"
        subtitle={`${filteredMasajids.length} masajids found`}
        headerAction={
          <Button onClick={handleCreateMasjid} icon={<span>➕</span>}>
            Create Masjid
          </Button>
        }
        padding="none"
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #E0E0E0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Input
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={setSearchTerm}
              icon={<span>🔍</span>}
            />
            <Select
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={filterStatus}
              onChange={setFilterStatus}
              placeholder="Filter by status"
            />
          </div>
        </div>
        <Table
          columns={columns}
          data={filteredMasajids}
          loading={loading}
          emptyMessage="No masajids found"
        />
      </Card>

      {/* Create/Edit Masjid Modal */}
      <Modal
        isOpen={showMasjidModal}
        onClose={() => setShowMasjidModal(false)}
        title={editingMasjid ? 'Edit Masjid' : 'Create Masjid'}
        size="large"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowMasjidModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMasjid} loading={loading}>
              {editingMasjid ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <Input
              label="Masjid Name"
              value={masjidForm.name}
              onChange={(value) => setMasjidForm({ ...masjidForm, name: value })}
              required
              fullWidth
            />
          </div>
          <Textarea
            label="Location"
            value={masjidForm.location}
            onChange={(value) => setMasjidForm({ ...masjidForm, location: value })}
            rows={2}
            fullWidth
          />
          <Textarea
            label="Address"
            value={masjidForm.address}
            onChange={(value) => setMasjidForm({ ...masjidForm, address: value })}
            rows={2}
            fullWidth
          />
          <Input
            label="City"
            value={masjidForm.city}
            onChange={(value) => setMasjidForm({ ...masjidForm, city: value })}
            fullWidth
          />
          <Input
            label="State"
            value={masjidForm.state}
            onChange={(value) => setMasjidForm({ ...masjidForm, state: value })}
            fullWidth
          />
          <Input
            label="Country"
            value={masjidForm.country}
            onChange={(value) => setMasjidForm({ ...masjidForm, country: value })}
            fullWidth
          />
          <Input
            label="Postal Code"
            value={masjidForm.postal_code}
            onChange={(value) => setMasjidForm({ ...masjidForm, postal_code: value })}
            fullWidth
          />
          <Input
            label="Contact Email"
            type="email"
            value={masjidForm.contact_email}
            onChange={(value) => setMasjidForm({ ...masjidForm, contact_email: value })}
            fullWidth
          />
          <Input
            label="Contact Phone"
            type="tel"
            value={masjidForm.contact_phone}
            onChange={(value) => setMasjidForm({ ...masjidForm, contact_phone: value })}
            fullWidth
          />
        </div>
      </Modal>

      {/* Members Management Modal */}
      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`Manage Members - ${selectedMasjid?.name}`}
        size="full"
        footer={
          <Button onClick={() => setShowMembersModal(false)}>Close</Button>
        }
      >
        <div style={{ marginBottom: '16px' }}>
          <Button onClick={handleAddMember} icon={<span>➕</span>}>
            Add Member
          </Button>
        </div>
        <Table
          columns={memberColumns}
          data={members}
          loading={loading}
          emptyMessage="No members found"
        />
      </Modal>

      {/* Add Member Modal */}
      <Modal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
        title="Add Member"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember} loading={loading}>
              Add Member
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Select User"
            options={allUsers.map((u) => ({ value: u.id, label: `${u.name} (${u.email})` }))}
            value={memberForm.user_id}
            onChange={(value) => {
              console.log('🔄 User selected:', value);
              console.log('🔄 User ID type:', typeof value);
              console.log('🔄 User ID length:', value?.length);
              setMemberForm({ ...memberForm, user_id: value });
            }}
            required
            fullWidth
          />
          <Select
            label="Role"
            options={[
              { value: 'Admin', label: 'Admin' },
              { value: 'Imam', label: 'Imam' },
            ]}
            value={memberForm.role}
            onChange={(value) => setMemberForm({ ...memberForm, role: value as 'Admin' | 'Imam' })}
            required
            fullWidth
          />
          <div>
            <Text variant="medium" size="sm">Permissions</Text>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '16px' }}>
              <Button size="small" variant="outline" onClick={setAllPermissions}>
                Select All
              </Button>
              <Button size="small" variant="outline" onClick={clearAllPermissions}>
                Clear All
              </Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {PERMISSIONS.map((permission) => (
                <label
                  key={permission}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    background: memberForm.permissions.includes(permission) ? 'rgba(0, 127, 95, 0.1)' : 'transparent',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={memberForm.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#007F5F' }}
                  />
                  <Text size="sm">{permission.replace('can_', '').replace(/_/g, ' ').toUpperCase()}</Text>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

