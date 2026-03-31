#connect python to firebase
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv

load_dotenv()

_app = None

def init_firebase():
    global _app
    if _app is not None:
        return

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")
    if not cred_path:
        raise RuntimeError("FIREBASE_CREDENTIALS_PATH not set in .env")

    cred = credentials.Certificate(cred_path)
    _app = firebase_admin.initialize_app(cred)

def get_db():
    if _app is None:
        init_firebase()
    return firestore.client()