'use client';

import { FC, useCallback, useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import Image from 'next/image';

interface AddIntegrationButtonProps {
  customer: {
    id: string;
    name: string;
  };
  onIntegrationAdded?: () => void;
}

const SUPPORTED_PLATFORMS = [
  // OAuth Platforms
  { id: 'youtube', name: 'YouTube', icon: '/icons/platforms/youtube.svg', isCustomIcon: true, type: 'oauth' },
  { id: 'facebook', name: 'Facebook', icon: '/icons/platforms/facebook.png', type: 'oauth' },
  { id: 'instagram', name: 'Instagram', icon: '/icons/platforms/instagram.png', type: 'oauth' },
  { id: 'linkedin', name: 'LinkedIn', icon: '/icons/platforms/linkedin.png', type: 'oauth' },
  { id: 'linkedin-page', name: 'LinkedIn Page', icon: '/icons/platforms/linkedin.png', type: 'oauth' },
  { id: 'x', name: 'Twitter/X', icon: '/icons/platforms/twitter.png', type: 'oauth' },
  { id: 'threads', name: 'Threads', icon: '/icons/platforms/threads.png', type: 'oauth' },
  { id: 'pinterest', name: 'Pinterest', icon: '/icons/platforms/pinterest.png', type: 'oauth' },
  { id: 'reddit', name: 'Reddit', icon: '/icons/platforms/reddit.png', type: 'oauth' },
  { id: 'tiktok', name: 'TikTok', icon: '/icons/platforms/tiktok.png', type: 'oauth' },
  { id: 'discord', name: 'Discord', icon: '/icons/platforms/discord.png', type: 'oauth' },
  { id: 'slack', name: 'Slack', icon: '/icons/platforms/slack.png', type: 'oauth' },
  { id: 'dribbble', name: 'Dribbble', icon: '/icons/platforms/dribbble.png', type: 'oauth' },
  { id: 'mastodon', name: 'Mastodon', icon: '/icons/platforms/mastodon.png', type: 'oauth' },
  { id: 'vk', name: 'VK', icon: '/icons/platforms/vk.png', type: 'oauth' },
  // Custom Auth Platforms (future implementation)
  { id: 'google-business', name: 'Google Business', icon: '/icons/platforms/google-business.png', type: 'custom', disabled: true },
  { id: 'bluesky', name: 'Bluesky', icon: '/icons/platforms/bluesky.png', type: 'custom', disabled: true },
  { id: 'telegram', name: 'Telegram', icon: '/icons/platforms/telegram.png', type: 'custom', disabled: true },
  { id: 'nostr', name: 'Nostr', icon: '/icons/platforms/nostr.png', type: 'custom', disabled: true },
  { id: 'lemmy', name: 'Lemmy', icon: '/icons/platforms/lemmy.png', type: 'custom', disabled: true },
  { id: 'wrapcast', name: 'Farcaster', icon: '/icons/platforms/farcaster.png', type: 'custom', disabled: true },
];

export const AddIntegrationButton: FC<AddIntegrationButtonProps> = ({
  customer,
  onIntegrationAdded,
}) => {
  const fetch = useFetch();
  const toaster = useToaster();
  const [showPlatforms, setShowPlatforms] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAddIntegration = useCallback(async (platform: string) => {
    try {
      setLoading(platform);
      
      // Generate OAuth URL for customer
      const response = await fetch(
        `/customer-integrations/${customer.id}/social/${platform}`,
        {
          method: 'GET',
        }
      );
      
      const data = await response.json();
      
      if (data.url) {
        // Store callback data in session storage
        sessionStorage.setItem('customerOAuthState', JSON.stringify({
          customerId: customer.id,
          platform,
          state: data.state,
        }));
        
        // Redirect to OAuth provider
        window.location.href = data.url;
      } else {
        throw new Error(data.message || 'Failed to generate OAuth URL');
      }
    } catch (error: any) {
      console.error('Error adding integration:', error);
      toaster.show(
        error.message || 'Failed to add integration. Make sure OAuth credentials are configured.',
        'warning'
      );
    } finally {
      setLoading(null);
      setShowPlatforms(false);
    }
  }, [customer.id, fetch, toaster]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPlatforms(!showPlatforms)}
        className="bg-forth text-white px-4 py-2 rounded-md hover:bg-opacity-80 transition-colors text-sm"
      >
        Add Channel
      </button>
      
      {showPlatforms && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowPlatforms(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-lg bg-primary border border-customColor6 shadow-lg z-20 max-h-[500px] overflow-y-auto">
            <div className="p-2">
              <h3 className="text-sm font-medium mb-2 px-2">Select Platform</h3>
              
              {/* OAuth Platforms */}
              <div className="mb-2">
                <p className="text-xs text-textColor opacity-50 px-2 mb-1">OAuth Platforms</p>
                {SUPPORTED_PLATFORMS.filter(p => p.type === 'oauth').map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => !platform.disabled && handleAddIntegration(platform.id)}
                  disabled={loading === platform.id || platform.disabled}
                  className="w-full px-3 py-2 text-left hover:bg-secondary rounded-md transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={platform.disabled ? 'Custom authentication not implemented yet' : ''}
                >
                  {platform.isCustomIcon ? (
                    <img
                      src={platform.icon}
                      alt={platform.name}
                      className="w-6 h-6"
                    />
                  ) : (
                    <Image
                      src={platform.icon}
                      alt={platform.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span className="text-sm">
                    {loading === platform.id ? 'Connecting...' : platform.name}
                  </span>
                </button>
                ))}
              </div>

              {/* Custom Auth Platforms */}
              <div className="border-t border-customColor6 pt-2">
                <p className="text-xs text-textColor opacity-50 px-2 mb-1">Custom Auth (Coming Soon)</p>
                {SUPPORTED_PLATFORMS.filter(p => p.type === 'custom').map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => !platform.disabled && handleAddIntegration(platform.id)}
                    disabled={loading === platform.id || platform.disabled}
                    className="w-full px-3 py-2 text-left hover:bg-secondary rounded-md transition-colors flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={platform.disabled ? 'Custom authentication not implemented yet' : ''}
                  >
                    {platform.isCustomIcon ? (
                      <img
                        src={platform.icon}
                        alt={platform.name}
                        className="w-6 h-6"
                      />
                    ) : (
                      <Image
                        src={platform.icon}
                        alt={platform.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                    )}
                    <span className="text-sm">
                      {loading === platform.id ? 'Connecting...' : platform.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};