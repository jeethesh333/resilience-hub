from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Flask app
app = Flask(__name__)

# Add more permissive CORS settings for debugging
CORS(app, resources={
    r"/*": {  # Changed from /api/* to /* for testing
        "origins": "*",  # More permissive for testing
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Accept"],
        "supports_credentials": True
    }
})

# Import and register blueprints
from server.routes.pinecone import pinecone_routes

# Add debug print to see registered routes
print("Available Routes:")
app.register_blueprint(pinecone_routes)
for rule in app.url_map.iter_rules():
    print(f"Route: {rule.rule}, Methods: {rule.methods}")

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    return jsonify({"status": "Server is running"})

@app.route("/")
def home():
    return "RAG backend is running!"

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)