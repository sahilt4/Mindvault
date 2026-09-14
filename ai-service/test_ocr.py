import asyncio
from app.services.llm import llm_service
from pathlib import Path

def test_ocr():
    try:
        import google.generativeai as genai
        import os
        genai.configure(api_key=os.environ.get("LLM_API_KEY", llm_service.api_key))
        print("Available models:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(m.name)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_ocr()
