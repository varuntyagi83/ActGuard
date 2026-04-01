import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your organisation, integrations, and notification preferences.
        </p>
      </div>
      <div className="text-center py-20 bg-white rounded-xl border">
        <Settings className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Coming soon
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Organisation settings, Slack integration, and notification preferences
          will be available soon.
        </p>
      </div>
    </div>
  );
}
