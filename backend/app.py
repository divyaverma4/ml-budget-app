from flask import Flask
from firebase_config import init_firebase
from routes.spending import spending_bp


def create_app():
    app = Flask(__name__)

    init_firebase()

    app.register_blueprint(spending_bp, url_prefix="/api")

    @app.errorhandler(404)
    def not_found(e):
        return {"error": "Not found"}, 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return {"error": "Method not allowed"}, 405

    @app.errorhandler(500)
    def internal_error(e):
        return {"error": "Internal server error"}, 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)