'use client';

import { FC, useState } from 'react';
import { useModals } from '@mantine/modals';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useCustomersService, Customer, UpdateCustomerDto } from '@gitroom/frontend/services/customers.service';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Button } from '@gitroom/react/form/button';

interface EditCustomerModalProps {
  customer: Customer;
  onUpdate: () => void;
}

export const EditCustomerModal: FC<EditCustomerModalProps> = ({ customer, onUpdate }) => {
  const modals = useModals();
  const toaster = useToaster();
  const customersService = useCustomersService();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateCustomerDto>({
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    website: customer.website || '',
    contactName: customer.contactName || '',
    contactEmail: customer.contactEmail || '',
    contactPhone: customer.contactPhone || '',
    notes: customer.notes || '',
    tags: customer.tags || [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toaster.show('Customer name is required', 'warning');
      return;
    }

    try {
      setLoading(true);
      await customersService.updateCustomer(customer.id, formData);
      toaster.show('Customer updated successfully', 'success');
      onUpdate();
      modals.closeAll();
    } catch (error) {
      toaster.show('Failed to update customer', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof UpdateCustomerDto, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Customer Name *"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="ACME Corp"
          required
          disableForm={true}
        />
        
        <div className="flex flex-col">
          <label className="text-sm text-gray-400 mb-1">Plan Type</label>
          <div className="bg-sixth rounded px-3 py-2 text-gray-400">
            {customer.planType.replace('_', ' ')}
          </div>
          <span className="text-xs text-gray-500 mt-1">
            Use "Change Plan" to modify
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="contact@company.com"
          disableForm={true}
        />
        
        <Input
          label="Phone"
          value={formData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+1234567890"
          disableForm={true}
        />
      </div>

      <Input
        label="Website"
        value={formData.website || ''}
        onChange={(e) => updateField('website', e.target.value)}
        placeholder="https://example.com"
        disableForm={true}
      />

      <h3 className="text-lg font-semibold mt-4">Contact Person</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Contact Name"
          value={formData.contactName || ''}
          onChange={(e) => updateField('contactName', e.target.value)}
          placeholder="John Doe"
          disableForm={true}
        />
        
        <Input
          label="Contact Email"
          type="email"
          value={formData.contactEmail || ''}
          onChange={(e) => updateField('contactEmail', e.target.value)}
          placeholder="john@company.com"
          disableForm={true}
        />
      </div>

      <Input
        label="Contact Phone"
        value={formData.contactPhone || ''}
        onChange={(e) => updateField('contactPhone', e.target.value)}
        placeholder="+1234567890"
        disableForm={true}
      />

      <Input
        label="Tags (comma-separated)"
        value={(formData.tags || []).join(', ')}
        onChange={(e) =>
          updateField(
            'tags',
            e.target.value
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          )
        }
        placeholder="agency, premium, active"
        disableForm={true}
      />

      <Textarea
        label="Notes"
        value={formData.notes || ''}
        onChange={(e) => updateField('notes', e.target.value)}
        placeholder="Additional notes about the customer..."
        rows={3}
        disableForm={true}
      />

      <div className="bg-[#0B101B] rounded p-4 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-gray-500">Status:</span>{' '}
            <span className={customer.status === 'ACTIVE' ? 'text-green-400' : 'text-red-400'}>
              {customer.status}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Onboarded:</span>{' '}
            {new Date(customer.onboardedAt).toLocaleDateString()}
          </div>
          {customer.lastActiveAt && (
            <div>
              <span className="text-gray-500">Last Active:</span>{' '}
              {new Date(customer.lastActiveAt).toLocaleDateString()}
            </div>
          )}
          {customer.deactivatedAt && (
            <div>
              <span className="text-gray-500">Deactivated:</span>{' '}
              {new Date(customer.deactivatedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={() => modals.closeAll()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Updating...' : 'Update Customer'}
        </Button>
      </div>
    </form>
  );
};