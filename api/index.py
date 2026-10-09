import sys
import os

# Add root directory to Python path so backend package is discovered on Vercel
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.main import app
