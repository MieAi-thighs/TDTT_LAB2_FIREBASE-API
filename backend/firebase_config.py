import firebase_admin
from firebase_admin import credentials, firestore
import os

# Lấy đường dẫn chính xác tới file firebase-key.json trong thư mục backend
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KEY_PATH = os.path.join(BASE_DIR, "firebase-key.json")

def init_firebase():
    """Khởi tạo Firebase Admin SDK và trả về đối tượng kết nối database (Firestore)."""
    # Kiểm tra xem app đã được khởi tạo chưa để tránh bị lỗi khởi tạo nhiều lần
    if not firebase_admin._apps:
        cred = credentials.Certificate(KEY_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()

# Khởi tạo db để các file khác có thể import và dùng
db = init_firebase()
