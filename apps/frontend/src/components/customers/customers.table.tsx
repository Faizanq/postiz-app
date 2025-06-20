'use client';

import { FC, useCallback, useEffect, useState } from 'react';
import { useCustomersService, Customer } from '@gitroom/frontend/services/customers.service';
import { CustomerRow } from './customer.row';
import { Input } from '@gitroom/react/form/input';
import { Select } from '@gitroom/react/form/select';
import { LoadingComponent } from '@gitroom/frontend/components/layout/loading';
import { deleteDialog } from '@gitroom/react/helpers/delete.dialog';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useDebounce } from 'use-debounce';

export const CustomersTable: FC = () => {
  const toaster = useToaster();
  const customersService = useCustomersService();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await customersService.getCustomers({
        search: debouncedSearch,
        status: statusFilter,
        planType: planFilter,
      });
      setCustomers(data);
    } catch (error) {
      toaster.show('Failed to load customers', 'warning');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, planFilter]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleDelete = async (customer: Customer) => {
    if (await deleteDialog(`Are you sure you want to delete ${customer.name}?`)) {
      try {
        await customersService.deleteCustomer(customer.id);
        toaster.show('Customer deleted successfully', 'success');
        loadCustomers();
      } catch (error) {
        toaster.show('Failed to delete customer', 'warning');
      }
    }
  };

  const handleStatusChange = async (customer: Customer) => {
    try {
      if (customer.status === 'ACTIVE') {
        await customersService.deactivateCustomer(customer.id);
        toaster.show('Customer deactivated', 'success');
      } else {
        await customersService.activateCustomer(customer.id);
        toaster.show('Customer activated', 'success');
      }
      loadCustomers();
    } catch (error) {
      toaster.show('Failed to update customer status', 'warning');
    }
  };

  if (loading && customers.length === 0) {
    return <LoadingComponent />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px]"
          label=""
          name="search"
          disableForm={true}
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="min-w-[150px]"
          label=""
          name="statusFilter"
          disableForm={true}
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
        <Select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="min-w-[150px]"
          label=""
          name="planFilter"
          disableForm={true}
        >
          <option value="">All Plans</option>
          <option value="STARTER">Starter</option>
          <option value="SOCIAL_COMBO">Social Combo</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ENTERPRISE">Enterprise</option>
        </Select>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {debouncedSearch || statusFilter || planFilter
            ? 'No customers found matching your filters'
            : 'No customers yet. Click "Add Customer" to get started.'}
        </div>
      ) : (
        <div className="bg-sixth rounded-lg overflow-visible">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#172034]">
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Contact</th>
                <th className="text-left p-4">Plan</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Platforms</th>
                <th className="text-left p-4">Onboarded</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onUpdate={loadCustomers}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};