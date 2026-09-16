import os
import requests
from typing import List, Dict, Any, Optional
from app.config import settings

SYSTEM_PROMPT = """You are QAssist, the user's personal knowledge assistant in MindVault.

For factual questions, answer using ONLY the provided retrieved context. Do not invent information.
If the answer to a factual question cannot be found in the provided context, clearly say that the information could not be found in the user's knowledge base.
For general conversational greetings or casual chat (e.g. "hi", "hello", "how are you", "who are you"), respond naturally and politely.
When the user asks for a summary (e.g., a schedule, to-do list, or overview), be extremely concise. Provide only titles or high-level bullet points rather than listing all the granular details, unless explicitly requested.

CRITICAL RESPONSE STRUCTURE:
1. Give the direct answer first. Do NOT begin responses with phrases like "Based on your stored knowledge...", "According to your knowledge base...", or "Based on the retrieved context...". Act like a natural AI assistant.
2. Add a concise explanation/details if useful.
3. Show referenced knowledge sources at the END, visually separated at the bottom of your response (e.g. under a "Sources:" heading).

Format your responses with clear markdown, bullet points, and concise paragraphs when appropriate."""

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER
        self.api_key = settings.LLM_API_KEY
        self.model_name = settings.LLM_MODEL_NAME
        self._init_provider()

    def _init_provider(self):
        if self.provider == "gemini" and self.api_key:
            import google.generativeai as genai
            import os
            os.environ["GOOGLE_API_KEY"] = self.api_key
            genai.configure(api_key=self.api_key)
            self._gemini_model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=SYSTEM_PROMPT
            )
        elif self.provider == "openai" and self.api_key:
            from openai import OpenAI
            self._openai_client = OpenAI(api_key=self.api_key)

    def extract_text_from_file(self, file_path: str, mime_type: str = None) -> str:
        """Uploads a file to Gemini (or passes image inline), extracts text, and returns it."""
        if self.provider != "gemini" or not self.api_key:
            raise ValueError("OCR requires Gemini provider and an active API key.")
        
        from pathlib import Path
        path = Path(file_path)
        ext = path.suffix.lower().replace(".", "")
        
        if ext in ["png", "jpg", "jpeg"]:
            import PIL.Image
            try:
                img = PIL.Image.open(file_path)
                response = self._gemini_model.generate_content(
                    [img, "Extract all the text from this document as accurately as possible. Output only the extracted text without any conversational filler or markdown formatting for the document structure unless it's strictly necessary."]
                )
                return response.text.strip()
            except Exception as e:
                raise Exception(f"Image OCR failed: {str(e)}")
        else:
            import google.generativeai as genai
            import os
            os.environ["GOOGLE_API_KEY"] = self.api_key
            
            # Upload file to Gemini (for PDFs)
            uploaded_file = genai.upload_file(path=file_path, mime_type=mime_type)
            
            try:
                response = self._gemini_model.generate_content(
                    [uploaded_file, "Extract all the text from this document as accurately as possible. Output only the extracted text without any conversational filler or markdown formatting for the document structure unless it's strictly necessary."]
                )
                return response.text.strip()
            finally:
                # Clean up file from Gemini servers immediately
                genai.delete_file(uploaded_file.name)

    def _local_fallback_generate(
        self,
        prompt: str,
        context_chunks: List[Dict[str, Any]],
        question: str
    ) -> str:
        """
        Extractive grounded response generator used when external LLM API key is not set.
        Ensures zero hallucination and strictly extracts answers from retrieved chunks.
        """
        if not context_chunks:
            # Check if conversational
            conversational_keywords = ["hi", "hello", "hey", "who are you", "how are you", "what are you", "good morning", "good evening"]
            is_conversational = any(kw == question.lower().strip() or question.lower().strip().startswith(kw) for kw in conversational_keywords) and len(question) < 50
            if is_conversational:
                return "Hello! I am QAssist, your personal knowledge assistant. How can I help you explore your knowledge vault today?"
            return "I could not find any relevant information about this in your personal knowledge vault. Please add notes or upload documents related to this topic."

        # Check for matching sentences or topics in chunks
        q_words = set(w.lower() for w in question.replace('?', '').split() if len(w) > 3)
        relevant_sentences = []
        sources_used = set()

        for chunk in context_chunks:
            text = chunk.get("content", "")
            doc_name = chunk.get("documentName", "knowledge base")
            sentences = [s.strip() for s in text.replace('\n', '. ').split('.') if len(s.strip()) > 15]

            matched = False
            for sent in sentences:
                sent_words = set(sent.lower().split())
                overlap = len(q_words.intersection(sent_words))
                if overlap > 0:
                    relevant_sentences.append(sent)
                    matched = True

            if matched:
                sources_used.add(doc_name)

        if not relevant_sentences:
            return "I could not find any information about this in your personal knowledge vault. This topic is not mentioned in your stored notes or documents."

        # Format extracted findings
        bullets = "\n".join([f"- {s}." for s in relevant_sentences[:4]])
        source_str = "\n\nSources:\n" + "\n".join([f"📄 {s}" for s in sources_used])
        return f"{bullets}{source_str}"

    def generate_response(
        self,
        question: str,
        context_chunks: List[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> str:
        """
        Generates a grounded answer using the specified LLM provider and retrieved context.
        """
        # Build context prompt
        context_blocks = []
        for i, chunk in enumerate(context_chunks):
            doc_name = chunk.get("documentName", "Document")
            source_type = chunk.get("sourceType", "doc")
            page_num = chunk.get("pageNumber", 1)
            content = chunk.get("content", "")
            context_blocks.append(
                f"[Source {i+1}: {doc_name} ({source_type}, Page {page_num})]\n{content}"
            )

        joined_context = "\n\n".join(context_blocks)

        from datetime import datetime
        current_time_str = datetime.now().strftime("%A, %B %d, %Y")

        context_display = joined_context if context_chunks else "No relevant context found in the vault."
        user_prompt = f"""Current Date: {current_time_str}

Retrieved Knowledge Context:
-----------------------
{context_display}
-----------------------

User Question: {question}

For factual questions, answer accurately using ONLY the retrieved knowledge above. If the information is not contained in the context, explicitly inform the user that it is not in their vault. If it's a casual greeting or conversational message, respond naturally."""

        # Gemini
        if self.provider == "gemini" and self.api_key:
            try:
                contents = []
                if conversation_history:
                    for msg in conversation_history[-4:]:
                        role = "user" if msg.get("role") == "user" else "model"
                        contents.append({"role": role, "parts": [msg.get("content", "")]})
                contents.append({"role": "user", "parts": [user_prompt]})
                
                response = self._gemini_model.generate_content(contents)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                print(f"[Gemini LLM Error]: {e}, using fallback")

        # OpenAI
        if self.provider == "openai" and self.api_key:
            try:
                messages = [{"role": "system", "content": SYSTEM_PROMPT}]
                if conversation_history:
                    for msg in conversation_history[-4:]:
                        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
                messages.append({"role": "user", "content": user_prompt})

                completion = self._openai_client.chat.completions.create(
                    model=self.model_name or "gpt-4o-mini",
                    messages=messages,
                    temperature=0.2
                )
                return completion.choices[0].message.content.strip()
            except Exception as e:
                print(f"[OpenAI LLM Error]: {e}, using fallback")

        # Ollama
        if self.provider == "ollama":
            try:
                ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
                payload = {
                    "model": self.model_name or "llama3",
                    "prompt": f"{SYSTEM_PROMPT}\n\n{user_prompt}",
                    "stream": False
                }
                res = requests.post(ollama_url, json=payload, timeout=30)
                if res.status_code == 200:
                    return res.json().get("response", "").strip()
            except Exception as e:
                print(f"[Ollama Error]: {e}, using fallback")

        # Deterministic grounded fallback
        return self._local_fallback_generate(user_prompt, context_chunks, question)

llm_service = LLMService()
