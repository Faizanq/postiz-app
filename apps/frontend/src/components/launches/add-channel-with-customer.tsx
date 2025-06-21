'use client';

import { useModals } from '@mantine/modals';
import { FC, useCallback, useState, useEffect } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import { useRouter } from 'next/navigation';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useT } from '@gitroom/react/translation/get.transation.service.client';
import { TopTitle } from '@gitroom/frontend/components/launches/helpers/top.title.component';
import { Button } from '@gitroom/react/form/button';
import { useCustomersService, Customer } from '@gitroom/frontend/services/customers.service';
import { CustomerModal } from '@gitroom/frontend/components/launches/customer.modal';
import { AddProviderComponent } from './add.provider.component';

export const CustomerSelectionModal: FC<{
  onSelectCustomer: (customer: Customer) => void;
  onCancel: () => void;
}> = ({ onSelectCustomer, onCancel }) => {
  const t = useT();
  const customersService = useCustomersService();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const data = await customersService.getCustomers({ status: 'ACTIVE' });
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCustomers();
  }, []);

  if (loading) {
    return <div className="text-center p-8">Loading customers...</div>;
  }

  return (
    <div className="rounded-[4px] border border-customColor6 bg-sixth px-[16px] pb-[16px] relative">
      <TopTitle title={t('select_customer', 'Select Customer')} />
      <button
        onClick={onCancel}
        className="outline-none absolute end-[20px] top-[20px] mantine-UnstyledButton-root mantine-ActionIcon-root hover:bg-tableBorder cursor-pointer"
        type="button"
      >
        <svg
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
        >
          <path
            d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
      <div className="pt-[20px]">
        <p className="text-sm text-textColor opacity-60 mb-4">
          {t('select_customer_for_channel', 'Select which customer this channel will belong to:')}
        </p>
        <div className="flex flex-col gap-2">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => onSelectCustomer(customer)}
              className="p-4 rounded-lg border border-customColor6 hover:border-customColor5 bg-secondary hover:bg-third transition-all text-left"
            >
              <div className="font-medium">{customer.name}</div>
              <div className="text-sm text-textColor opacity-60">{customer.email}</div>
              <div className="text-xs text-textColor opacity-40 mt-1">
                Plan: {customer.planType}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const useAddProviderWithCustomer = (update?: () => void) => {
  const modal = useModals();
  const fetch = useFetch();
  const router = useRouter();
  const customersService = useCustomersService();
  
  return useCallback(async () => {
    // First check if there are any customers
    const customers = await customersService.getCustomers({ status: 'ACTIVE' });
    
    if (customers.length === 0) {
      // No customers, show regular add provider flow
      const data = await (await fetch('/integrations')).json();
      modal.openModal({
        title: '',
        withCloseButton: false,
        classNames: {
          modal: 'bg-transparent text-textColor',
        },
        children: <AddProviderComponent update={update} {...data} />,
        size: 'auto',
      });
      return;
    }
    
    if (customers.length === 1) {
      // Only one customer, skip selection and store it
      sessionStorage.setItem('selectedCustomerId', customers[0].id);
      const data = await (await fetch('/integrations')).json();
      modal.openModal({
        title: '',
        withCloseButton: false,
        classNames: {
          modal: 'bg-transparent text-textColor',
        },
        children: <AddProviderComponent update={update} {...data} />,
        size: 'auto',
      });
      return;
    }
    
    // Multiple customers, show selection modal
    modal.openModal({
      title: '',
      withCloseButton: false,
      classNames: {
        modal: 'bg-transparent text-textColor',
      },
      children: (
        <CustomerSelectionModal
          onSelectCustomer={async (customer) => {
            // Store selected customer
            sessionStorage.setItem('selectedCustomerId', customer.id);
            modal.closeAll();
            
            // Then show provider selection
            const data = await (await fetch('/integrations')).json();
            modal.openModal({
              title: '',
              withCloseButton: false,
              classNames: {
                modal: 'bg-transparent text-textColor',
              },
              children: <AddProviderComponent update={update} {...data} />,
              size: 'auto',
            });
          }}
          onCancel={() => modal.closeAll()}
        />
      ),
      size: 'sm',
    });
  }, [update]);
};