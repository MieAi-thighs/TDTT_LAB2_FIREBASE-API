# Game Companion Chatbot - Lab 2

Đây là dự án thực hành Lab 2: API & Firebase. Dự án áp dụng kiến trúc tách biệt Frontend (Next.js) và Backend (FastAPI).

**Feature chính của ứng dụng:**
* **Xác thực:** Đăng nhập/Đăng xuất bằng Firebase Authentication (ID Token).
* **Chatbot AI RAG:** Tích hợp mô hình ngôn ngữ lớn kết hợp Tavily API để tìm kiếm và trả lời các thông tin mới nhất về Game.
* **Database (Firestore):** Lưu trữ lịch sử hội thoại (contextual memory) và quản lý danh sách game yêu thích (Wishlist).

---

## Cấu trúc thư mục
```text
.
├── backend/
│   ├── main.py             # Router chính (FastAPI, Auth, Chat, Wishlist)
│   ├── ai_service.py       # Logic gọi AI và RAG
│   ├── database.py         # Thao tác CRUD với Firestore
│   └── firebase-key.json   # Service account key của Firebase
├── frontend/
│   ├── src/app/            # Giao diện Next.js (Đăng nhập, Chat, Wishlist)
│   └── src/firebase.ts     # Khởi tạo Firebase Client
├── .streamlit/             
│   └── secrets.toml        # Lưu trữ API Key (Groq, Tavily)
└── requirements.txt
```

## 1. Hướng dẫn cài đặt environment
**Thiết lập Backend (Python):**
*Yêu cầu: Máy tính cần cài đặt sẵn Python 3.12.*

1. Mở terminal tại thư mục gốc, tạo và kích hoạt môi trường ảo (Virtual Environment):
   * Trên Windows: `python -m venv venv` và `venv\Scripts\activate`
   * Trên macOS/Linux: `python3 -m venv venv` và `source venv/bin/activate`
2. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
3. Đảm bảo bạn đã đặt file `firebase-key.json` vào thư mục `backend/` và thêm các API Key (Groq, Tavily) vào file `.streamlit/secrets.toml`.

**Thiết lập Frontend (Next.js):**
1. Mở terminal tại thư mục `frontend/`:
2. Cài đặt các gói Node.js:
   ```bash
   npm install
3. Đảm bảo file `.env.local` được cấu hình đúng với `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, và `NEXT_PUBLIC_FIREBASE_PROJECT_ID`.
## 2. Hướng dẫn chạy ứng dụng
> **Lưu ý quan trọng:** Backend phải được khởi động trước để Frontend có thể gửi request.

1. Tại terminal đang kích hoạt môi trường ảo (venv) ở thư mục gốc.
2. Chạy lệnh sau để khởi động server FastAPI:
```bash
uvicorn backend.main:app --reload --port 8000
```
Server Backend sẽ chạy tại: http://localhost:8000

Sau khi Backend đã chạy, tiến hành khởi động Frontend.

1. Tại terminal đang ở thư mục `frontend/`.
2. Chạy lệnh khởi động Next.js:
```bash
npm run dev
```
Giao diện ứng dụng sẽ có thể truy cập tại: http://localhost:3000

***Lưu ý: Để chatbot trích xuất số liệu chuẩn xác nhất (như dung lượng, phiên bản game), khuyến khích nhập câu hỏi bằng Tiếng Anh hoặc sử dụng từ khóa Tiếng Anh.***

## 4. Video DEMO
