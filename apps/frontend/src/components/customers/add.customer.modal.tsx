'use client';

import { FC, useState, useEffect } from 'react';
import { useModals } from '@mantine/modals';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useCustomersService, CreateCustomerDto } from '@gitroom/frontend/services/customers.service';
import { Input } from '@gitroom/react/form/input';
import { Textarea } from '@gitroom/react/form/textarea';
import { Select } from '@gitroom/react/form/select';
import { Button } from '@gitroom/react/form/button';
import { Checkbox } from '@gitroom/react/form/checkbox';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

interface Platform {
  identifier: string;
  name: string;
  toolTip?: string;
  isExternal?: boolean;
  isWeb3?: boolean;
}

export const AddCustomerModal: FC = () => {
  const modals = useModals();
  const toaster = useToaster();
  const customersService = useCustomersService();
  const fetch = useFetch();
  const [loading, setLoading] = useState(false);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [formData, setFormData] = useState<CreateCustomerDto & { tagsInput?: string }>({
    name: '',
    email: '',
    phone: '',
    website: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    planType: 'STARTER',
    notes: '',
    tags: [],
    tagsInput: '',
    enabledPlatforms: [],
  });

  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const response = await fetch('/integrations');
        const data = await response.json();
        setPlatforms(data.social || []);
      } catch (error) {
        console.error('Failed to load platforms:', error);
      }
    };
    loadPlatforms();
  }, [fetch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toaster.show('Customer name is required', 'warning');
      return;
    }

    try {
      setLoading(true);
      
      // Process tags from input string
      const processedTags = formData.tagsInput
        ? formData.tagsInput
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];
      
      // Create the final data object without tagsInput
      const { tagsInput, ...customerData } = formData;
      const finalData = {
        ...customerData,
        tags: processedTags
      };
      
      console.log('Creating customer with data:', finalData);
      console.log('Enabled platforms:', finalData.enabledPlatforms);
      console.log('Processed tags:', processedTags);
      
      await customersService.createCustomer(finalData);
      toaster.show('Customer created successfully', 'success');
      modals.closeAll();
      window.location.reload();
    } catch (error) {
      console.error('Failed to create customer:', error);
      toaster.show('Failed to create customer', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof (CreateCustomerDto & { tagsInput?: string }), value: any) => {
    console.log(`Updating field ${field} to:`, value);
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      console.log('New form data:', newData);
      return newData;
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Customer Name *"
          name="name"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="ACME Corp"
          required
          disableForm={true}
        />
        
        <Select
          label="Plan Type"
          name="planType"
          value={formData.planType}
          onChange={(e) => updateField('planType', e.target.value)}
          disableForm={true}
        >
          <option value="STARTER">Starter</option>
          <option value="SOCIAL_COMBO">Social Combo</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="ENTERPRISE">Enterprise</option>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="contact@company.com"
          disableForm={true}
        />
        
        <Input
          label="Phone"
          name="phone"
          value={formData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          placeholder="+1234567890"
          disableForm={true}
        />
      </div>

      <Input
        label="Website"
        name="website"
        value={formData.website || ''}
        onChange={(e) => updateField('website', e.target.value)}
        placeholder="https://example.com"
        disableForm={true}
      />

      <h3 className="text-lg font-semibold mt-4">Contact Person</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Contact Name"
          name="contactName"
          value={formData.contactName || ''}
          onChange={(e) => updateField('contactName', e.target.value)}
          placeholder="John Doe"
          disableForm={true}
        />
        
        <Input
          label="Contact Email"
          name="contactEmail"
          type="email"
          value={formData.contactEmail || ''}
          onChange={(e) => updateField('contactEmail', e.target.value)}
          placeholder="john@company.com"
          disableForm={true}
        />
      </div>

      <Input
        label="Contact Phone"
        name="contactPhone"
        value={formData.contactPhone || ''}
        onChange={(e) => updateField('contactPhone', e.target.value)}
        placeholder="+1234567890"
        disableForm={true}
      />

      <div>
        <label className="text-sm text-textColor opacity-60 mb-2 block">Enabled Platforms</label>
        <div className="grid grid-cols-2 gap-2">
          {platforms?.map((platform: Platform) => (
            <Checkbox
              key={platform.identifier}
              checked={(formData.enabledPlatforms || []).includes(platform.identifier)}
              onChange={(event) => {
                const checked = event.target.value;
                console.log(`Platform ${platform.identifier} changed to:`, checked);
                
                setFormData((prev) => {
                  const current = prev.enabledPlatforms || [];
                  console.log('Current platforms before update:', current);
                  
                  let newPlatforms;
                  if (checked) {
                    // Only add if not already present
                    if (!current.includes(platform.identifier)) {
                      newPlatforms = [...current, platform.identifier];
                      console.log('New platforms after adding:', newPlatforms);
                    } else {
                      newPlatforms = current;
                    }
                  } else {
                    newPlatforms = current.filter(p => p !== platform.identifier);
                    console.log('New platforms after removing:', newPlatforms);
                  }
                  
                  return { ...prev, enabledPlatforms: newPlatforms };
                });
              }}
              label={platform.name}
            />
          ))}
        </div>
      </div>

      <Input
        label="Tags (comma-separated)"
        name="tagsInput"
        value={formData.tagsInput || ''}
        onChange={(e) => updateField('tagsInput', e.target.value)}
        placeholder="agency, premium, active"
        disableForm={true}
      />

      <Textarea
        label="Notes"
        name="notes"
        value={formData.notes || ''}
        onChange={(e) => updateField('notes', e.target.value)}
        placeholder="Additional notes about the customer..."
        disableForm={true}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button secondary onClick={() => modals.closeAll()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Customer'}
        </Button>
      </div>
    </form>
  );
};