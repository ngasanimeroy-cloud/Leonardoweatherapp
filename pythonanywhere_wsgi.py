# WSGI configuration for PythonAnywhere
# Copy this to your WSGI file in the PythonAnywhere Web tab

import sys

# Project path - REPLACE 'yourusername' with your actual PythonAnywhere username
path = '/home/studentdev/weather'
if path not in sys.path:
    sys.path.append(path)

# Virtual environment path (if using one)
# virtualenv_path = '/home/yourusername/.virtualenvs/myenv'
# if virtualenv_path not in sys.path:
#     sys.path.append(virtualenv_path)

# Load environment variables if using .env
from dotenv import load_dotenv
load_dotenv('/home/studentdev/weather/.env')

# Import the Flask application
from app import app
application = app

# Optional: Uncomment if you want to run in debug mode (not recommended for production)
# os.environ['FLASK_DEBUG'] = 'True'