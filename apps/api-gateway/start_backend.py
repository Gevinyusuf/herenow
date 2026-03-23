import subprocess
import sys
import os

os.chdir(r"d:\Project\herenow\apps\api-gateway")
subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"])
