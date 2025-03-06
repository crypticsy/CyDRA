# Import necessary modules from standard library and Flask
import os, json
from datetime import datetime
from flask import request, jsonify

# Import necessary paths from app utilities
from app.utils import projects_path

def get_all_projects():
    """Retrieve and return all projects from the projects directory as JSON."""
    projects = []
    
    # Traverse the projects directory to find and process all JSON files
    for file_name in os.listdir(projects_path):
        # Ensure the file is a JSON before processing
        if file_name.endswith('.json'):
            file_path = os.path.join(projects_path, file_name)
            last_modified = datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat()
            projects.append({
                'name': file_name.replace('.json', ''),
                'last_saved': last_modified
            })
    
    # Return the projects data in JSON format
    return jsonify(projects)


def get_project():
    """Retrieve and return a single project's data based on filename from the query parameter."""
    filename = request.args.get('filename', type=str)
    
    # Validate presence of filename in the request
    if not filename:
        return jsonify({"error": "Filename needs to be specified."}), 400

    file_path = os.path.join(projects_path, f"{filename}")
    
    # Check if the file exists; create if it doesn't
    if not os.path.exists(file_path):
        with open(file_path, 'w') as file:
            json.dump({
                'situations': [],
                'events': [],
                'relationships': [],
                'simulated_path': []
            }, file, indent=2)

    # Load and return the existing data
    with open(file_path) as file:
        data = json.load(file)
    
    return jsonify(data)


def update_project():
    """Update the project data based on the provided JSON data in the request."""
    filename = request.args.get('filename', type=str)
    
    # Validate the filename presence
    if not filename:
        return jsonify({"error": "Filename needs to be specified."}), 400

    file_path = os.path.join(projects_path, f"{filename}")
    
    # Attempt to update the project data
    try:
        with open(file_path, 'r+') as file:
            existing_data = json.load(file)
            # Update the simulated path if it exists
            new_data = request.get_json()
            new_data['simulated_path'] = existing_data.get('simulated_path', [])
            
            file.seek(0)
            file.truncate()
            json.dump(new_data, file, indent=2)
        
        return jsonify({'message': 'Project updated successfully!', 'status': 'success'})
    except Exception as e:
        return jsonify({'message': 'Error updating project: {}'.format(e), 'status': 'error'})


def delete_project():
    """Delete a project file based on filename from the query parameters."""
    filename = request.args.get('filename', type=str)
    
    # Validate the filename presence
    if not filename:
        return jsonify({"error": "Filename needs to be specified."}), 400

    file_path = os.path.join(projects_path, f"{filename}.json")
    
    # Attempt to delete the file
    try:
        os.remove(file_path)
        return jsonify({'message': 'Project deleted successfully.', 'status': 'success'})
    except FileNotFoundError:
        return jsonify({"error": "Project file does not exist."}), 404
    except OSError as e:
        return jsonify({"error": f"Failed to delete project: {e}"}), 500
