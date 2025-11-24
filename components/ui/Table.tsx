import React from 'react';
interface TableProps {
  headers: string[];
  children: React.ReactNode;
  onRowDoubleClick?: (rowData: any) => void;
}
export function Table({
  headers,
  children,
  onRowDoubleClick
}: TableProps) {
  return <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {headers.map((header, index) => <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>)}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>
      </table>
    </div>;
}