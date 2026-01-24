import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../../layouts';
import { Card } from '../../components/Card/Card';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import { Text } from '../../components/Text/Text';
import { toast } from 'react-toastify';
import configService from '../../services/configService';
import { colors } from '../../theme';

export const AppConfig: React.FC = () => {
  const [maxFavoritesLimit, setMaxFavoritesLimit] = useState<string>('5');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setFetching(true);
      setError('');
      const config = await configService.getAppConfig();
      setMaxFavoritesLimit(config.maxFavoritesLimit.toString());
    } catch (error: any) {
      console.error('Failed to load app config:', error);
      const errorMessage = error.response?.data?.message || 'Failed to load app configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setFetching(false);
    }
  };

  const validateInput = (value: string): boolean => {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return false;
    }
    if (num < 1 || num > 20) {
      setError('Maximum favorites limit must be between 1 and 20');
      return false;
    }
    setError('');
    return true;
  };

  const handleInputChange = (value: string) => {
    setMaxFavoritesLimit(value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSave = async () => {
    // Validate input
    if (!validateInput(maxFavoritesLimit)) {
      return;
    }

    const limit = parseInt(maxFavoritesLimit, 10);

    try {
      setLoading(true);
      setError('');
      await configService.updateAppConfig({ maxFavoritesLimit: limit });
      toast.success('App configuration saved successfully');
    } catch (error: any) {
      console.error('Failed to save app config:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save app configuration';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <Card
        title="App Configuration"
        subtitle="Manage application-wide settings"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
          {fetching ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <Text size="md" color={colors.textLight}>
                Loading configuration...
              </Text>
            </div>
          ) : (
            <div>
              <Input
                label="Maximum Favorites Limit"
                type="number"
                value={maxFavoritesLimit}
                onChange={handleInputChange}
                required
                fullWidth
                disabled={loading}
                error={error}
                min={1}
                max={20}
                helperText="Enter a number between 1 and 20"
              />
              <div style={{ marginTop: '8px' }}>
                <Text size="sm" color={colors.textLight}>
                  Maximum number of masjids a user can add to their favorites list
                </Text>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: colors.backgroundLight,
                border: `1px solid ${colors.error}`,
                borderRadius: '8px',
              }}
            >
              <Text size="sm" color={colors.error}>
                {error}
              </Text>
            </div>
          )}

          <div>
            <Button
              onClick={handleSave}
              loading={loading}
              disabled={fetching || loading}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  );
};

