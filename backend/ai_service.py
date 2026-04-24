import os
import toml
from groq import Groq
from tavily import TavilyClient

# Đọc các API Key từ file secrets.toml
BASE_DIR = os.path.dirname(os.path.dirname(__file__))
SECRETS_PATH = os.path.join(BASE_DIR, ".streamlit", "secrets.toml")

try:
    with open(SECRETS_PATH, "r", encoding="utf-8") as f:
        secrets = toml.load(f)
        groq_key = secrets.get("GROQ_API_KEY", "")
        tavily_key = secrets.get("TAVILY_API_KEY", "")
except Exception:
    groq_key = ""
    tavily_key = ""

# Khởi tạo các Client
groq_client = Groq(api_key=groq_key) if groq_key else None
tavily_client = TavilyClient(api_key=tavily_key) if tavily_key else None

def get_game_response(user_message: str, history: list = None) -> str:
    if not groq_client or not tavily_client:
        return "Lỗi: Thiếu cấu hình API Key trong secrets.toml!"

    try:
        # 1. Tạo query tìm kiếm có ngữ cảnh
        base_query = user_message
        if history and len(user_message.split()) < 4:
            for msg in reversed(history):
                if msg["role"] == "user":
                    base_query = f"{msg['content']} {user_message}"
                    break
        
        # BƯỚC ĐỘT PHÁ: Dùng AI dịch nhanh câu hỏi sang tiếng Anh để ép Tavily tìm báo quốc tế
        trans_prompt = f"Translate this gaming query to a short, precise English search query (just output the keywords, no chat): '{base_query}'"
        trans_res = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": trans_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=20
        )
        search_query = trans_res.choices[0].message.content.strip().replace('"', '')
        
        # Tìm kiếm bằng Tavily với query tiếng Anh
        search_result = tavily_client.search(query=search_query, max_results=5, search_depth="advanced")
        
        # Nạp URL để AI nhận diện được ngữ cảnh bài viết
        context_data = "\n".join([f"- Source ({res['url']}): {res['content']}" for res in search_result['results']])

        # 2. System Prompt bằng Tiếng Anh (giúp LLM Llama tuân thủ tốt hơn, ít bị gò bó)
        system_prompt = f"""You are 'Aetherion', an elite virtual assistant and a Video Game encyclopedia. 
System Time: April 2026.

LIVE INTERNET DATA:
---
{context_data}
---

INSTRUCTIONS:
1. You are a helpful, conversational AI companion. Respond in Vietnamese in a natural, engaging, and concise manner.
2. For gameplay tips, lore, history, or general game recommendations, use your internal expertise.
3. For news, release dates, updates, game sizes, or versions, STRICTLY base your answer on the LIVE INTERNET DATA provided above.
4. ENTITY DISAMBIGUATION (CRITICAL): The internet data often contains articles comparing multiple games (e.g., Genshin Impact, Honkai Star Rail, Wuthering Waves). You MUST carefully extract only the facts that belong EXACTLY to the game the user is asking about. DO NOT mix up numbers, sizes, or versions between different games.
5. NO HALLUCINATION: If the exact version or size for the requested game is NOT clearly stated in the data, honestly state that the current exact information is unavailable. Do NOT extrapolate or guess future versions just because the system year is 2026.
"""

        # 3. Nạp lịch sử hội thoại
        messages_payload = [{"role": "system", "content": system_prompt}]
        if history:
            messages_payload.extend(history[-6:])
        messages_payload.append({"role": "user", "content": user_message})

        # 4. Gọi API với nhiệt độ cân bằng
        response = groq_client.chat.completions.create(
            messages=messages_payload,
            model="llama-3.3-70b-versatile",
            temperature=0.3, # Mức 0.3 giúp AI giữ độ chính xác cao nhưng không bị quá máy móc
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Hệ thống AI gặp sự cố: {str(e)}"