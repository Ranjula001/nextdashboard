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
    const defaultAcHourlyRate = parseFloat(
      formData.get('default_ac_hourly_rate') as string
    );
    const defaultAcDailyRate = parseFloat(
      formData.get('default_ac_daily_rate') as string
    );
    const defaultNonAcHourlyRate = parseFloat(
      formData.get('default_nonac_hourly_rate') as string
    );
    const defaultNonAcDailyRate = parseFloat(
      formData.get('default_nonac_daily_rate') as string
    );
    const taxPercentage = formData.get('tax_percentage')
      ? parseFloat(formData.get('tax_percentage') as string)
      : null;
    const serviceChargePercentage = formData.get('service_charge_percentage')
      ? parseFloat(formData.get('service_charge_percentage') as string)
      : null;

    await updateSettings({
      business_name: businessName,
      currency,
      timezone,
      default_ac_hourly_rate: defaultAcHourlyRate,
      default_ac_daily_rate: defaultAcDailyRate,
      default_nonac_hourly_rate: defaultNonAcHourlyRate,
      default_nonac_daily_rate: defaultNonAcDailyRate,
      tax_percentage: taxPercentage,
      service_charge_percentage: serviceChargePercentage,
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
              <Label htmlFor="business_name" className="text-sm font-medium">
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
                <Label htmlFor="currency" className="text-sm font-medium">
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
                <Label htmlFor="timezone" className="text-sm font-medium">
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
          </div>
        </div>

        {/* Room Pricing Defaults */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Default Room Rates
          </h2>

          {/* AC Rooms */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Air-Conditioned Rooms
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ac_hourly" className="text-sm font-medium">
                  Hourly Rate ({settings.currency})
                </Label>
                <Input
                  id="ac_hourly"
                  type="number"
                  name="default_ac_hourly_rate"
                  defaultValue={settings.default_ac_hourly_rate}
                  min="0"
                  step="100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ac_daily" className="text-sm font-medium">
                  Daily Rate ({settings.currency})
                </Label>
                <Input
                  id="ac_daily"
                  type="number"
                  name="default_ac_daily_rate"
                  defaultValue={settings.default_ac_daily_rate}
                  min="0"
                  step="500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Non-AC Rooms */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Non-AC Rooms
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nonac_hourly" className="text-sm font-medium">
                  Hourly Rate ({settings.currency})
                </Label>
                <Input
                  id="nonac_hourly"
                  type="number"
                  name="default_nonac_hourly_rate"
                  defaultValue={settings.default_nonac_hourly_rate}
                  min="0"
                  step="100"
                  required
                />
              </div>
              <div>
                <Label htmlFor="nonac_daily" className="text-sm font-medium">
                  Daily Rate ({settings.currency})
                </Label>
                <Input
                  id="nonac_daily"
                  type="number"
                  name="default_nonac_daily_rate"
                  defaultValue={settings.default_nonac_daily_rate}
                  min="0"
                  step="500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Charges */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Additional Charges (Optional)
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tax" className="text-sm font-medium">
                Tax Percentage (%)
              </Label>
              <Input
                id="tax"
                type="number"
                name="tax_percentage"
                defaultValue={settings.tax_percentage || ''}
                min="0"
                max="100"
                step="0.01"
                placeholder="Leave blank if no tax"
              />
            </div>
            <div>
              <Label htmlFor="service_charge" className="text-sm font-medium">
                Service Charge Percentage (%)
              </Label>
              <Input
                id="service_charge"
                type="number"
                name="service_charge_percentage"
                defaultValue={settings.service_charge_percentage || ''}
                min="0"
                max="100"
                step="0.01"
                placeholder="Leave blank if no charge"
              />
            </div>
          </div>
          <p className="text-xs text-slate-600 mt-3">
            These percentages will be automatically applied to all bookings based
            on the subtotal.
          </p>
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
