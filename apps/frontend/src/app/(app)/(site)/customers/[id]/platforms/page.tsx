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
import { AddIntegrationButton } from '@gitroom/frontend/components/customers/add-integration.button';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export default function CustomerPlatformsPage() {
  const params = useParams();
  const router = useRouter();
  const toaster = useToaster();
  const modals = useModals();
  const customersService = useCustomersService();
  const fetch = useFetch();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [platforms, setPlatforms] = useState<PlatformConfig[]>([]);
  const [integrations, setIntegrations] = useState<any[]>([]);
  
  const customerId = params.id as string;

  useEffect(() => {
    let isActive = true;
    
    const loadCustomerAndPlatforms = async () => {
      if (!isActive || !customerId) return;
      
      try {
        setLoading(true);
        const [customerData, platformsData, integrationsResponse] = await Promise.all([
          customersService.getCustomer(customerId),
          customersService.getPlatformConfigs(customerId),
          fetch(`/customer-integrations/${customerId}/integrations`)
        ]);
        
        let integrationsData = [];
        if (integrationsResponse.ok) {
          const data = await integrationsResponse.json();
          integrationsData = Array.isArray(data) ? data : [];
        }
        
        if (isActive) {
          setCustomer(customerData);
          setPlatforms(platformsData);
          setIntegrations(integrationsData);
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
        <p className="text-textColor opacity-60">Customer not found</p>
        <Link href="/customers" className="text-blue-500 hover:underline mt-4 inline-block">
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
            className="text-textColor opacity-60 hover:text-textColor hover:opacity-100 mb-2 inline-flex items-center gap-2 transition-all"
          >
            ← Back to Customers
          </Link>
          <h2 className="text-2xl font-semibold text-textColor">{customer.name} - Platform Management</h2>
        </div>
      </div>

      {/* Platform Statistics - Moved to top */}
      <div className="bg-sixth rounded-xl p-6 shadow-lg border border-customColor6">
        <h3 className="text-lg font-medium mb-4 text-textColor">Platform Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-green-500">
              {platforms.filter(p => p.isEnabled).length}
            </div>
            <div className="text-sm text-textColor opacity-60 mt-1">Enabled</div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-blue-500">
              {platforms.filter(p => p.isConnected).length}
            </div>
            <div className="text-sm text-textColor opacity-60 mt-1">Connected</div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-orange-500">
              {platforms.filter(p => p.pausedAt).length}
            </div>
            <div className="text-sm text-textColor opacity-60 mt-1">Paused</div>
          </div>
          <div className="text-center p-4 bg-secondary rounded-lg">
            <div className="text-3xl font-bold text-textColor">
              {platforms.length}
            </div>
            <div className="text-sm text-textColor opacity-60 mt-1">Total</div>
          </div>
        </div>
      </div>

      {/* Connected Integrations - Moved up */}
      <div className="bg-sixth rounded-xl p-6 shadow-lg border border-customColor6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-textColor">Connected Integrations</h3>
          <AddIntegrationButton 
            customer={customer} 
            onIntegrationAdded={() => window.location.reload()} 
          />
        </div>
        
        {!integrations || integrations.length === 0 ? (
          <div className="text-center py-12 bg-secondary rounded-lg">
            <p className="text-textColor opacity-60">
              No integrations connected yet. Click "Add Channel" to connect a social media account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations?.map((integration) => (
              <div
                key={integration.id}
                className="p-4 rounded-lg border border-customColor6 bg-secondary hover:bg-third transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  {integration.picture ? (
                    <img
                      src={integration.picture}
                      alt={integration.name}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-forth flex items-center justify-center text-white">
                      {integration.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-textColor">{integration.name}</h4>
                    <p className="text-sm text-textColor opacity-60 capitalize">
                      {integration.provider}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={clsx(
                    'font-medium',
                    integration.disabled ? 'text-red-500' : 'text-green-500'
                  )}>
                    {integration.disabled ? 'Disabled' : 'Active'}
                  </span>
                  <span className="text-textColor opacity-60">
                    {new Date(integration.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Platforms - Enhanced styling */}
      <div className="bg-sixth rounded-xl p-6 shadow-lg border border-customColor6 dark:bg-customColor6/30 dark:border-customColor5/30">
        <h3 className="text-lg font-medium mb-4 text-textColor">Available Platforms</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((config) => (
            <div
              key={config.platform}
              className={clsx(
                'p-5 rounded-xl border-2 transition-all duration-200',
                config.isEnabled
                  ? 'border-green-500 bg-white dark:bg-green-950/30 dark:border-green-500/50 hover:shadow-lg dark:hover:shadow-green-500/10'
                  : 'border-gray-200 dark:border-customColor5/30 bg-white dark:bg-customColor6/50 hover:border-gray-300 dark:hover:border-customColor5/50 hover:shadow-md dark:hover:bg-customColor6/70'
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-customColor5/20">
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
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 capitalize text-base">
                      {config.platform}
                    </h4>
                    <p className={clsx(
                      'text-sm font-medium',
                      config.isConnected 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-500 dark:text-gray-300'
                    )}>
                      {config.isConnected ? '● Connected' : '○ Not connected'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePlatform(config.platform, config.isEnabled)}
                  className={clsx(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 shadow-inner',
                    config.isEnabled 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-300 dark:bg-customColor5/30 hover:bg-gray-400 dark:hover:bg-customColor5/40'
                  )}
                  aria-label={config.isEnabled ? 'Disable platform' : 'Enable platform'}
                >
                  <span
                    className={clsx(
                      'inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200',
                      config.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              {config.isEnabled && (
                <div className="pt-4 border-t border-gray-200 dark:border-customColor5/40 space-y-3">
                  {config.isConnected ? (
                    <>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 dark:text-gray-300">Connected</span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium">
                          {new Date(config.connectedAt!).toLocaleDateString()}
                        </span>
                      </div>
                      {config.pausedAt ? (
                        <div className="space-y-2">
                          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800/50">
                            <p className="text-xs text-orange-700 dark:text-orange-300 font-medium">
                              ⚠️ Paused: {config.pausedReason || 'Manual pause'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleResumePlatform(config.platform)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                          >
                            Resume Platform
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePausePlatform(config.platform)}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                        >
                          Pause Platform
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="p-3 rounded-lg bg-gray-50 dark:bg-customColor6/50 border border-gray-200 dark:border-customColor5/30">
                        <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
                          Configure OAuth credentials to enable connection
                        </p>
                      </div>
                      <button
                        onClick={() => handleConfigurePlatform(config)}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-200"
                      >
                        Configure Credentials
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}