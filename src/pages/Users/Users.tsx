import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Table } from '../../components/Table/Table';
import type { TableColumn } from '../../components/Table/Table';
import { Badge } from '../../components/Badge/Badge';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Select/Select';
import { Modal } from '../../components/Modal/Modal';
import { Text } from '../../components/Text/Text';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import type { User } from '../../services/authService';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { setUsers, addUser, updateUser as updateUserState, removeUser } from '../../redux/usersSlice';

export const Users: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.users.users) || [];
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSuperAdmin, setFilterSuperAdmin] = useState('all');
  
  // Create/Edit User Modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    is_super_admin: false,
  });

  // Masjid Assignment (for user creation)
  const [allMasajids, setAllMasajids] = useState<any[]>([]);
  const [selectedMasjid, setSelectedMasjid] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Imam'>('Admin');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // View Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Available permissions
  const PERMISSIONS = [
    'can_view_questions',
    'can_answer_questions',
    'can_change_prayer_times',
    'can_create_events',
    'can_create_notifications',
    'can_view_complaints',
    'can_answer_complaints',
  ];

  useEffect(() => {
    loadUsers();
    loadMasajids();
  }, []);

  const loadMasajids = async () => {
    try {
      const masjidService = (await import('../../services/masjidService')).default;
      // Use cache to avoid rate limiting
      const data = await masjidService.getAllMasajids(true);
      setAllMasajids(data);
    } catch (error) {
      console.error('Failed to load masajids:', error);
      toast.error('Failed to load masajids for assignment');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Force refresh when explicitly loading users page
      const data = await userService.getAllUsers(false);
      dispatch(setUsers(data));
    } catch (error: any) {
      toast.error('Failed to load users');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({ name: '', email: '', password: '', phone: '', is_super_admin: false });
    setSelectedMasjid('');
    setSelectedRole('Admin');
    setSelectedPermissions([]);
    setShowUserModal(true);
  };

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  };

  const setAllPermissions = () => {
    setSelectedPermissions([...PERMISSIONS]);
  };

  const clearAllPermissions = () => {
    setSelectedPermissions([]);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: '',
      phone: user.phone || '',
    });
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    try {
      if (!userForm.name || !userForm.email || (!editingUser && !userForm.password)) {
        toast.error('Please fill in all required fields');
        return;
      }

      setLoading(true);
      if (editingUser) {
        const updated = await userService.updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          phone: userForm.phone,
        });
        dispatch(updateUserState(updated));
        toast.success('User updated successfully');
      } else {
        // Create user with optional masjid assignment in ONE step
        const createUserPayload: any = {
          name: userForm.name,
          email: userForm.email,
          password: userForm.password,
          phone: userForm.phone,
          is_super_admin: userForm.is_super_admin,
        };
        
        // Add masjid assignment if masjid is selected
        if (selectedMasjid) {
          console.log('🕌 Creating user with masjid assignment...');
          
          // Convert permissions array to object with booleans
          const permissionsObject: any = {};
          selectedPermissions.forEach(permission => {
            permissionsObject[permission] = true;
          });
          
          createUserPayload.masjid_assignment = {
            masjid_id: selectedMasjid,
            role: selectedRole.toLowerCase(), // Backend expects lowercase
            permissions: {
              can_view_complaints: permissionsObject['can_view_complaints'] || false,
              can_answer_complaints: permissionsObject['can_answer_complaints'] || false,
              can_view_questions: permissionsObject['can_view_questions'] || false,
              can_answer_questions: permissionsObject['can_answer_questions'] || false,
              can_change_prayer_times: permissionsObject['can_change_prayer_times'] || false,
              can_create_events: permissionsObject['can_create_events'] || false,
              can_create_notifications: permissionsObject['can_create_notifications'] || false,
            }
          };
          
          console.log('📤 Create user payload with masjid:', JSON.stringify(createUserPayload, null, 2));
        }
        
        const created = await userService.createUser(createUserPayload);
        console.log('✅ User created:', created.id, created.name);
        
        if (selectedMasjid) {
          toast.success(`User created and assigned to masjid as ${selectedRole}`);
        } else {
          toast.success('User created successfully');
        }
        
        // Don't dispatch here - let loadUsers() handle it with fresh data
        // dispatch(addUser(created));
      }
      setShowUserModal(false);
      
      // Clear cache and reload users to get fresh data
      console.log('🔄 Reloading users list...');
      userService.clearCache();
      await loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (user: User) => {
    try {
      setLoading(true);
      const updated = await userService.promoteToSuperAdmin(user.id);
      dispatch(updateUserState(updated));
      toast.success(`${user.name} promoted to Super Admin`);
      loadUsers();
    } catch (error: any) {
      toast.error('Failed to promote user');
    } finally {
      setLoading(false);
    }
  };

  const handleDemote = async (user: User) => {
    try {
      setLoading(true);
      const updated = await userService.demoteFromSuperAdmin(user.id);
      dispatch(updateUserState(updated));
      toast.success(`${user.name} demoted from Super Admin`);
      loadUsers();
    } catch (error: any) {
      toast.error('Failed to demote user');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      setLoading(true);
      const updated = user.is_active
        ? await userService.deactivateUser(user.id)
        : await userService.activateUser(user.id);
      dispatch(updateUserState(updated));
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (error: any) {
      toast.error('Failed to update user status');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setLoading(true);
      console.log('🗑️ Deleting user:', userToDelete.id, userToDelete.name);
      await userService.deleteUser(userToDelete.id);
      dispatch(removeUser(userToDelete.id));
      toast.success(`User ${userToDelete.name} deleted successfully`);
      setShowDeleteModal(false);
      setUserToDelete(null);
      
      // Reload users list to ensure consistency
      console.log('🔄 Reloading users list after deletion...');
      userService.clearCache();
      await loadUsers();
    } catch (error: any) {
      console.error('❌ Failed to delete user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.is_active) ||
      (filterStatus === 'inactive' && !user.is_active);
    const matchesSuperAdmin =
      filterSuperAdmin === 'all' ||
      (filterSuperAdmin === 'yes' && user.is_super_admin) ||
      (filterSuperAdmin === 'no' && !user.is_super_admin);
    return matchesSearch && matchesStatus && matchesSuperAdmin;
  });

  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      width: '20%',
      render: (value, _row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#007F5F',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600,
            }}
          >
            {value.charAt(0).toUpperCase()}
          </div>
          <Text variant="medium">{value}</Text>
        </div>
      ),
    },
    { key: 'email', label: 'Email', width: '20%' },
    { key: 'phone', label: 'Phone', width: '15%' },
    {
      key: 'is_active',
      label: 'Status',
      width: '10%',
      render: (value, _row) =>
        value ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="error">Inactive</Badge>
        ),
    },
    {
      key: 'is_super_admin',
      label: 'Super Admin',
      width: '10%',
      render: (value, _row) =>
        value ? (
          <Badge variant="primary">Yes</Badge>
        ) : (
          <Badge variant="default">No</Badge>
        ),
    },
    {
      key: 'created_at',
      label: 'Created',
      width: '10%',
      render: (value, _row) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '15%',
      render: (_value, row) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button size="small" variant="outline" onClick={() => handleViewDetails(row)}>
            View
          </Button>
          <Button size="small" variant="primary" onClick={() => handleEditUser(row)}>
            Edit
          </Button>
          {row.is_super_admin ? (
            <Button size="small" variant="danger" onClick={() => handleDemote(row)}>
              Demote
            </Button>
          ) : (
            <Button size="small" variant="success" onClick={() => handlePromote(row)}>
              Promote
            </Button>
          )}
          <Button
            size="small"
            variant={row.is_active ? 'danger' : 'success'}
            onClick={() => handleToggleActive(row)}
          >
            {row.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button size="small" variant="danger" onClick={() => handleDeleteClick(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <Card
        title="Users Management"
        subtitle={`${filteredUsers.length} users found`}
        headerAction={
          <Button onClick={handleCreateUser} icon={<span>➕</span>}>
            Create User
          </Button>
        }
        padding="none"
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #E0E0E0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px' }}>
            <Input
              placeholder="Search by name or email..."
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
            <Select
              options={[
                { value: 'all', label: 'All Roles' },
                { value: 'yes', label: 'Super Admins' },
                { value: 'no', label: 'Regular Users' },
              ]}
              value={filterSuperAdmin}
              onChange={setFilterSuperAdmin}
              placeholder="Filter by role"
            />
          </div>
        </div>
        <Table
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="No users found"
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Edit User' : 'Create New User'}
        size="large"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowUserModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} loading={loading}>
              {editingUser ? 'Update' : 'Create User'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Basic Information */}
          <div>
            <Text variant="semiBold" size="lg" style={{ marginBottom: '12px' }}>Basic Information</Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Input
                label="Name"
                value={userForm.name}
                onChange={(value) => setUserForm({ ...userForm, name: value })}
                required
                fullWidth
              />
              <Input
                label="Email"
                type="email"
                value={userForm.email}
                onChange={(value) => setUserForm({ ...userForm, email: value })}
                required
                fullWidth
              />
              {!editingUser && (
                <Input
                  label="Password"
                  type="password"
                  value={userForm.password}
                  onChange={(value) => setUserForm({ ...userForm, password: value })}
                  required
                  fullWidth
                  helperText="Minimum 6 characters"
                />
              )}
              <Input
                label="Phone"
                type="tel"
                value={userForm.phone}
                onChange={(value) => setUserForm({ ...userForm, phone: value })}
                fullWidth
              />
            </div>
          </div>

          {/* Super Admin Privilege */}
          {!editingUser && (
            <div style={{ padding: '16px', background: '#F5F5F5', borderRadius: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={userForm.is_super_admin}
                  onChange={(e) => setUserForm({ ...userForm, is_super_admin: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#007F5F' }}
                />
                <div>
                  <Text variant="semiBold" size="md">Make Super Admin</Text>
                  <Text size="sm" color="#666666">Super admins can access this admin portal and manage the entire system</Text>
                </div>
              </label>
            </div>
          )}

          {/* Masjid Assignment */}
          {!editingUser && (
            <div style={{ borderTop: '1px solid #E0E0E0', paddingTop: '20px' }}>
              <Text variant="semiBold" size="lg" style={{ marginBottom: '12px' }}>Assign to Masjid (Optional)</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Select
                  label="Select Masjid"
                  options={allMasajids.map((m) => ({ value: m.id, label: m.name }))}
                  value={selectedMasjid}
                  onChange={setSelectedMasjid}
                  placeholder="Select a masjid"
                  fullWidth
                />

                {selectedMasjid && (
                  <>
                    <Select
                      label="Role"
                      options={[
                        { value: 'Admin', label: 'Admin' },
                        { value: 'Imam', label: 'Imam' },
                      ]}
                      value={selectedRole}
                      onChange={(value) => setSelectedRole(value as 'Admin' | 'Imam')}
                      fullWidth
                    />

                    <div>
                      <Text variant="medium" size="sm" style={{ marginBottom: '8px' }}>Permissions</Text>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
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
                              background: selectedPermissions.includes(permission) ? 'rgba(0, 127, 95, 0.1)' : 'transparent',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(permission)}
                              onChange={() => togglePermission(permission)}
                              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#007F5F' }}
                            />
                            <Text size="sm">{permission.replace('can_', '').replace(/_/g, ' ').toUpperCase()}</Text>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="User Details"
        size="medium"
      >
        {selectedUser && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <Text size="sm" color="#888888">Name</Text>
              <Text size="lg" variant="semiBold">{selectedUser.name}</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">Email</Text>
              <Text size="md">{selectedUser.email}</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">Phone</Text>
              <Text size="md">{selectedUser.phone || 'N/A'}</Text>
            </div>
            <div>
              <Text size="sm" color="#888888">Status</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedUser.is_active ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="error">Inactive</Badge>
                )}
              </div>
            </div>
            <div>
              <Text size="sm" color="#888888">Role</Text>
              <div style={{ marginTop: '8px' }}>
                {selectedUser.is_super_admin ? (
                  <Badge variant="primary">Super Admin</Badge>
                ) : (
                  <Badge variant="default">Regular User</Badge>
                )}
              </div>
            </div>
            <div>
              <Text size="sm" color="#888888">Created At</Text>
              <Text size="md">{new Date(selectedUser.created_at).toLocaleString()}</Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        title="Confirm Delete User"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={loading}>
              Delete
            </Button>
          </>
        }
      >
        {userToDelete && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Text size="md">
              Are you sure you want to delete the user <strong>{userToDelete.name}</strong>?
            </Text>
            <div style={{
              padding: '16px',
              backgroundColor: '#FFF3CD',
              borderRadius: '8px',
              border: '1px solid #FFC107',
            }}>
              <Text size="sm" color="#856404">
                ⚠️ <strong>Warning:</strong> This action cannot be undone. All user data and their associations with masajids will be permanently deleted.
              </Text>
            </div>
            <div>
              <Text size="sm" color="#888888">User Details:</Text>
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Text size="sm">📧 Email: {userToDelete.email}</Text>
                <Text size="sm">📱 Phone: {userToDelete.phone || 'N/A'}</Text>
                <Text size="sm">
                  👤 Role: {userToDelete.is_super_admin ? 'Super Admin' : 'Regular User'}
                </Text>
                <Text size="sm">
                  🟢 Status: {userToDelete.is_active ? 'Active' : 'Inactive'}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

