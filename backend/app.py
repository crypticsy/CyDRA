# Import necessary modules from the Flask framework and related extensions
from flask import Flask
from flask_cors import CORS

# Import the main blueprint and configuration settings
from app import bp as main_bp
from config import Config

# Create a Flask application instance
app = Flask(__name__)

# Configure Cross-Origin Resource Sharing (CORS) for the app
cors = CORS(app, resources={r"/*": {"origins": Config.ORIGINS}})

# Register the blueprint with the application
app.register_blueprint(main_bp)

# Run the application only if this file is executed as the main program
if __name__ == '__main__':
    app.run(port=Config.PORT, debug=Config.DEBUG)
