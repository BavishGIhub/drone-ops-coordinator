import React from 'react';

interface ConflictAlertProps {
  conflicts: Array<{
    type: string;
    severity: string;
    message: string;
  }>;
}

export default function ConflictAlert({ conflicts }: ConflictAlertProps) {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'low':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="my-4 space-y-2">
      <h3 className="text-lg font-semibold mb-2">⚠️ Conflicts Detected</h3>
      {conflicts.map((conflict, idx) => (
        <div
          key={idx}
          className={`border rounded-lg p-3 ${getSeverityColor(conflict.severity)}`}
        >
          <div className="flex items-start">
            <div className="flex-1">
              <div className="text-xs font-medium uppercase mb-1">
                {conflict.type.replace('-', ' ')} - {conflict.severity} severity
              </div>
              <div className="text-sm">{conflict.message}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
