import React, { useState, useEffect } from 'react';
import { Table, Database, Columns, Eye, RefreshCw } from 'lucide-react';

interface TableInfo {
  table_name: string;
  table_rows: number;
  data_length: number;
  index_length: number;
}

interface TableData {
  columns: string[];
  rows: any[];
}

const DatabaseExplorer: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      setLoading(true);

      const response = await fetch('http://localhost:3000/api/config/tables');
      const data = await response.json();

      if (data.success) {
        setTables(data.tables);
      } else {
        setError(data.error || 'Failed to load tables');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTableData = async (tableName: string) => {
    try {
      setLoading(true);
      setSelectedTable(tableName);

      const response = await fetch(
        `http://localhost:3000/api/config/tables/${tableName}/data`
      );

      const data = await response.json();

      if (data.success) {
        setTableData(data.data);
      } else {
        setError(data.error || 'Failed to load table data');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full flex">
      <div className="w-80 bg-white border-r overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Tables
            </h2>
            <button onClick={loadTables} className="p-1 hover:bg-gray-200 rounded transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{tables.length} tables in database</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && tables.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading tables...
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 text-sm">{error}</div>
          ) : (
            <div className="p-2 space-y-1">
              {tables.map((table) => (
                <button
                  key={table.table_name}
                  onClick={() => loadTableData(table.table_name)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTable === table.table_name
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Table className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900">{table.table_name}</span>
                    </div>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Rows:</span>
                      <span className="font-medium">{table.table_rows?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Size:</span>
                      <span className="font-medium">
                        {formatBytes(table.data_length + table.index_length)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTable ? (
          <>
            <div className="p-4 border-b bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Table className="w-5 h-5 mr-2" />
                    {selectedTable}
                  </h2>
                  {tableData && (
                    <p className="text-sm text-gray-600 mt-1">
                      {tableData.rows.length} rows, {tableData.columns.length} columns
                    </p>
                  )}
                </div>
                <button
                  onClick={() => loadTableData(selectedTable)}
                  disabled={loading}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-white">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
                  Loading table data...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">{error}</div>
              ) : tableData ? (
                <div className="p-4">
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {tableData.columns.map((column) => (
                            <th
                              key={column}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              <div className="flex items-center space-x-1">
                                <Columns className="w-3 h-3" />
                                <span>{column}</span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableData.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {tableData.columns.map((column) => (
                              <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row[column] !== null && row[column] !== undefined ? (
                                  String(row[column])
                                ) : (
                                  <span className="text-gray-400">NULL</span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {tableData.rows.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Table className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No data found in this table</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a table to view its data</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center text-gray-500">
              <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Select a table from the sidebar</p>
              <p className="text-sm">to view its data and structure</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseExplorer;
