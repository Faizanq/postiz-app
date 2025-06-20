import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useCallback, useMemo } from 'react';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  planType: 'STARTER' | 'SOCIAL_COMBO' | 'PROFESSIONAL' | 'ENTERPRISE';
  status: 'ACTIVE' | 'INACTIVE';
  onboardedAt: string;
  lastActiveAt?: string;
  deactivatedAt?: string;
  notes?: string;
  tags: string[];
  integrations: any[];
  platformConfigs: PlatformConfig[];
  statusHistory?: StatusHistory[];
  planHistory?: PlanHistory[];
  _count?: {
    integrations: number;
  };
}

export interface PlatformConfig {
  id: string;
  customerId: string;
  platform: string;
  isEnabled: boolean;
  isActive: boolean;
  clientId?: string;
  clientSecret?: string;
  isConnected: boolean;
  connectedAt?: string;
  lastError?: string;
  pausedAt?: string;
  pausedReason?: string;
  resumedAt?: string;
}

export interface StatusHistory {
  id: string;
  fromStatus?: string;
  toStatus: string;
  reason?: string;
  changedBy: string;
  createdAt: string;
}

export interface PlanHistory {
  id: string;
  fromPlan?: string;
  toPlan: string;
  reason?: string;
  changedBy: string;
  createdAt: string;
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  planType: 'STARTER' | 'SOCIAL_COMBO' | 'PROFESSIONAL' | 'ENTERPRISE';
  notes?: string;
  tags?: string[];
  enabledPlatforms?: string[];
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ChangePlanDto {
  newPlan: 'STARTER' | 'SOCIAL_COMBO' | 'PROFESSIONAL' | 'ENTERPRISE';
  reason?: string;
}

export interface UpdatePlatformConfigDto {
  clientId?: string;
  clientSecret?: string;
  isEnabled?: boolean;
}

export interface PausePlatformDto {
  reason?: string;
  resumeDate?: string;
}

export const useCustomersService = () => {
  const fetch = useFetch();

  const getCustomers = useCallback(async (filters?: { search?: string; status?: string; planType?: string }): Promise<Customer[]> => {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.planType) params.append('planType', filters.planType);
    
    const response = await fetch(`/customers${params.toString() ? `?${params.toString()}` : ''}`);
    return response.json();
  }, [fetch]);

  const getCustomer = useCallback(async (id: string): Promise<Customer> => {
    const response = await fetch(`/customers/${id}`);
    return response.json();
  }, [fetch]);

  const createCustomer = useCallback(async (data: CreateCustomerDto): Promise<Customer> => {
    const response = await fetch('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }, [fetch]);

  const updateCustomer = useCallback(async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    const response = await fetch(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }, [fetch]);

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    await fetch(`/customers/${id}`, {
      method: 'DELETE',
    });
  }, [fetch]);

  const activateCustomer = useCallback(async (id: string): Promise<Customer> => {
    const response = await fetch(`/customers/${id}/activate`, {
      method: 'POST',
    });
    return response.json();
  }, [fetch]);

  const deactivateCustomer = useCallback(async (id: string): Promise<Customer> => {
    const response = await fetch(`/customers/${id}/deactivate`, {
      method: 'POST',
    });
    return response.json();
  }, [fetch]);

  const changePlan = useCallback(async (id: string, data: ChangePlanDto): Promise<Customer> => {
    const response = await fetch(`/customers/${id}/plan`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }, [fetch]);

  const getPlatformConfigs = useCallback(async (id: string): Promise<PlatformConfig[]> => {
    const response = await fetch(`/customers/${id}/platforms`);
    return response.json();
  }, [fetch]);

  const updatePlatformConfig = useCallback(async (customerId: string, platform: string, data: UpdatePlatformConfigDto): Promise<PlatformConfig> => {
    const response = await fetch(`/customers/${customerId}/platforms/${platform}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }, [fetch]);

  const pausePlatform = useCallback(async (customerId: string, platform: string, data: PausePlatformDto): Promise<PlatformConfig> => {
    const response = await fetch(`/customers/${customerId}/platforms/${platform}/pause`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }, [fetch]);

  const resumePlatform = useCallback(async (customerId: string, platform: string): Promise<PlatformConfig> => {
    const response = await fetch(`/customers/${customerId}/platforms/${platform}/resume`, {
      method: 'POST',
    });
    return response.json();
  }, [fetch]);

  const getCustomerHistory = useCallback(async (id: string): Promise<{ statusHistory: StatusHistory[]; planHistory: PlanHistory[] }> => {
    const response = await fetch(`/customers/${id}/history`);
    return response.json();
  }, [fetch]);

  const testPlatformCredentials = useCallback(async (
    customerId: string,
    platform: string,
    credentials: { clientId: string; clientSecret: string }
  ) => {
    const response = await fetch(`/customers/${customerId}/platforms/${platform}/test`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.json();
  }, [fetch]);

  return useMemo(() => ({
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    activateCustomer,
    deactivateCustomer,
    changePlan,
    getPlatformConfigs,
    updatePlatformConfig,
    pausePlatform,
    resumePlatform,
    getCustomerHistory,
    testPlatformCredentials,
  }), [
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    activateCustomer,
    deactivateCustomer,
    changePlan,
    getPlatformConfigs,
    updatePlatformConfig,
    pausePlatform,
    resumePlatform,
    getCustomerHistory,
    testPlatformCredentials,
  ]);
};