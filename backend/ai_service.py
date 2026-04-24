import os
import json
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
        
        # BƯỚC ĐỘT PHÁ: Phân tích câu hỏi và tạo ra danh sách các truy vấn tìm kiếm bằng tiếng Anh (Query Decomposition)
        trans_prompt = f"""Analyze this gaming query and break it down into 1 to 2 short, precise English search queries to maximize search accuracy. 
            Include '2026' or 'latest' in the queries.
Output ONLY a valid JSON array of strings, without any markdown formatting or extra text.
Example: ["game name latest version news 2026", "game name storage size pc mobile 2026"]
Query: '{base_query}'"""

        trans_res = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": trans_prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=60
        )
        
        try:
            # Parse JSON array từ phản hồi của AI
            content = trans_res.choices[0].message.content.strip()
            # Xóa các block markdown nếu có
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
            
            search_queries = json.loads(content)
            if not isinstance(search_queries, list):
                search_queries = [str(search_queries)]
        except Exception:
            # Fallback nếu AI trả về lỗi định dạng
            search_queries = [trans_res.choices[0].message.content.strip().replace('"', '').replace('[', '').replace(']', '')]

        # Giới hạn tối đa 2 truy vấn để tránh làm chậm hệ thống
        search_queries = search_queries[:2]
        
        # Tìm kiếm bằng Tavily cho từng query và gộp kết quả
        all_results = {}
        for q in search_queries:
            try:
                search_result = tavily_client.search(query=q, max_results=3, search_depth="advanced")
                for res in search_result.get('results', []):
                    # Dùng URL làm key để tránh trùng lặp bài viết
                    all_results[res['url']] = res['content']
            except Exception as e:
                print(f"Tavily search error for '{q}': {e}")
                
        # Nạp URL để AI nhận diện được ngữ cảnh bài viết
        context_data = "\n".join([f"- Source ({url}): {content}" for url, content in all_results.items()])

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
5. NO HALLUCINATION & INFERRING VERSIONS: Read the data carefully to find any mentions of version numbers (like "Ver. 3.1", "Version 2.7", "1.0", etc). The highest version number found associated with the game IS the current version. If found, YOU MUST EXPLICITLY STATE it as the current version. DO NOT say "there is no specific information about the current version" if you found a version number. If no version number exists at all, only then state it's unavailable. Do NOT extrapolate future versions just because the system year is 2026.
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