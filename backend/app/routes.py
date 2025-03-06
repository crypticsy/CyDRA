# Import Blueprint from the app package
from app import bp

# Import specific functions from different modules in the app package
from app.modules.projects import get_all_projects, get_project, update_project, delete_project
from app.modules.risk_analysis import get_risk_analysis
from app.modules.vocabulary import get_vocabulary

# Link the vocabulary endpoint functions to routes
bp.add_url_rule('/api/loadVocabulary/', view_func=get_vocabulary, methods=['GET'])

# Link the project endpoint functions to routes
bp.add_url_rule('/api/getAllProjects/', view_func=get_all_projects, methods=['GET'])
bp.add_url_rule('/api/getProject/', view_func=get_project, methods=['GET'])
bp.add_url_rule('/api/updateProject/', view_func=update_project, methods=['POST'])
bp.add_url_rule('/api/deleteProject/', view_func=delete_project, methods=['DELETE'])

# Link the risk analysis endpoint functions to routes
bp.add_url_rule('/api/runRiskAnalysis/', view_func=get_risk_analysis, methods=['POST'])