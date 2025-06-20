'use client';

import { FC, useState } from 'react';
import { useModals } from '@mantine/modals';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useCustomersService, PlatformConfig } from '@gitroom/frontend/services/customers.service';
import { Input } from '@gitroom/react/form/input';
import { Button } from '@gitroom/react/form/button';
import Image from 'next/image';

interface ConfigurePlatformModalProps {
  customerId: string;
  platform: PlatformConfig;
  onUpdate: () => void;
}

export const ConfigurePlatformModal: FC<ConfigurePlatformModalProps> = ({
  customerId,
  platform,
  onUpdate,
}) => {
  const modals = useModals();
  const toaster = useToaster();
  const customersService = useCustomersService();
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [formData, setFormData] = useState({
    clientId: platform.clientId || '',
    clientSecret: platform.clientSecret || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      await customersService.updatePlatformConfig(customerId, platform.platform, {
        clientId: formData.clientId,
        clientSecret: formData.clientSecret,
        isEnabled: true,
      });
      
      toaster.show('Platform credentials updated successfully', 'success');
      modals.closeAll();
      onUpdate();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update platform credentials';
      toaster.show(errorMessage, 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.clientId || !formData.clientSecret) {
      toaster.show('Please enter both Client ID and Client Secret', 'warning');
      return;
    }

    try {
      setLoading(true);
      const result = await customersService.testPlatformCredentials(
        customerId,
        platform.platform,
        {
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
        }
      );

      console.log('Test result:', result);
      if (result.isValid) {
        toaster.show('Connection test successful! Credentials are valid.', 'success');
      } else {
        const errorMessage = result.error || 'Invalid credentials';
        console.log('Showing error toast:', errorMessage);
        toaster.show(errorMessage, 'warning');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Connection test failed';
      toaster.show(errorMessage, 'warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex items-center gap-4 p-4 bg-sixth rounded-lg">
        {platform.platform === 'youtube' ? (
          <img
            src="/icons/platforms/youtube.svg"
            alt={platform.platform}
            className="w-12 h-12"
          />
        ) : (
          <Image
            src={`/icons/platforms/${platform.platform}.png`}
            alt={platform.platform}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div>
          <h3 className="text-lg font-medium capitalize">{platform.platform}</h3>
          <p className="text-sm text-gray-400">
            Configure OAuth credentials for this platform
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-sm text-yellow-500">
            <strong>Important:</strong> These credentials are for your OAuth application. 
            You can create them in the {platform.platform} developer console.
          </p>
        </div>

        <Input
          label="Client ID / App ID"
          value={formData.clientId}
          onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
          placeholder={`Enter ${platform.platform} Client ID`}
          required
          disableForm={true}
        />

        <div className="relative">
          <Input
            label="Client Secret / App Secret"
            type={showSecret ? 'text' : 'password'}
            value={formData.clientSecret}
            onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
            placeholder={`Enter ${platform.platform} Client Secret`}
            required
            disableForm={true}
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-white"
          >
            {showSecret ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>

        {platform.lastError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400">
              <strong>Last Error:</strong> {platform.lastError}
            </p>
          </div>
        )}

        {platform.isConnected && platform.connectedAt && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <p className="text-sm text-green-400">
              <strong>Connected:</strong> {new Date(platform.connectedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={handleTestConnection}
          loading={loading}
          disabled={!formData.clientId || !formData.clientSecret}
        >
          Test Connection
        </Button>
        <Button type="submit" loading={loading} className="flex-1">
          Save Credentials
        </Button>
      </div>

      <div className="text-xs text-gray-400 space-y-1">
        <p>• Credentials are encrypted and stored securely</p>
        <p>• You can update these credentials anytime</p>
        <p>• Changes will apply to new connections only</p>
      </div>
    </form>
  );
};