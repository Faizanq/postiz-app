'use client';

import { FC, useEffect, useState } from 'react';
import { Select } from '@gitroom/react/form/select';
import { useCustomersService, Customer } from '@gitroom/frontend/services/customers.service';
import { useSearchParams, useRouter } from 'next/navigation';

interface CustomerSelectorProps {
  onCustomerChange?: (customerId: string | null) => void;
  className?: string;
}

export const CustomerSelector: FC<CustomerSelectorProps> = ({ onCustomerChange, className = '' }) => {
  const customersService = useCustomersService();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customersService.getCustomers({
          status: 'ACTIVE',
        });
        setCustomers(data);
        
        // Get customer ID from URL params
        const customerIdFromUrl = searchParams.get('customerId');
        if (customerIdFromUrl) {
          setSelectedCustomerId(customerIdFromUrl);
        }
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCustomers();
  }, [searchParams]);

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    if (customerId) {
      params.set('customerId', customerId);
    } else {
      params.delete('customerId');
    }
    router.push(`?${params.toString()}`);
    
    // Call callback if provided
    if (onCustomerChange) {
      onCustomerChange(customerId || null);
    }
  };

  if (loading) {
    return null;
  }

  // Don't show selector if no customers
  if (customers.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedCustomerId}
      onChange={handleCustomerChange}
      className={`min-w-[200px] ${className}`}
      label=""
      name="customerSelector"
      disableForm={true}
      hideErrors={true}
    >
      <option value="">All Organizations</option>
      {customers.map((customer) => (
        <option key={customer.id} value={customer.id}>
          {customer.name}
        </option>
      ))}
    </Select>
  );
};