import sys
import os
sys.path.append("/home/mieai/Documents/firebase/backend")
from ai_service import get_game_response

print("Testing Wuthering Waves query...")
print(get_game_response("current version and storage for pc and mobile of wuthering waves"))
