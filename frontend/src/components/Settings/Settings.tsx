import React, { useState, useEffect } from "react";
import { useActivityStore } from "../../store/activityStore";
import {
  Database,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const Settings: React.FC = () => {
  const { setDatabaseConfig } = useActivityStore();

  const [config, setConfig] = useState<DatabaseConfig>({
    host: "",
    port: 3306,
    user: "",
    password: "",
    database: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  // ------------------------------
  // LOAD CONFIG (MASKED PASSWORD)
  // ------------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("http://localhost:3000/api/config/database");
        const data = await res.json();

        if (data.success && data.config) {
          setConfig({
            ...data.config,
            password: "", // IMPORTANT: don't load "***"
          });
        }
      } catch (err) {
        console.error("Load config failed:", err);
      }
    })();
  }, []);

  const updateField = (field: keyof DatabaseConfig, value: string | number) =>
    setConfig((prev) => ({ ...prev, [field]: value }));


  // ------------------------------
  // TEST CONNECTION
  // ------------------------------
  const handleTest = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        "http://localhost:3000/api/config/test-connection",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        }
      );

      const data = await res.json();

      if (data.success) {
        setMessage("Connection successful!");
        setMessageType("success");
      } else {
        setMessage("Connection failed: " + data.error);
        setMessageType("error");
      }
    } catch (err: any) {
      setMessage("Connection failed: " + err.message);
      setMessageType("error");
    }

    setLoading(false);
  };


  // ------------------------------
  // SAVE CONFIG
  // ------------------------------
  const handleSave = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:3000/api/config/database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (data.success) {
        setMessage("Configuration saved!");
        setMessageType("success");

        // Update internal global store
        setDatabaseConfig(config);
      } else {
        setMessage(data.error);
        setMessageType("error");
      }
    } catch (err: any) {
      setMessage(err.message);
      setMessageType("error");
    }

    setLoading(false);
  };


  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Database className="w-6 h-6 mr-2 text-blue-600" />
        Connect to MySQL
      </h2>

      <div className="bg-white p-6 rounded-xl shadow border space-y-4">
        <input
          className="w-full border p-3 rounded"
          placeholder="Host"
          value={config.host}
          onChange={(e) => updateField("host", e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          type="number"
          placeholder="Port"
          value={config.port}
          onChange={(e) => updateField("port", Number(e.target.value))}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Username"
          value={config.user}
          onChange={(e) => updateField("user", e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          type="password"
          placeholder="Password"
          value={config.password}
          onChange={(e) => updateField("password", e.target.value)}
        />

        <input
          className="w-full border p-3 rounded"
          placeholder="Database"
          value={config.database}
          onChange={(e) => updateField("database", e.target.value)}
        />

        {message && (
          <div
            className={`p-3 rounded flex items-center space-x-2 ${
              messageType === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {messageType === "success" ? <CheckCircle /> : <AlertCircle />}
            <span>{message}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded"
          >
            Save
          </button>

          <button
            onClick={handleTest}
            className="px-6 py-2 bg-green-600 text-white rounded"
          >
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
