import re
import json
import os
from typing import List, Dict, Any, Optional
from openai import AsyncOpenAI

client = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

async def call_llm(prompt: str) -> str:
    """Calls the OpenAI API to get a response."""
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful legal assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling LLM: {e}")
        raise

async def generate_structured_data(prompt: str, is_json: bool = True):
    """Generic function to call LLM and get structured data (JSON or text)."""
    try:
        response_text = await call_llm(prompt)
        if is_json:
            # The LLM might return the JSON within a code block, so we need to extract it.
            json_match = re.search(r'```json\n(.*)\n```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            
            # The LLM sometimes forgets the outer brackets for a list of objects
            if response_text.strip().startswith('{') and not response_text.strip().endswith('}'):
                 response_text = f'[{response_text.strip()}]'
            
            # It might also return a list of objects as a string of concatenated objects
            if '}{' in response_text:
                response_text = f"[{response_text.replace('}{', '},{')}]"

            return json.loads(response_text)
        
        # For mermaid chart, strip markdown fences
        mermaid_match = re.search(r'```(?:mermaid)?\n(.*?)\n```', response_text, re.DOTALL)
        if mermaid_match:
            response_text = mermaid_match.group(1)

        return response_text.strip()
    except Exception as e:
        print(f"Error generating structured data: {e}")
        # Return empty list for JSON or empty string for text on error
        return [] if is_json else "" 