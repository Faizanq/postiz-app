'use client';

import { FC, useState } from 'react';
import { useModals } from '@mantine/modals';
import { useToaster } from '@gitroom/react/toaster/toaster';
import { useCustomersService, Customer, ChangePlanDto } from '@gitroom/frontend/services/customers.service';
import { Select } from '@gitroom/react/form/select';
import { Textarea } from '@gitroom/react/form/textarea';
import { Button } from '@gitroom/react/form/button';
import clsx from 'clsx';

interface ChangePlanModalProps {
  customer: Customer;
  onUpdate: () => void;
}

const PLAN_FEATURES = {
  STARTER: {
    name: 'Starter',
    color: 'text-blue-400',
    features: ['3 social accounts', 'Basic analytics', '10 posts/month'],
  },
  SOCIAL_COMBO: {
    name: 'Social Combo',
    color: 'text-green-400',
    features: ['10 social accounts', 'Advanced analytics', '100 posts/month', 'Team collaboration'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    color: 'text-purple-400',
    features: ['25 social accounts', 'Full analytics', 'Unlimited posts', 'Priority support'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    color: 'text-orange-400',
    features: ['Unlimited accounts', 'Custom features', 'Dedicated support', 'SLA'],
  },
};

export const ChangePlanModal: FC<ChangePlanModalProps> = ({ customer, onUpdate }) => {
  const modals = useModals();
  const toaster = useToaster();
  const customersService = useCustomersService();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ChangePlanDto>({
    newPlan: customer.planType,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPlan === customer.planType) {
      toaster.show('Please select a different plan', 'warning');
      return;
    }

    try {
      setLoading(true);
      await customersService.changePlan(customer.id, formData);
      toaster.show('Plan changed successfully', 'success');
      onUpdate();
      modals.closeAll();
    } catch (error) {
      toaster.show('Failed to change plan', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const isUpgrade = () => {
    const plans = ['STARTER', 'SOCIAL_COMBO', 'PROFESSIONAL', 'ENTERPRISE'];
    const currentIndex = plans.indexOf(customer.planType);
    const newIndex = plans.indexOf(formData.newPlan);
    return newIndex > currentIndex;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <h2 className="text-xl font-bold mb-4">Change Plan - {customer.name}</h2>
      
      <div className="bg-secondary rounded p-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-textColor opacity-50">Current Plan:</span>
            <h3 className={clsx('text-lg font-semibold', PLAN_FEATURES[customer.planType].color)}>
              {PLAN_FEATURES[customer.planType].name}
            </h3>
          </div>
          <div className="text-right">
            <span className="text-sm text-textColor opacity-50">Customer Since:</span>
            <div className="text-sm">{new Date(customer.onboardedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      <Select
        label="New Plan"
        name="newPlan"
        value={formData.newPlan}
        onChange={(e) => setFormData({ ...formData, newPlan: e.target.value as any })}
        disableForm={true}
      >
        {Object.entries(PLAN_FEATURES).map(([value, info]) => (
          <option key={value} value={value} disabled={value === customer.planType}>
            {info.name} {value === customer.planType && '(Current)'}
          </option>
        ))}
      </Select>

      {formData.newPlan !== customer.planType && (
        <div className="bg-secondary rounded p-4">
          <h4 className={clsx('font-semibold mb-2', PLAN_FEATURES[formData.newPlan].color)}>
            {PLAN_FEATURES[formData.newPlan].name} Features:
          </h4>
          <ul className="list-disc list-inside text-sm text-textColor opacity-60 space-y-1">
            {PLAN_FEATURES[formData.newPlan].features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
          
          {isUpgrade() ? (
            <div className="mt-3 text-green-500 font-medium">
              ⬆️ Upgrade
            </div>
          ) : (
            <div className="mt-3 text-orange-500 font-medium">
              ⬇️ Downgrade
            </div>
          )}
        </div>
      )}

      <Textarea
        label="Reason for Change"
        name="reason"
        value={formData.reason || ''}
        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        placeholder="Optional: Provide a reason for this plan change..."
        disableForm={true}
      />

      {customer.planHistory && customer.planHistory.length > 0 && (
        <div className="bg-secondary rounded p-4">
          <h4 className="font-semibold mb-2">Plan History</h4>
          <div className="space-y-2 text-sm">
            {customer.planHistory.slice(0, 3).map((history) => (
              <div key={history.id} className="flex justify-between text-textColor opacity-60">
                <span>
                  {history.fromPlan || 'Initial'} → {history.toPlan}
                </span>
                <span>{new Date(history.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button secondary onClick={() => modals.closeAll()} disabled={loading}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={loading || formData.newPlan === customer.planType}
        >
          {loading ? 'Changing...' : 'Change Plan'}
        </Button>
      </div>
    </form>
  );
};