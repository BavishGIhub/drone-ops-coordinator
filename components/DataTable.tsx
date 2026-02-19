import React from 'react';

interface Column {
  key: string;
  label: string;
}

interface DataTableProps {
  data: Record<string, any>[];
  columns: Column[];
  title?: string;
}

export default function DataTable({ data, columns, title }: DataTableProps) {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <div className="my-4 overflow-x-auto">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <table className="min-w-full border border-gray-200 rounded-lg">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-b"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-2 text-sm text-gray-900">
                  {row[col.key] || '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
