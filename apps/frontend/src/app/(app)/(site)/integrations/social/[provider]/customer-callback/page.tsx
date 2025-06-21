'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';

export default function CustomerOAuthCallbackPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetch = useFetch();
  const toaster = useToaster();
  
  const provider = params.provider as string;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  useEffect(() => {
    const handleCallback = async () => {
      if (error) {
        toaster.show(`OAuth error: ${error}`, 'warning');
        router.push('/customers');
        return;
      }

      if (!code || !state) {
        toaster.show('Invalid OAuth callback parameters', 'warning');
        router.push('/customers');
        return;
      }

      // Get customer data from session storage
      const storedData = sessionStorage.getItem('customerOAuthState');
      if (!storedData) {
        toaster.show('OAuth session expired', 'warning');
        router.push('/customers');
        return;
      }

      const { customerId, platform, state: storedState } = JSON.parse(storedData);
      
      if (state !== storedState || platform !== provider) {
        toaster.show('Invalid OAuth state', 'warning');
        router.push('/customers');
        return;
      }

      try {
        // Handle the OAuth callback
        const response = await fetch(
          `/customer-integrations/${customerId}/social/${provider}/callback`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code, state }),
          }
        );

        const data = await response.json();
        
        if (response.ok && data.success) {
          toaster.show('Integration connected successfully!', 'success');
          sessionStorage.removeItem('customerOAuthState');
          router.push(`/customers/${customerId}/platforms`);
        } else {
          throw new Error(data.message || 'Failed to complete OAuth flow');
        }
      } catch (err: any) {
        console.error('OAuth callback error:', err);
        toaster.show(err.message || 'Failed to connect integration', 'warning');
        router.push(`/customers/${customerId}/platforms`);
      }
    };

    handleCallback();
  }, [code, state, error, provider, router, fetch, toaster]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <LoadingComponent />
        <p className="mt-4 text-textColor opacity-60">
          Completing integration setup...
        </p>
      </div>
    </div>
  );
}