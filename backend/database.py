from backend.firebase_config import db
from datetime import datetime
from firebase_admin import firestore

def save_message(user_id: str, role: str, content: str):
    """
    Lưu một tin nhắn vào Firestore database.
    - user_id: ID của người dùng (từ Firebase Auth)
    - role: 'user' (người dùng) hoặc 'assistant' (chatbot)
    - content: Nội dung tin nhắn
    """
    # Cấu trúc DB: users (collection) -> {user_id} (document) -> messages (collection) -> {message_id} (document)
    message_ref = db.collection('users').document(user_id).collection('messages').document()
    
    message_data = {
        'role': role,
        'content': content,
        'timestamp': datetime.utcnow()
    }
    
    # Ghi dữ liệu lên Firebase
    message_ref.set(message_data)
    return message_data

def get_user_messages(user_id: str):
    """
    Lấy danh sách toàn bộ tin nhắn của một người dùng, sắp xếp theo thời gian gửi.
    """
    messages_ref = db.collection('users').document(user_id).collection('messages')
    
    # order_by('timestamp') giúp lấy tin nhắn theo thứ tự cũ nhất đến mới nhất
    docs = messages_ref.order_by('timestamp').stream()
    
    messages = []
    for doc in docs:
        data = doc.to_dict()
        messages.append({
            'role': data['role'],
            'content': data['content'],
            'timestamp': data['timestamp']
        })
    return messages

def add_to_wishlist(user_id: str, game_name: str):
    """Lưu game vào wishlist của user"""
    wishlist_ref = db.collection('users').document(user_id).collection('wishlist').document()
    data = {
        'id': wishlist_ref.id,
        'game_name': game_name,
        'timestamp': datetime.utcnow()
    }
    wishlist_ref.set(data)
    return data

def get_wishlist(user_id: str):
    """Lấy danh sách wishlist của user"""
    wishlist_ref = db.collection('users').document(user_id).collection('wishlist')
    docs = wishlist_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).stream()
    
    items = []
    for doc in docs:
        items.append(doc.to_dict())
    return items

def remove_from_wishlist(user_id: str, item_id: str):
    """Xóa game khỏi wishlist"""
    db.collection('users').document(user_id).collection('wishlist').document(item_id).delete()
    return {"status": "success", "item_id": item_id}
