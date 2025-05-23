import { useState } from "react";
import axios from "axios";
import "./App.css"; // ✅ import the plain CSS

function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceCode, setSourceCode] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const response = await axios.post("/api/scan", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIssues(response.data.issues);  
      setSourceCode(response.data.source_code); 
    } catch (error) {
      console.error("Scan failed:", error);
      if (error.response) {
        console.error("Server responded with:", error.response.data);
      }
      alert("Something went wrong during the scan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".py")) {
      const syntheticEvent = { target: { files: [file] } };
      handleFileUpload(syntheticEvent);
    } else {
      alert("Please upload a valid .py file");
    }
  };
  
  return (
    <div>
      <h2 className="section-title">CodeScope Dashboard</h2>
      <div className="upload-box"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) => e.preventDefault()}>

        <label htmlFor="file-upload" className="upload-button">
          Click or drag a Python file here to scan
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".py"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {loading && <p className="loading-msg">Running security analysis...</p>}

        {sourceCode.length > 0 && issues.length === 0 && (
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
            fontWeight: "bold",
            color: "#22c55e",
            fontSize: "1.2rem"
          }}>
             No security issues found in this file!
          </div>
        )}

        {sourceCode.length > 0 && (
          <pre className="code-view">
            {sourceCode.map((line, i) => {
              const lineNumber = i + 1;
              const issue = issues.find((iss) => iss.line_number === lineNumber);
              const isHighlighted = !!issue;

              return (
                <div
                  key={i}
                  className={`code-line ${isHighlighted ? "highlight" : ""}`}
                  onClick={() => issue && setSelectedIssue(issue)}
                >
                  <span className="line-number">
                    {lineNumber.toString().padStart(3, ' ')} |
                  </span>
                  <span className="line-text">{line}</span>
                </div>
              );
            })}
          </pre>
        )}
        {selectedIssue && (
          <div className="issue-modal" onClick={() => setSelectedIssue(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Issue on Line {selectedIssue.line_number}</h3>
              <p><strong>Severity:</strong> {selectedIssue.severity}</p>
              <p><strong>Confidence:</strong> {selectedIssue.confidence}</p>
              <p>{selectedIssue.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
