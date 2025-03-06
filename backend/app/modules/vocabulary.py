# Import necessary modules from standard library and Flask
import os
import json
from flask import jsonify

# Import necessary paths from app utilities
from app.utils import data_path

def get_vocabulary():
    """Retrieve and return vocabulary data from a JSON file as a Flask response."""
    
    # Construct the full path to the vocabulary JSON file
    file_path = os.path.join(data_path, 'vocabulary.json')
    
    # Open the vocabulary JSON file and load its content
    with open(file_path) as file:
        data = json.load(file)
    
    # Convert the data to a JSON response using Flask's jsonify function
    return jsonify(data)
