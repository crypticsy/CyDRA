# Import Blueprint class from Flask
from flask import Blueprint

# Create a Blueprint instance for the 'main' module
bp = Blueprint('main', __name__)

# Import routes; this is done after the Blueprint instance to avoid circular imports
from app import routes