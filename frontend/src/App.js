import React, { useState, useEffect } from "react";

function App() {
  const [metadata, setMetadata] = useState(null);
  const [expandedFile, setExpandedFile] = useState(null); // Track expanded file

  useEffect(() => {
    fetch("http://127.0.0.1:5000/api/tuf-metadata")
      .then((response) => response.json())
      .then((data) => setMetadata(data))
      .catch((error) => console.error("Error fetching metadata:", error));
  }, []);

  const toggleFile = (fileName) => {
    setExpandedFile(expandedFile === fileName ? null : fileName);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>TUF Metadata Visualizer</h1>
      {metadata ? (
        Object.entries(metadata).map(([key, value]) => (
          <div key={key} style={{ marginBottom: "10px" }}>
            <h2 
              onClick={() => toggleFile(key)}
              style={{
                cursor: "pointer",
                color: expandedFile === key ? "blue" : "black",
                textDecoration: "underline",
              }}
            >
              {key}
            </h2>
            {expandedFile === key && (
              <pre style={{ background: "#f4f4f4", padding: "10px", borderRadius: "5px" }}>
                {JSON.stringify(value, null, 2)}
              </pre>
            )}
          </div>
        ))
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;
