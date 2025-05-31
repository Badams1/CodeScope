import { useState } from "react";
import axios from "axios";
import "./App.css"; // ✅ import the plain CSS

// Test file content for display
const testFileContent = `import subprocess
import pickle

def insecure_eval():
    user_input = input("Enter code: ")
    eval(user_input)  # B101 - Use of eval detected

def insecure_pickle():
    data = pickle.loads(b"malicious-payload")  # B301 - Pickle load

def insecure_shell():
    subprocess.call("ls -l", shell=True)  # B602 - shell=True

def hardcoded_password():
    password = "hunter2"  # B105 - Possible hardcoded password

def insecure_exec():
    exec("print('Dangerous exec')")  # B102 - Use of exec detected`;

function App() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sourceCode, setSourceCode] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [showTestCode, setShowTestCode] = useState(false);

  // Handle downloading the test file
  const downloadTestFile = () => {
    const element = document.createElement('a');
    const file = new Blob([testFileContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'CodeScopeTest.py';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle dragging the test file to upload zone
  const handleTestFileDrag = (e) => {
    e.dataTransfer.setData('text/plain', testFileContent);
    e.dataTransfer.effectAllowed = 'copy';
  };

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
    
    // Check if it's the test file content being dropped
    const textData = e.dataTransfer.getData('text/plain');
    if (textData === testFileContent) {
      const file = new Blob([testFileContent], { type: 'text/plain' });
      file.name = 'CodeScopeTest.py';
      const syntheticEvent = { target: { files: [file] } };
      handleFileUpload(syntheticEvent);
      return;
    }
    
    // Handle regular file drops
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".py")) {
      const syntheticEvent = { target: { files: [file] } };
      handleFileUpload(syntheticEvent);
    } else {
      alert("Please upload a valid .py file");
    }
  };
  
  return (
    <div className="dashboard-container">
      <h2 className="section-title">CodeScope Dashboard</h2>
      
      {/* Test File Display Section - Compact */}
      <div className="test-file-section-compact">
        <div className="test-file-header-compact">
          <div className="test-file-info-compact">
            <h3 className="test-file-title-compact">ExampleVulnerableCode.py</h3>
          </div>
          <div className="test-file-actions-compact">
            <button 
              className="toggle-code-btn" 
              onClick={() => setShowTestCode(!showTestCode)}
              title={showTestCode ? "Hide code" : "Show code"}
            >
              {showTestCode ? " Hide Code" : "View Code"}
            </button>
            <button 
              className="drag-drop-btn"
              draggable={true}
              onDragStart={handleTestFileDrag}
              title="Drag this button to the upload zone below"
            >
              Drag and Drop
            </button>
            <button 
              className="download-btn-compact" 
              onClick={downloadTestFile}
              title="Download test file"
            >
              📥 Download
            </button>
          </div>
        </div>
        
        {showTestCode && (
          <div 
            className="test-file-display-compact"
            draggable={true}
            onDragStart={handleTestFileDrag}
            title="Drag this file to the upload zone below to analyze it"
          >
            <pre className="test-code-view-compact">
              {testFileContent.split('\n').map((line, i) => (
                <div key={i} className="test-code-line">
                  <span className="test-line-number">
                    {(i + 1).toString().padStart(2, ' ')} |
                  </span>
                  <span className="test-line-text">{line}</span>
                </div>
              ))}
            </pre>
          </div>
        )}
      </div>

      {/* Main Upload Section */}
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
             ✅ No security issues found in this file!
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
              <h3>🚨 Issue on Line {selectedIssue.line_number}</h3>
              <p><strong>Severity:</strong> <span className={`severity ${selectedIssue.severity.toLowerCase()}`}>{selectedIssue.severity}</span></p>
              <p><strong>Confidence:</strong> {selectedIssue.confidence}</p>
              <button onClick={() => setSelectedIssue(null)} className="close-modal-btn">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
