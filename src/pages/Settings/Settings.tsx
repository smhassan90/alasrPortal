import React, { useState } from 'react';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Select } from '../../components/Select/Select';
import { toast } from 'react-toastify';
import { useAppSelector } from '../../redux/hooks';

export const Settings: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  
  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [systemSettings, setSystemSettings] = useState({
    appName: 'Al-Asr Portal',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
  });

  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      // Call API to update profile
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      // Call API to change password
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSystemSettings = async () => {
    try {
      setLoading(true);
      // Call API to update system settings
      toast.success('System settings updated successfully');
    } catch (error: any) {
      toast.error('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Card title="Super Admin Profile" subtitle="Update your personal information">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <Input
            label="Name"
            value={profileForm.name}
            onChange={(value) => setProfileForm({ ...profileForm, name: value })}
            fullWidth
          />
          <Input
            label="Email"
            type="email"
            value={profileForm.email}
            onChange={(value) => setProfileForm({ ...profileForm, email: value })}
            fullWidth
          />
          <Input
            label="Phone"
            type="tel"
            value={profileForm.phone}
            onChange={(value) => setProfileForm({ ...profileForm, phone: value })}
            fullWidth
          />
          <div>
            <Button onClick={handleUpdateProfile} loading={loading}>
              Update Profile
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Change Password" subtitle="Update your password">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <Input
            label="Current Password"
            type="password"
            value={passwordForm.currentPassword}
            onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })}
            fullWidth
          />
          <Input
            label="New Password"
            type="password"
            value={passwordForm.newPassword}
            onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })}
            helperText="Minimum 6 characters"
            fullWidth
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })}
            fullWidth
          />
          <div>
            <Button onClick={handleChangePassword} loading={loading}>
              Change Password
            </Button>
          </div>
        </div>
      </Card>

      <Card title="System Settings" subtitle="Configure system preferences">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
          <Input
            label="Application Name"
            value={systemSettings.appName}
            onChange={(value) => setSystemSettings({ ...systemSettings, appName: value })}
            fullWidth
          />
          <Select
            label="Default Timezone"
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'EST', label: 'Eastern Time (EST)' },
              { value: 'CST', label: 'Central Time (CST)' },
              { value: 'MST', label: 'Mountain Time (MST)' },
              { value: 'PST', label: 'Pacific Time (PST)' },
            ]}
            value={systemSettings.timezone}
            onChange={(value) => setSystemSettings({ ...systemSettings, timezone: value })}
            fullWidth
          />
          <Select
            label="Date Format"
            options={[
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
            ]}
            value={systemSettings.dateFormat}
            onChange={(value) => setSystemSettings({ ...systemSettings, dateFormat: value })}
            fullWidth
          />
          <div>
            <Button onClick={handleUpdateSystemSettings} loading={loading}>
              Save System Settings
            </Button>
          </div>
        </div>
      </Card>

      <Card title="Notification Preferences" subtitle="Manage your notification settings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#007F5F' }} />
            <span>Email notifications for new masajids</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#007F5F' }} />
            <span>Email notifications for system errors</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#007F5F' }} />
            <span>Daily summary emails</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
            <input type="checkbox" style={{ width: '18px', height: '18px', accentColor: '#007F5F' }} />
            <span>Weekly summary emails</span>
          </label>
        </div>
      </Card>
    </div>
  );
};

