'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCustomersService, Customer, PlatformConfig } from '@gitroom/frontend/services/customers.service';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { Button } from '@gitroom/react/form/button';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useModals } from '@mantine/modals';
import clsx from 'clsx';
import Link from 'next/link';
import Image from 'next/image';
import { ConfigurePlatformModal } from '@gitroom/frontend/components/customers/configure-platform.modal';

export default function CustomerPlatformsPage() {
  const params = useParams();
  const router = useRouter();
  const toaster = useToaster();
  const modals = useModals();
  const customersService = useCustomersService();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  
  const customerId = params.id as string;

  useEffect(() => {
    let isActive = true;
    
    const loadCustomerAndPlatforms = async () => {
      if (!isActive || !customerId) return;
      
      try {
        setLoading(true);
        const [customerData, platformsData] = await Promise.all([
          customersService.getCustomer(customerId),
          customersService.getPlatformConfigs(customerId)
        ]);
        
        if (isActive) {
          setCustomer(customerData);
          setPlatforms(platformsData);
        }
      } catch (error) {
        if (isActive) {
          toaster.show('Failed to load customer data', 'warning');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };
    
    loadCustomerAndPlatforms();
    
    return () => {
      isActive = false;
    };
  }, [customerId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTogglePlatform = async (platform: string, currentStatus: boolean) => {
    try {
      await customersService.updatePlatformConfig(customerId, platform, {
        isEnabled: !currentStatus
      });
      toaster.show(`Platform ${!currentStatus ? 'enabled' : 'disabled'} successfully`, 'success');
      // Reload data
      const [customerData, platformsData] = await Promise.all([
        customersService.getCustomer(customerId),
        customersService.getPlatformConfigs(customerId)
      ]);
      setCustomer(customerData);
      setPlatforms(platformsData);
    } catch (error) {
      toaster.show('Failed to update platform', 'warning');
    }
  };

  const handlePausePlatform = async (platform: string) => {
    try {
      await customersService.pausePlatform(customerId, platform, {
        reason: 'Manual pause'
      });
      toaster.show('Platform paused successfully', 'success');
      // Reload data
      const [customerData, platformsData] = await Promise.all([
        customersService.getCustomer(customerId),
        customersService.getPlatformConfigs(customerId)
      ]);
      setCustomer(customerData);
      setPlatforms(platformsData);
    } catch (error) {
      toaster.show('Failed to pause platform', 'warning');
    }
  };

  const handleResumePlatform = async (platform: string) => {
    try {
      await customersService.resumePlatform(customerId, platform);
      toaster.show('Platform resumed successfully', 'success');
      // Reload data
      const [customerData, platformsData] = await Promise.all([
        customersService.getCustomer(customerId),
        customersService.getPlatformConfigs(customerId)
      ]);
      setCustomer(customerData);
      setPlatforms(platformsData);
    } catch (error) {
      toaster.show('Failed to resume platform', 'warning');
    }
  };

  const handleConfigurePlatform = (platform: PlatformConfig) => {
    modals.openModal({
      title: `Configure ${platform.platform}`,
      children: (
        <ConfigurePlatformModal
          customerId={customerId}
          platform={platform}
          onUpdate={async () => {
            // Reload data after configuration
            const platformsData = await customersService.getPlatformConfigs(customerId);
            setPlatforms(platformsData);
          }}
        />
      ),
      size: 'lg',
    });
  };


  if (loading) {
    return <LoadingComponent />;
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Customer not found</p>
        <Link href="/customers" className="text-blue-400 hover:underline mt-4 inline-block">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link 
            href="/customers" 
            className="text-gray-400 hover:text-white mb-2 inline-flex items-center gap-2"
          >
            ← Back to Customers
          </Link>
          <h2 className="text-xl font-semibold">{customer.name} - Platform Management</h2>
        </div>
      </div>

      <div className="bg-sixth rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Available Platforms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((config) => (
            <div
              key={config.platform}
              className={clsx(
                'p-4 rounded-lg border-2 transition-all',
                config.isEnabled
                  ? 'border-green-600 bg-green-900/20'
                  : 'border-gray-600 bg-gray-800/20'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {config.platform === 'youtube' ? (
                    <img
                      src="/icons/platforms/youtube.svg"
                      alt={config.platform}
                      className="w-8 h-8"
                    />
                  ) : (
                    <Image
                      src={`/icons/platforms/${config.platform}.png`}
                      alt={config.platform}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                  )}
                  <div>
                    <h4 className="font-medium capitalize">{config.platform}</h4>
                    <p className="text-sm text-gray-400">
                      {config.isConnected ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePlatform(config.platform, config.isEnabled)}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    config.isEnabled ? 'bg-green-600' : 'bg-gray-600'
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      config.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {config.isEnabled && (
                <div className="space-y-2">
                  {config.isConnected ? (
                    <>
                      <p className="text-xs text-gray-400">
                        Connected: {new Date(config.connectedAt!).toLocaleDateString()}
                      </p>
                      {config.pausedAt ? (
                        <div>
                          <p className="text-xs text-orange-400">
                            Paused: {config.pausedReason || 'No reason provided'}
                          </p>
                          <Button
                            variant="secondary"
                            onClick={() => handleResumePlatform(config.platform)}
                            className="mt-2 w-full text-sm"
                          >
                            Resume
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="small"
                          variant="secondary"
                          onClick={() => handlePausePlatform(config.platform)}
                          className="mt-2 w-full"
                        >
                          Pause
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400">
                        Configure client credentials to connect
                      </p>
                      <Button
                        size="small"
                        variant="primary"
                        onClick={() => handleConfigurePlatform(config)}
                        className="mt-2 w-full"
                      >
                        Configure
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-sixth rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Platform Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {platforms.filter(p => p.isEnabled).length}
            </div>
            <div className="text-sm text-gray-400">Enabled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {platforms.filter(p => p.isConnected).length}
            </div>
            <div className="text-sm text-gray-400">Connected</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">
              {platforms.filter(p => p.pausedAt).length}
            </div>
            <div className="text-sm text-gray-400">Paused</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">
              {platforms.length}
            </div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}