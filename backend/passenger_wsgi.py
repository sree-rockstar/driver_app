"""
Passenger WSGI Entry Point for cPanel Deployment

This file is the entry point for cPanel's Passenger WSGI server.
Place this file in your application root directory on cPanel.

IMPORTANT: Update the INTERP path to match your cPanel virtual environment path!
Example: /home/yourusername/virtualenv/driver_app/3.11/bin/python
"""

import sys
import os

# !!! IMPORTANT: Update this path to your cPanel virtual environment !!!
# You can find this path in cPanel's "Setup Python App" interface
INTERP = "/home/thinktre/virtualenv/driver_app/3.11/bin/python"

# Ensure we're using the virtual environment's Python interpreter
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add application directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Option 1: ASGI to WSGI Adapter (Recommended for cPanel)
# Most cPanel hosts use Passenger which is WSGI-based
# FastAPI is ASGI, so we need an adapter
try:
    from asgiref.wsgi import WsgiToAsgi
    from app.main import app
    
    # Convert ASGI FastAPI app to WSGI for Passenger
    application = WsgiToAsgi(app)
    print("Successfully loaded FastAPI app with ASGI-to-WSGI adapter")
    
except ImportError as e:
    print(f"Error: asgiref not installed. Run: pip install asgiref>=3.7.2")
    print(f"Import error: {e}")
    # Fallback to direct ASGI (may not work on all cPanel hosts)
    from app.main import app
    application = app


# Option 2: Pure ASGI (uncomment if your cPanel supports native ASGI/Uvicorn)
# from app.main import app
# application = app


# Test function to verify the setup
def test_application():
    """Test if the application loads correctly"""
    try:
        print(f"Python version: {sys.version}")
        print(f"Python path: {sys.path}")
        print(f"Application directory: {os.path.dirname(__file__)}")
        print(f"Application object: {application}")
        print("✅ Application loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Error loading application: {e}")
        return False


if __name__ == "__main__":
    test_application()

