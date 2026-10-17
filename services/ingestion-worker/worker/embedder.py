import os
import hashlib
import numpy as np

def generate_embedding(text: str, model_name: str = "text-embedding-004") -> list[float]:
    """
    Computes a 768-dimensional embedding for semantic search.
    If GEMINI_API_KEY is missing or invalid, falls back to a deterministic 768-dim hash vector
    to guarantee local pipeline stability and testing.
    """
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    
    if api_key and api_key not in ["your_gemini_api_key_here", "mock_or_dev_key"]:
        try:
            from google import genai
            client = genai.Client(api_key=api_key)
            result = client.models.embed_content(
                model=model_name,
                contents=text
            )
            # Check embedding output structure
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
