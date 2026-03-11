import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

print("Starting API Gateway...")
print(f"Python version: {sys.version}")
print(f"Working directory: {os.getcwd()}")

from main import app
import uvicorn

print("Starting uvicorn server on http://0.0.0.0:8000")
uvicorn.run(app, host="0.0.0.0", port=8000)
