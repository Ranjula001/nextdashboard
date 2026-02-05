import { OrganizationSetupForm } from '@/components/organization/organization-setup-form';

export default function OrganizationSetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Welcome to 9TAILED ERP SYSTEMS</h1>
          <p className="text-slate-600 mt-2">Set up your business to get started</p>
        </div>
        <OrganizationSetupForm />
      </div>
    </div>
  );
}