'use client';

import { FC, useState, useRef, useEffect } from 'react';
import { Customer } from '@gitroom/frontend/services/customers.service';
import { Button } from '@gitroom/react/form/button';
import { useModals } from '@mantine/modals';
import { EditCustomerModal } from './edit.customer.modal';
import { PlatformConfigModal } from './platform.config.modal';
import { ChangePlanModal } from './change.plan.modal';
import clsx from 'clsx';
import Link from 'next/link';
import Image from 'next/image';

interface CustomerRowProps {
  customer: Customer;
  onDelete: (customer: Customer) => void;
  onStatusChange: (customer: Customer) => void;
  onUpdate: () => void;
}

export const CustomerRow: FC<CustomerRowProps> = ({
  customer,
  onDelete,
  onStatusChange,
  onUpdate,
}) => {
  const modals = useModals();
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'top' | 'bottom'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // If less than 300px space below but more space above, show on top
      if (spaceBelow < 300 && spaceAbove > spaceBelow) {
        setDropdownPosition('top');
      } else {
        setDropdownPosition('bottom');
      }
    }
    setShowDropdown(!showDropdown);
  };

  const handleEdit = () => {
    modals.openModal({
      title: 'Edit Customer',
      children: <EditCustomerModal customer={customer} onUpdate={onUpdate} />,
      size: 'xl',
    });
  };

  const handlePlatformConfig = () => {
    modals.openModal({
      title: 'Platform Configurations',
      children: <PlatformConfigModal customer={customer} onUpdate={onUpdate} />,
      size: 'xl',
    });
  };

  const handleChangePlan = () => {
    modals.openModal({
      title: 'Change Plan',
      children: <ChangePlanModal customer={customer} onUpdate={onUpdate} />,
      size: 'md',
    });
  };

  const getPlanColor = (planType: string) => {
    switch (planType) {
      case 'STARTER':
        return 'text-blue-500';
      case 'SOCIAL_COMBO':
        return 'text-green-500';
      case 'PROFESSIONAL':
        return 'text-purple-500';
      case 'ENTERPRISE':
        return 'text-orange-500';
      default:
        return 'text-textColor opacity-60';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'text-green-500' : 'text-red-500';
  };

  return (
    <tr className="border-b border-tableBorder hover:bg-secondary transition-colors">
      <td className="p-4">
        <div>
          <div className="font-medium">{customer.name}</div>
          {customer.email && (
            <div className="text-sm text-textColor opacity-60">{customer.email}</div>
          )}
        </div>
      </td>
      <td className="p-4">
        <div className="text-sm">
          {customer.contactName && <div>{customer.contactName}</div>}
          {customer.contactEmail && (
            <div className="text-textColor opacity-60">{customer.contactEmail}</div>
          )}
          {customer.contactPhone && (
            <div className="text-textColor opacity-60">{customer.contactPhone}</div>
          )}
        </div>
      </td>
      <td className="p-4">
        <span className={clsx('font-medium', getPlanColor(customer.planType))}>
          {customer.planType.replace('_', ' ')}
        </span>
      </td>
      <td className="p-4">
        <span className={clsx('font-medium', getStatusColor(customer.status))}>
          {customer.status}
        </span>
      </td>
      <td className="p-4">
        <div className="flex gap-2 items-center">
          {customer.platformConfigs?.map((config) => (
            <div
              key={config.platform}
              className={clsx(
                'relative',
                config.isConnected ? 'opacity-100' : 'opacity-40'
              )}
              title={`${config.platform}: ${
                config.isConnected ? 'Connected' : 'Not connected'
              }`}
            >
              {config.platform === 'youtube' ? (
                <img
                  src="/icons/platforms/youtube.svg"
                  alt={config.platform}
                  className="w-6 h-6"
                />
              ) : (
                <Image
                  src={`/icons/platforms/${config.platform}.png`}
                  alt={config.platform}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              )}
            </div>
          ))}
        </div>
      </td>
      <td className="p-4 text-sm text-textColor opacity-60">
        {new Date(customer.onboardedAt).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}
      </td>
      <td className="p-4">
        <div className="relative" ref={dropdownRef}>
          <button
            ref={buttonRef}
            onClick={handleToggleDropdown}
            className="p-2 rounded-md hover:bg-third transition-colors"
            aria-label="Actions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
          {showDropdown && (
            <div 
              className={clsx(
                "absolute right-0 w-48 rounded-md bg-primary border border-customColor6 shadow-lg z-[100]",
                dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
              )}>
              <button
                onClick={() => {
                  handleEdit();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Customer
              </button>
              <Link
                href={`/customers/${customer.id}/platforms`}
                onClick={() => setShowDropdown(false)}
                className="w-full px-4 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2 block"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
                Manage Platforms
              </Link>
              <button
                onClick={() => {
                  handleChangePlan();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                Change Plan
              </button>
              <button
                onClick={() => {
                  onStatusChange(customer);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-left hover:bg-secondary transition-colors flex items-center gap-2"
              >
                {customer.status === 'ACTIVE' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <rect x="9" y="9" width="6" height="6"></rect>
                    </svg>
                    Deactivate
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Activate
                  </>
                )}
              </button>
              <hr className="border-customColor6 my-1" />
              <button
                onClick={() => {
                  onDelete(customer);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                Delete Customer
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
};