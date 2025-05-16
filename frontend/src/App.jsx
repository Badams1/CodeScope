import { useState } from "react";
import axios from "axios";

function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:8000/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Scan response:", response.data);
      setIssues(response.data.issues);
    } catch (error) {
      console.error("Scan failed:", error);
      alert("Something went wrong during the scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">🧠 CodeScope Dashboard</h1>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
        <input
          type="file"
          accept=".py"
          onChange={handleFileUpload}
          className="w-full border p-2 mb-4"
        />

        {loading && <p className="text-blue-600">Running analysis...</p>}

        {issues.length > 0 && (
          <div className="space-y-4 mt-6">
            {issues.map((issue, idx) => (
              <div
                key={idx}
                className={`border-l-4 p-4 rounded bg-white shadow-sm ${
                  issue.severity === "HIGH"
                    ? "border-red-500 bg-red-50"
                    : issue.severity === "MEDIUM"
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-green-500 bg-green-50"
                }`}
              >
                <p className="font-semibold">{issue.issue}</p>
                <p className="text-sm text-gray-700">
                  <strong>Line {issue.line_number}:</strong>{" "}
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-red-700">{issue.code}</code>
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Severity:</strong> {issue.severity} |{" "}
                  <strong>Confidence:</strong> {issue.confidence}
                </p>
                <p className="mt-2 text-gray-800">{issue.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
