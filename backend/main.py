from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from firebase_admin import auth
from backend.database import save_message, get_user_messages, add_to_wishlist, get_wishlist, remove_from_wishlist
from backend.ai_service import get_game_response

security = HTTPBearer()

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Xác thực Firebase ID Token"""
    token = credentials.credentials
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token không hợp lệ hoặc đã hết hạn.")

# Khởi tạo ứng dụng FastAPI
app = FastAPI(title="Game Companion API")

# Cấu hình CORS để cho phép Next.js (chạy ở localhost:3000) gọi API không bị lỗi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên sửa thành ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Định nghĩa dữ liệu đầu vào (Schema) cho API /chat
class ChatRequest(BaseModel):
    user_id: str
    message: str

# API kiểm tra xem Backend có đang chạy không
@app.get("/")
def read_root():
    return {"message": "Welcome to Game Companion Chatbot API!"}

# API health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

# API lấy thông tin user đang đăng nhập
@app.get("/auth/me")
def get_current_user(user: dict = Depends(verify_token)):
    return {"user": user}

# API chính xử lý chat
@app.post("/chat")
def chat(request: ChatRequest, user: dict = Depends(verify_token)):
    """
    1. Nhận tin nhắn từ Frontend
    2. Lưu tin nhắn của người dùng vào Database
    3. Gọi AI để lấy câu trả lời
    4. Lưu câu trả lời của AI vào Database
    5. Trả kết quả về Frontend
    """
    if not request.user_id or not request.message:
        raise HTTPException(status_code=400, detail="Thiếu user_id hoặc message")
    
    # Xác minh user_id gửi lên phải khớp với token (bảo mật)
    if request.user_id != user.get("uid"):
        raise HTTPException(status_code=403, detail="Không có quyền thao tác với tài khoản này")
    
    # Bước 2: Lưu câu hỏi của User
    save_message(user_id=request.user_id, role="user", content=request.message)
    
    # Bước 2.5: Lấy lịch sử chat (tối đa 6 tin nhắn gần nhất để làm văn cảnh)
    history_docs = get_user_messages(request.user_id)
    # Bỏ qua tin nhắn vừa gửi ở Bước 2 để tránh lặp
    history = [{"role": msg["role"], "content": msg["content"]} for msg in history_docs[:-1]][-6:]
    
    # Bước 3: Đưa cho AI xử lý kèm lịch sử
    ai_reply = get_game_response(request.message, history=history)
    
    # Bước 4: Lưu câu trả lời của Assistant (AI)
    save_message(user_id=request.user_id, role="assistant", content=ai_reply)
    
    # Bước 5: Trả về cho Frontend hiển thị
    return {"reply": ai_reply}

# API lấy danh sách tin nhắn
@app.get("/messages/{user_id}")
def get_messages(user_id: str, user: dict = Depends(verify_token)):
    """
    Lấy toàn bộ lịch sử trò chuyện của một người dùng dựa trên user_id
    """
    if user_id != user.get("uid"):
        raise HTTPException(status_code=403, detail="Không có quyền xem tin nhắn của tài khoản khác")
    try:
        messages = get_user_messages(user_id)
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ================= WISHLIST API =================
class WishlistRequest(BaseModel):
    game_name: str

@app.post("/wishlist")
def add_wishlist_item(request: WishlistRequest, user: dict = Depends(verify_token)):
    """Thêm game vào wishlist"""
    result = add_to_wishlist(user.get("uid"), request.game_name)
    return result

@app.get("/wishlist")
def list_wishlist(user: dict = Depends(verify_token)):
    """Lấy danh sách game yêu thích"""
    items = get_wishlist(user.get("uid"))
    return {"wishlist": items}

@app.delete("/wishlist/{item_id}")
def delete_wishlist_item(item_id: str, user: dict = Depends(verify_token)):
    """Xóa game khỏi wishlist"""
    result = remove_from_wishlist(user.get("uid"), item_id)
    return result
