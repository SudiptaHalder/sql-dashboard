import React, { useState, useEffect } from "react";
import { Table, Database, Columns, Eye, RefreshCw } from "lucide-react";

interface TableInfo {
  name: string;
  rows: number;
  size: number;
  sizeReadable: string;
}

interface TableData {
  columns: string[];
  rows: any[];
}

const DatabaseExplorer: React.FC = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  //-------------------------------------------------------
  // FORMAT SIZE
  //-------------------------------------------------------
  const formatBytes = (bytes: number) => {
    if (!bytes || bytes <= 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(2) + " " + sizes[i];
  };

  //-------------------------------------------------------
  // FETCH TABLE INFO
  //-------------------------------------------------------
  const fetchTableInfo = async (table: string) => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/config/table-info?table=${table}`
      );
      const data = await res.json();
      return data.success ? data.info : null;
    } catch (e) {
      return null;
    }
  };

  //-------------------------------------------------------
  // LOAD ALL TABLES WITH COUNTS + SIZE
  //-------------------------------------------------------
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);

        const res = await fetch("http://localhost:3000/api/config/tables");
        const data = await res.json();

        if (!data.success) {
          setError(data.error || "Failed loading tables");
          return;
        }

        const enriched: TableInfo[] = [];

        for (const t of data.tables) {
          const name = t.TABLE_NAME || t.table_name;

          const info = await fetchTableInfo(name);

          enriched.push({
            name,
            rows: info?.rows ?? 0,
            size: info?.size ?? 0,
            sizeReadable: info?.sizeReadable ?? "0 Bytes",
          });
        }

        setTables(enriched);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadTables();
  }, []);

  //-------------------------------------------------------
  // LOAD TABLE DATA
  //-------------------------------------------------------
  const loadTableData = async (tableName: string) => {
    try {
      setLoading(true);
      setSelectedTable(tableName);

      const res = await fetch(
        `http://localhost:3000/api/config/tables/${tableName}/data`
      );
      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        return;
      }

      setTableData(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  //-------------------------------------------------------

  return (
    <div className="h-full flex">
      {/* LEFT SIDEBAR */}
      <div className="w-80 bg-white border-r overflow-hidden flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Database Tables
            </h2>

            <button
              onClick={() => window.location.reload()}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {tables.length} tables in database
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {tables.map((t) => (
            <button
              key={t.name}
              onClick={() => loadTableData(t.name)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedTable === t.name
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-50 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Table className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{t.name}</span>
                </div>
                <Eye className="w-4 h-4 text-gray-400" />
              </div>

              <div className="mt-2 text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Rows:</span>
                  <span className="font-medium">{t.rows}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium">{t.sizeReadable}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT SIDE — TABLE DATA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedTable ? (
          <>
            <div className="p-4 border-b bg-white">
              <h2 className="text-xl font-semibold flex items-center">
                <Table className="w-5 h-5 mr-2" />
                {selectedTable}
              </h2>

              {tableData && (
                <p className="text-gray-500 mt-1">
                  {tableData.rows.length} rows — {tableData.columns.length} columns
                </p>
              )}
            </div>

            <div className="flex-1 overflow-auto bg-white p-4">
              {!tableData ? (
                <p>Select a table…</p>
              ) : (
                <table className="min-w-full border divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {tableData.columns.map((col) => (
                        <th key={col} className="px-4 py-2 text-left text-xs">
                          <Columns className="w-3 h-3 inline mr-1" />
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tableData.rows.map((row, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        {tableData.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-sm">
                            {row[col] ?? <span className="text-gray-400">NULL</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-gray-500">
            <Database className="w-10 h-10 text-gray-300" />
            <p className="ml-3 text-lg">Select a table from the sidebar</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DatabaseExplorer;
