import os

# Define the base path relative to this script's location
base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Construct the path to the directory where JSON data is stored
data_path = os.path.join(base_path, 'app', 'data')
projects_path = os.path.join(data_path, 'projects')