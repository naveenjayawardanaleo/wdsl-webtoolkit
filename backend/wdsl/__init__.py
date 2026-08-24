from flask import Flask
from flask_cors import CORS

from .config import Config
from .extensions import db, jwt


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)

    from .routes.auth import auth_bp
    from .routes.analyze import analyze_bp
    from .routes.reports import reports_bp
    from .routes.comments import comments_bp
    from .routes.admin import admin_bp
    from .routes.payment import payment_bp
    from .routes.contact import contact_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(analyze_bp, url_prefix="/api")
    app.register_blueprint(reports_bp, url_prefix="/api")
    app.register_blueprint(comments_bp, url_prefix="/api")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(payment_bp, url_prefix="/api/payment")
    app.register_blueprint(contact_bp, url_prefix="/api/contact")

    @app.route("/")
    def health_check():
        from .services.cv_model import is_model_loaded

        return {
            "status": "ok",
            "service": "WDSL WebToolkit backend",
            "model_loaded": is_model_loaded(),
        }

    with app.app_context():
        db.create_all()

    return app
