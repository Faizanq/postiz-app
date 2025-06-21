'use client';

import { FC, useState, useEffect } from 'react';
import { useModals } from '@mantine/modals';
import { useToaster } from '@gitroom/react/toaster/toaster';
import {
  useCustomersService,
  Customer,
  PlatformConfig,
  UpdatePlatformConfigDto,
} from '@gitroom/frontend/services/customers.service';
import { Input } from '@gitroom/react/form/input';
import { Button } from '@gitroom/react/form/button';
import { Checkbox } from '@gitroom/react/form/checkbox';
import clsx from 'clsx';

interface PlatformConfigModalProps {
  customer: Customer;
  onUpdate: () => void;
}

interface PlatformFormData {
  [platform: string]: UpdatePlatformConfigDto & { platform: string };
}

const PLATFORM_INFO: Record<string, { name: string; icon: string; color: string }> = {
  facebook: { name: 'Facebook', icon: '📘', color: 'text-blue-500' },
  instagram: { name: 'Instagram', icon: '📷', color: 'text-pink-500' },
  twitter: { name: 'Twitter', icon: '🐦', color: 'text-sky-500' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: 'text-blue-600' },
  youtube: { name: 'YouTube', icon: '📺', color: 'text-red-500' },
  tiktok: { name: 'TikTok', icon: '🎵', color: 'text-gray-400' },
  pinterest: { name: 'Pinterest', icon: '📌', color: 'text-red-600' },
  reddit: { name: 'Reddit', icon: '🤖', color: 'text-orange-500' },
};

export const PlatformConfigModal: FC<PlatformConfigModalProps> = ({ customer, onUpdate }) => {
  const modals = useModals();
  const toaster = useToaster();
  const customersService = useCustomersService();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<PlatformConfig[]>([]);
  const [formData, setFormData] = useState<PlatformFormData>({});
  const [savingPlatform, setSavingPlatform] = useState<string | null>(null);

  useEffect(() => {
    loadPlatformConfigs();
  }, [customer.id]);

  const loadPlatformConfigs = async () => {
    try {
      const data = await customersService.getPlatformConfigs(customer.id);
      setConfigs(data);
      
      // Initialize form data
      const initialData: PlatformFormData = {};
      data.forEach((config) => {
        initialData[config.platform] = {
          platform: config.platform,
          clientId: config.clientId || '',
          clientSecret: config.clientSecret || '',
          isEnabled: config.isEnabled,
        };
      });
      setFormData(initialData);
    } catch (error) {
      toaster.show('Failed to load platform configurations', 'warning');
    }
  };

  const updatePlatformField = (platform: string, field: keyof UpdatePlatformConfigDto, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const savePlatformConfig = async (platform: string) => {
    const data = formData[platform];
    if (!data) return;

    try {
      setSavingPlatform(platform);
      await customersService.updatePlatformConfig(customer.id, platform, {
        clientId: data.clientId,
        clientSecret: data.clientSecret,
        isEnabled: data.isEnabled,
      });
      toaster.show(`${PLATFORM_INFO[platform].name} configuration saved`, 'success');
      await loadPlatformConfigs();
    } catch (error) {
      toaster.show(`Failed to save ${PLATFORM_INFO[platform].name} configuration`, 'warning');
    } finally {
      setSavingPlatform(null);
    }
  };

  const handlePausePlatform = async (platform: string) => {
    try {
      await customersService.pausePlatform(customer.id, platform, {
        reason: 'Paused via configuration modal',
      });
      toaster.show(`${PLATFORM_INFO[platform].name} paused`, 'success');
      await loadPlatformConfigs();
    } catch (error) {
      toaster.show(`Failed to pause ${PLATFORM_INFO[platform].name}`, 'warning');
    }
  };

  const handleResumePlatform = async (platform: string) => {
    try {
      await customersService.resumePlatform(customer.id, platform);
      toaster.show(`${PLATFORM_INFO[platform].name} resumed`, 'success');
      await loadPlatformConfigs();
    } catch (error) {
      toaster.show(`Failed to resume ${PLATFORM_INFO[platform].name}`, 'warning');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4">Platform Configurations - {customer.name}</h2>
      
      <div className="grid gap-4">
        {configs.map((config) => {
          const platformInfo = PLATFORM_INFO[config.platform] || {
            name: config.platform,
            icon: '🌐',
            color: 'text-textColor opacity-60',
          };
          const data = formData[config.platform] || {} as UpdatePlatformConfigDto & { platform: string };

          return (
            <div
              key={config.platform}
              className={clsx(
                'border border-tableBorder rounded-lg p-4',
                config.isConnected && 'border-green-600',
                !config.isEnabled && 'opacity-60'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platformInfo.icon}</span>
                  <div>
                    <h3 className={clsx('text-lg font-semibold', platformInfo.color)}>
                      {platformInfo.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span
                        className={clsx(
                          'font-medium',
                          config.isConnected ? 'text-green-500' : 'text-textColor opacity-60'
                        )}
                      >
                        {config.isConnected ? 'Connected' : 'Not Connected'}
                      </span>
                      {config.isActive && (
                        <span className="text-green-500">• Active</span>
                      )}
                      {config.pausedAt && (
                        <span className="text-orange-500">• Paused</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <Checkbox
                  checked={data.isEnabled ?? config.isEnabled}
                  onChange={(checked) => updatePlatformField(config.platform, 'isEnabled', checked)}
                  label="Enabled"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <Input
                  label="Client ID"
                  name="clientId"
                  value={data.clientId ?? ''}
                  onChange={(e) => updatePlatformField(config.platform, 'clientId', e.target.value)}
                  placeholder="Enter client ID"
                  type="password"
                  disableForm={true}
                />
                
                <Input
                  label="Client Secret"
                  name="clientSecret"
                  value={data.clientSecret ?? ''}
                  onChange={(e) => updatePlatformField(config.platform, 'clientSecret', e.target.value)}
                  placeholder="Enter client secret"
                  type="password"
                  disableForm={true}
                />
              </div>

              {config.lastError && (
                <div className="bg-red-500/10 text-red-500 p-2 rounded text-sm mb-4">
                  Error: {config.lastError}
                </div>
              )}

              {config.pausedAt && config.pausedReason && (
                <div className="bg-orange-500/10 text-orange-500 p-2 rounded text-sm mb-4">
                  Paused: {config.pausedReason}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  className="text-sm px-3 py-1"
                  onClick={() => savePlatformConfig(config.platform)}
                  disabled={savingPlatform === config.platform}
                >
                  {savingPlatform === config.platform ? 'Saving...' : 'Save Config'}
                </Button>
                
                {config.isActive && !config.pausedAt && (
                  <Button
                    className="text-sm px-3 py-1"
                    secondary
                    onClick={() => handlePausePlatform(config.platform)}
                  >
                    Pause
                  </Button>
                )}
                
                {config.pausedAt && (
                  <Button
                    className="text-sm px-3 py-1"
                    secondary
                    onClick={() => handleResumePlatform(config.platform)}
                  >
                    Resume
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {configs.length === 0 && (
        <div className="text-center py-8 text-textColor opacity-60">
          No platforms configured for this customer yet.
        </div>
      )}

      <div className="flex justify-end mt-4">
        <Button secondary onClick={() => modals.closeAll()}>
          Close
        </Button>
      </div>
    </div>
  );
};