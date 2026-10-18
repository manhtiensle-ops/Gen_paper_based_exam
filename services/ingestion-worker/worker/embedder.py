import os
import hashlib
import numpy as np

def generate_embedding(text: str, model_name: str = "text-embedding-004") -> list[float]:
    """
    Computes a 768-dimensional embedding for semantic search.
    Supports:
    1. OmniRoute / OpenAI-compatible embedding API (with dimensions=768)
    2. Google Gemini SDK (text-embedding-004)
    3. Deterministic pseudo-embedding fallback for offline/test environments.
    """
    omniroute_key = (os.getenv("OMNIROUTE_API_KEY") or os.getenv("LLM_API_KEY") or "").strip(' "\'')
    omniroute_base_url = (os.getenv("OMNIROUTE_BASE_URL") or os.getenv("LLM_BASE_URL") or "").strip(' "\'')

    if omniroute_key and omniroute_key not in ["your_omniroute_key_here", "mock_or_dev_key"]:
        try:
            from openai import OpenAI
            client = OpenAI(
                api_key=omniroute_key,
                base_url=omniroute_base_url if omniroute_base_url else None
            )
            emb_model = os.getenv("OMNIROUTE_EMBEDDING_MODEL") or os.getenv("LLM_EMBEDDING_MODEL") or "text-embedding-3-small"
            
            try:
                # Try with dimensions=768 (supported by text-embedding-3-small/large)
                resp = client.embeddings.create(
                    model=emb_model,
                    input=text,
                    dimensions=768
                )
                return resp.data[0].embedding
            except Exception:
                # Default call
                resp = client.embeddings.create(
                    model=emb_model,
                    input=text
                )
                vec = resp.data[0].embedding
                if len(vec) > 768:
                    vec = vec[:768]
                elif len(vec) < 768:
                    vec = vec + [0.0] * (768 - len(vec))
                return vec
        except Exception as e:
            print(f"[OmniRoute Embedder Warning] Embedding API call failed: {e}. Trying Gemini or fallback.")

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if api_key and api_key not in ["your_gemini_api_key_here", "mock_or_dev_key"]:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            result = client.models.embed_content(
                model=model_name,
                contents=text
            )
            if hasattr(result, "embedding") and hasattr(result.embedding, "values"):
                return list(result.embedding.values)
            elif hasattr(result, "embeddings") and len(result.embeddings) > 0:
                return list(result.embeddings[0].values)
        except Exception as e:
            print(f"[Embedder Warning] Gemini embedding API call failed: {e}. Falling back to deterministic pseudo-embedding.")
    
    # Deterministic pseudo-embedding for offline/test environments (768 dimensions)
    np.random.seed(int(hashlib.md5(text.encode("utf-8")).hexdigest()[:8], 16))
    vec = np.random.normal(0, 1, 768)
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec = vec / norm
    return vec.tolist()
