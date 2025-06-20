'use client';

import { CustomersTable } from '@gitroom/frontend/components/customers/customers.table';
import { AddCustomerModal } from '@gitroom/frontend/components/customers/add.customer.modal';
import { Button } from '@gitroom/react/form/button';
import { useModals } from '@mantine/modals';

export default function CustomersPage() {
  const modals = useModals();

  const handleAddCustomer = () => {
    modals.openModal({
      title: 'Add New Customer',
      children: <AddCustomerModal />,
      size: 'xl',
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button onClick={handleAddCustomer}>Add Customer</Button>
      </div>
      <CustomersTable />
    </div>
  );
}