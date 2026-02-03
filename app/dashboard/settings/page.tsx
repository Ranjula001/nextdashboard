import { getSettings, updateSettings } from '@/lib/db/settings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from 'next/navigation';
import { Settings as SettingsIcon } from 'lucide-react';

export default async function SettingsPage() {
  const settings = await getSettings();

  const handleUpdateSettings = async (formData: FormData) => {
    'use server';

    const businessName = formData.get('business_name') as string;
    const currency = formData.get('currency') as string;
    const timezone = formData.get('timezone') as string;
    const taxRate = formData.get('tax_rate')
      ? parseFloat(formData.get('tax_rate') as string)
      : 0;

    await updateSettings({
      business_name: businessName,
      currency,
      timezone,
      tax_rate: taxRate,
    });

    redirect('/dashboard/settings');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-slate-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">Manage your business configuration</p>
        </div>
      </div>

      {/* Settings Form */}
      <form action={handleUpdateSettings} className="space-y-8">
        {/* Business Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Business Information
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name" className="text-sm font-medium text-slate-900">
                Business Name
              </Label>
              <Input
                id="business_name"
                type="text"
                name="business_name"
                defaultValue={settings.business_name}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="currency" className="text-sm font-medium text-slate-900">
                  Currency
                </Label>
                <Input
                  id="currency"
                  type="text"
                  name="currency"
                  defaultValue={settings.currency}
                  maxLength={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="timezone" className="text-sm font-medium text-slate-900">
                  Timezone
                </Label>
                <Input
                  id="timezone"
                  type="text"
                  name="timezone"
                  defaultValue={settings.timezone}
                  placeholder="Asia/Colombo"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tax_rate" className="text-sm font-medium text-slate-900">
                Tax Rate (%)
              </Label>
              <Input
                id="tax_rate"
                type="number"
                name="tax_rate"
                defaultValue={settings.tax_rate || 0}
                min="0"
                max="100"
                step="0.01"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
            Save Settings
          </Button>
          <Button
            type="reset"
            variant="outline"
            className="flex-1"
          >
            Reset
          </Button>
        </div>
      </form>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Tip</h3>
          <p className="text-sm text-blue-800">
            Default rates are used when creating new rooms. You can override these for
            individual rooms.
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-green-900 mb-2">Note</h3>
          <p className="text-sm text-green-800">
            These settings are applied to all future bookings automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
