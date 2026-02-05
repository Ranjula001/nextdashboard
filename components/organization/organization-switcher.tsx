'use client';

import { useState } from 'react';
import { useOrganization } from './organization-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Building2 } from 'lucide-react';

export function OrganizationSwitcher() {
  const { currentOrganization, organizations, switchOrganization, loading } = useOrganization();
  const [switching, setSwitching] = useState(false);

  if (loading || !currentOrganization) {
    return (
      <div className="p-4 border-b border-slate-700">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrganization.id) return;
    
    setSwitching(true);
    await switchOrganization(orgId);
    setSwitching(false);
  };

  return (
    <div className="p-4 border-b border-slate-700">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between text-left p-0 h-auto hover:bg-slate-800"
            disabled={switching}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-sm font-medium text-white truncate">
                  {currentOrganization.name}
                </p>
                <p className="text-xs text-slate-400 capitalize">
                  {currentOrganization.subscription_plan.toLowerCase()}
                </p>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="start">
          {organizations.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => handleSwitch(org.id)}
              className={`cursor-pointer ${
                org.id === currentOrganization.id ? 'bg-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <div>
                  <p className="font-medium">{org.name}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {org.subscription_plan.toLowerCase()} • {org.subscription_status.toLowerCase()}
                  </p>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}