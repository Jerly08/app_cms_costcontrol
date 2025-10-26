import { ReactNode } from 'react';

interface Column {
  header: string;
  accessor: string;
  cell?: (value: any, row: any) => ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
}

const Table = ({ columns, data }: TableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map((column, index) => (
              <th
                key={index}
                className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-8 text-gray-500"
              >
                Tidak ada data
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                {columns.map((column, colIndex) => {
                  const value = row[column.accessor];
                  return (
                    <td key={colIndex} className="py-3 px-4 text-sm text-gray-900">
                      {column.cell ? column.cell(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
