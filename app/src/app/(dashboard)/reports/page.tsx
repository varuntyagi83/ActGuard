import { FileText } from "lucide-react";

export default function ReportsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-1">
          Generate and export compliance reports and audit packages.
        </p>
      </div>
      <div className="text-center py-20 bg-white rounded-xl border">
        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Coming soon
        </h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          PDF export and compliance package generation will be available in Phase
          2.
        </p>
      </div>
    </div>
  );
}
