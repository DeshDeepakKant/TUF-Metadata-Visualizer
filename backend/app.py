from flask import Flask, jsonify
from flask_cors import CORS
import os
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend requests

# Path to the TUF metadata folder
TUF_METADATA_DIR = "metadata"

# Function to load all TUF JSON files
def load_all_tuf_metadata():
    metadata = {}
    for filename in ["root.json", "targets.json", "snapshot.json", "timestamp.json"]:
        filepath = os.path.join(TUF_METADATA_DIR, filename)
        if os.path.exists(filepath):
            with open(filepath, "r") as file:
                metadata[filename] = json.load(file)
        else:
            metadata[filename] = {"error": f"{filename} not found"}
    return metadata

# API Route to get TUF metadata
@app.route('/api/tuf-metadata', methods=['GET'])
def get_tuf_metadata():
    return jsonify(load_all_tuf_metadata())

if __name__ == '__main__':
    print("Starting Flask app...")
    app.run(debug=True)
