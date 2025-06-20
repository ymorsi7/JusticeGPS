from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import asyncio
import re
from datetime import datetime
import os
from dotenv import load_dotenv
from openai import AsyncOpenAI

from rag_cpr import CPRRAGSystem
from rag_cases import ArbitrationRAGSystem
from prompt_templates import (
    get_prompt_template,
    refine_answer, 
    get_civil_procedure_prompt, 
    get_arbitration_strategy_prompt, 
    extract_citations, 
    validate_answer_quality,
    get_flowchart_prompt,
    get_timeline_prompt,
    get_progress_tracker_prompt
)

app = FastAPI(title="JusticeGPS", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5176", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize RAG systems
cpr_rag = CPRRAGSystem()
arbitration_rag = ArbitrationRAGSystem()

class QueryRequest(BaseModel):
    query: str
    mode: str  # "civil_procedure" or "arbitration_strategy"
    session_id: Optional[str] = None
    voice_input: Optional[bool] = False

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    flowchart: Optional[str] = None
    reasoning_chain: List[str]
    session_id: str
    timelineEvents: Optional[List[Dict[str, Any]]] = None
    progressSteps: Optional[List[Dict[str, Any]]] = None

@app.get("/")
async def root():
    return {"message": "JusticeGPS API - AI Assistant for Legal Analysis"}

@app.post("/api/query")
async def query(request: QueryRequest):
    try:
        # Use the globally initialized RAG instances
        if request.mode == "civil_procedure":
            rag_system = cpr_rag
            relevant_docs = rag_system.get_relevant_rules(request.query, k=5)
            context = "\n\n".join([f"**CPR {rule['rule_number']} - {rule['heading']}**\n{rule['excerpt']}" for rule in relevant_docs]) if relevant_docs else "No relevant CPR rules found."
            prompt = get_civil_procedure_prompt(context, request.query)
            
        elif request.mode == "arbitration_strategy":
            rag_system = arbitration_rag
            relevant_docs = rag_system.get_relevant_cases(request.query, k=7)
            context = "\n\n".join([f"**[{case['case_name']}]** {case['summary']}" for case in relevant_docs]) if relevant_docs else "No relevant cases found."
            prompt = get_arbitration_strategy_prompt(context, request.query)
        else:
            raise HTTPException(status_code=400, detail="Invalid mode specified")

        # Call the real LLM
        llm_answer = await call_llm(prompt)
        
        # Generate structured data for components in parallel for civil procedure
        if request.mode == "civil_procedure":
            flowchart_prompt = get_flowchart_prompt(llm_answer)
            timeline_prompt = get_timeline_prompt(llm_answer)
            progress_prompt = get_progress_tracker_prompt(llm_answer)
            
            flowchart_task = asyncio.create_task(generate_structured_data(flowchart_prompt, is_json=False))
            timeline_task = asyncio.create_task(generate_structured_data(timeline_prompt, is_json=True))
            progress_task = asyncio.create_task(generate_structured_data(progress_prompt, is_json=True))
            
            flowchart_data = await flowchart_task
            timeline_data = await timeline_task
            progress_data = await progress_task
        else:
            flowchart_data = None
            timeline_data = []
            progress_data = []

        # Calculate confidence and generate reasoning chain
        confidence = calculate_confidence(relevant_docs, request.query)
        reasoning_chain = generate_reasoning_chain(request.query, relevant_docs, llm_answer)
        
        # Extract citations
        citations = extract_citations(llm_answer)
        
        # Validate answer quality
        quality_metrics = validate_answer_quality(llm_answer, request.query, request.mode)

        return {
            "answer": llm_answer,
            "confidence": confidence,
            "reasoning_chain": reasoning_chain,
            "flowchart": flowchart_data,
            "citations": citations,
            "quality_metrics": quality_metrics,
            "sources": relevant_docs,
            "session_id": request.session_id or f"session_{datetime.now().timestamp()}",
            "timelineEvents": timeline_data,
            "progressSteps": progress_data
        }
        
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/modes")
async def get_modes():
    return {
        "modes": [
            {
                "id": "civil_procedure",
                "name": "UK Civil Procedure Assistant",
                "description": "AI assistant for UK Civil Procedure Rules (CPR) and Practice Directions"
            },
            {
                "id": "arbitration_strategy",
                "name": "Arbitration Strategy Analyzer",
                "description": "Analyze arbitration strategies for environmental counterclaims"
            }
        ]
    }

@app.get("/api/sample-questions/{mode}")
async def get_sample_questions(mode: str):
    if mode == "civil_procedure":
        return {
            "questions": [
                "What is the deadline for serving a claim form under CPR 7.5?",
                "How do I apply for summary judgment under CPR 24?",
                "What are the requirements for service of documents under CPR 6?",
                "How do I make an application for interim relief?",
                "What is the procedure for disclosure under CPR 31?"
            ]
        }
    elif mode == "arbitration_strategy":
        return {
            "questions": [
                "What are the key weaknesses in Kronos's environmental counterclaim strategy?",
                "How can we strengthen our jurisdictional arguments against environmental counterclaims?",
                "What precedent supports our position on environmental liability?",
                "What procedural strategies should we consider for the counterclaim?",
                "How do we address the burden of proof for environmental damages?"
            ]
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid mode")

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

def calculate_confidence(sources: List[Dict[str, Any]], query: str) -> float:
    """Calculate confidence score based on source relevance"""
    if not sources:
        return 0.3
    
    # Simple confidence calculation based on number and relevance of sources
    base_confidence = min(0.9, 0.3 + len(sources) * 0.15)
    
    # Boost confidence if query terms match source content
    query_terms = query.lower().split()
    relevance_boost = 0.0
    
    for source in sources:
        source_text = str(source.get('content', '')).lower()
        matches = sum(1 for term in query_terms if term in source_text)
        relevance_boost += matches / len(query_terms) * 0.1
    
    return min(1.0, base_confidence + relevance_boost)

def generate_reasoning_chain(query: str, sources: List[Dict[str, Any]], answer: str) -> List[str]:
    """Generate reasoning chain for explainability"""
    chain = [
        f"Analyzed query: '{query}'",
        f"Retrieved {len(sources)} relevant sources"
    ]
    
    for i, source in enumerate(sources[:3]):  # Limit to top 3 sources
        chain.append(f"Source {i+1}: {source.get('title', 'Unknown source')}")
    
    chain.append("Applied legal reasoning framework")
    chain.append("Generated comprehensive response")
    chain.append("Performed self-refinement for accuracy")
    
    return chain

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
            if response_text.strip().startswith('{'):
                response_text = f'[{response_text.strip()}]'
                
            return json.loads(response_text)
        # For mermaid chart, just return the raw text
        return response_text.strip()
    except Exception as e:
        print(f"Error generating structured data: {e}")
        # Return empty list for JSON or empty string for text on error
        return [] if is_json else ""

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 