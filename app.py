# --- Force Redeploy v2 (fixed) ---
import os
import datetime

from flask import Flask, send_from_directory
from whitenoise import WhiteNoise
from flask_jwt_extended import JWTManager
from flask_cors import CORS

# your extension imports
from backend.extensions import db, security, api, migrate,cache
from backend.config import LocalDevelopmentConfig, ProductionConfig
from backend.security import user_datastore



def createApp():
    """
    Creates and configures the Flask application (factory).
    """
    app = Flask(
        __name__,
        static_folder='frontend',      # serves static files from frontend/
        template_folder='frontend',
        static_url_path=''             # keep as you had it so root serves index.html
    )

    # Choose config
    if os.environ.get('FLASK_ENV') == 'production':
        app.config.from_object(ProductionConfig)

        # Validate critical secrets in production
        if not app.config.get('SECRET_KEY'):
            raise ValueError("No SECRET_KEY set for production app")
        if not app.config.get('SECURITY_PASSWORD_SALT'):
            raise ValueError("No SECURITY_PASSWORD_SALT set for production app")
        if not app.config.get('JWT_SECRET_KEY'):
            raise ValueError("No JWT_SECRET_KEY set for production app")
    else:
        app.config.from_object(LocalDevelopmentConfig)

    # Initialize extensions
    db.init_app(app)
    api.init_app(app)
    migrate.init_app(app, db)
    cache.init_app(app)
    security.init_app(app, user_datastore)
    cache.init_app(app)

    # JWT
    JWTManager(app)

    # CORS: move here (and restrict origin in production)
    # Example: allowed = os.environ.get("FRONTEND_ORIGIN", "*")
    cors_origins = os.environ.get("FRONTEND_ORIGIN", "*")
    CORS(app, resources={r"/*": {"origins": cors_origins}}, supports_credentials=True)

    # Register routes (only import when app exists)
    with app.app_context():
        from backend import routes  # ensure your blueprint registrations run
        from backend.create_initial_data import init_app as initalize_database
        try:
            initalize_database(app)
        except Exception as e:
            print(f"Error during initial data creation: {e}")
    return app


# Create the application instance at module import so gunicorn can load it:
app = createApp()

# Use WhiteNoise to serve static assets (explicit root and index_file)
# In production you may prefer CloudFront + S3, but WhiteNoise is OK for Lightsail demo.
app.wsgi_app = WhiteNoise(app.wsgi_app, root='frontend', index_file=True)


# Single-page app catch-all route (Vue router)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_vue_app(path):
    # serve static files directly if they exist in the frontend folder
    requested = os.path.join(app.static_folder, path)
    if path and os.path.exists(requested):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# Health check
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.datetime.utcnow().isoformat()}


# ===== DEV ONLY: DB init endpoint (remove or protect in production) =====
@app.route('/api/init-db', methods=['POST'])
def init_db():
    # This endpoint is DANGEROUS in production.
    # Keep for local/dev only and protect it (restrict IP / auth) if you insist on using it.
    if os.environ.get('FLASK_ENV') == 'production':
        return {'error': 'Not allowed in production'}, 403
    try:
        db.create_all()
        return {'message': 'Database initialized successfully'}, 200
    except Exception as e:
        return {'error': str(e)}, 500


if __name__ == '__main__':
    # Local dev only
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
