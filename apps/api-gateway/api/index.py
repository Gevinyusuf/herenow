import os
import sys

# 将父目录加入路径，以便能找到 main.py
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from main import app