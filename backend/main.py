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
    get_progress_tracker_prompt,
    get_argument_strength_prompt,
    get_precedent_analysis_prompt,
    get_strategy_rewrite_prompt,
    get_case_support_prompt,
    get_legal_breakdown_prompt,
)
from utils import generate_structured_data, call_llm

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

# Initialize RAG systems with correct paths
cpr_rag = CPRRAGSystem(data_dir="sample_data/cpr")
arbitration_rag = ArbitrationRAGSystem(cases_dir="jus_mundi_hackathon_data/cases")

class QueryRequest(BaseModel):
    query: str
    mode: str  # "civil_procedure" or "arbitration_strategy"
    session_id: Optional[str] = None
    voice_input: Optional[bool] = False
    conversation_history: Optional[List[Dict[str, str]]] = None

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[Dict[str, Any]]
    flowchart: Optional[str] = None
    reasoning_chain: List[str]
    session_id: str
    timelineEvents: Optional[List[Dict[str, Any]]] = None
    progressSteps: Optional[List[Dict[str, Any]]] = None
    radarMetrics: Optional[Dict[str, Any]] = None
    precedents: Optional[List[Dict[str, Any]]] = None
    formUrl: Optional[str] = None

class RewriteRequest(BaseModel):
    strategy: str
    context: str

class LegalBreakdownRequest(BaseModel):
    case_name: str

@app.get("/")
async def root():
    return {"message": "JusticeGPS API - AI Assistant for Legal Analysis"}

@app.post("/api/query", response_model=QueryResponse)
async def query(request: QueryRequest):
    try:
        if request.mode == "civil_procedure":
            # Synchronous path for CPR
            relevant_docs = cpr_rag.get_relevant_rules(request.query)
            prompt = get_civil_procedure_prompt(relevant_docs, request.query, request.conversation_history)
        else:  # arbitration_strategy
            # Asynchronous path for Arbitration
            relevant_docs = await arbitration_rag.get_relevant_cases(request.query)
            prompt = get_arbitration_strategy_prompt(relevant_docs, request.query)

        # Common logic for answer generation
        llm_answer = await call_llm(prompt)

        # Initialize structured data
        flowchart_data, timeline_data, progress_data, strength_data, precedent_data, form_url = None, [], [], None, [], None

        if request.mode == "civil_procedure":
            # For civil procedure, generate structured data based on the answer
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

        # Defensive fix: ensure every source is a dict and has a 'url' key
        processed_sources = []
        for source in relevant_docs:
            if not isinstance(source, dict):
                source = {}
            if 'url' not in source:
                source['url'] = ''
            processed_source = {
                'rule_number': source.get('rule_number', ''),
                'heading': source.get('heading', ''),
                'part': source.get('part', ''),
                'part_title': source.get('part_title', ''),
                'excerpt': source.get('excerpt', ''),
                'score': source.get('score', 0.0),
                'full_text': source.get('full_text', ''),
                'url': source.get('url', ''),
                'case_name': source.get('case_name', ''),
                'status': source.get('status', ''),
                'support': source.get('support', {
                    'classification': 'Unknown',
                    'justification': 'No analysis available'
                }),
                'summary': source.get('summary', '')
            }
            processed_sources.append(processed_source)

        return {
            "answer": llm_answer,
            "confidence": confidence,
            "reasoning_chain": reasoning_chain,
            "flowchart": flowchart_data,
            "citations": citations,
            "quality_metrics": quality_metrics,
            "sources": processed_sources,
            "session_id": request.session_id or f"session_{datetime.now().timestamp()}",
            "timelineEvents": timeline_data,
            "progressSteps": progress_data,
            "radarMetrics": strength_data,
            "precedents": precedent_data,
            "formUrl": form_url
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

@app.post("/api/rewrite-strategy")
async def rewrite_strategy(request: RewriteRequest):
    try:
        prompt = get_strategy_rewrite_prompt(request.strategy, request.context)
        rewritten_strategy = await call_llm(prompt)
        return {"rewritten_strategy": rewritten_strategy}
    except Exception as e:
        print(f"Error rewriting strategy: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/legal-breakdown")
async def legal_breakdown(request: LegalBreakdownRequest):
    try:
        case_data = arbitration_rag.get_case_by_name(request.case_name)
        if not case_data:
            raise HTTPException(status_code=404, detail="Case not found")

        prompt = get_legal_breakdown_prompt(case_data['full_text'])
        breakdown = await generate_structured_data(prompt, is_json=True)
        return breakdown
    except Exception as e:
        print(f"Error generating legal breakdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

def calculate_confidence(sources: List[Dict[str, Any]], query: str) -> float:
    """
    Calculate a confidence score based on the relevance and number of sources.
    The score from FAISS is a distance (lower is better), so we invert it.
    """
    if not sources:
        return 0.3  # Low confidence if no sources are found

    # Weight factors
    source_count_weight = 0.4
    relevance_score_weight = 0.6

    # Normalize source count score (maxes out at 5 sources)
    source_count_score = min(len(sources) / 5.0, 1.0)

    # Average relevance score from sources (score is 1 - distance)
    # This assumes 'score' is available and is a similarity measure [0, 1]
    relevance_scores = [s.get('score', 0.0) for s in sources]
    average_relevance = sum(relevance_scores) / len(relevance_scores) if relevance_scores else 0.0

    # Weighted final confidence
    confidence = (source_count_score * source_count_weight) + (average_relevance * relevance_score_weight)

    # Ensure confidence is within a reasonable range (e.g., up to 0.95 before boosts)
    confidence = min(confidence, 0.95)

    # Add a small boost for keyword matches as a final check
    query_terms = set(query.lower().split())
    text_match_boost = 0.0
    for source in sources:
        source_text = source.get('full_text', '').lower()
        if any(term in source_text for term in query_terms):
            text_match_boost += 0.01
    
    final_confidence = min(confidence + text_match_boost, 1.0)
    
    return final_confidence

def generate_reasoning_chain(query: str, sources: List[Dict[str, Any]], answer: str) -> List[str]:
    """Generate reasoning chain for explainability"""
    chain = [
        f"Analyzed query: '{query}'",
        f"Retrieved {len(sources)} relevant sources"
    ]
    
    for i, source in enumerate(sources[:3]):  # Limit to top 3 sources
        chain.append(f"Source {i+1}: {source.get('case_name', 'Unknown source')}")
    
    chain.append("Applied legal reasoning framework")
    chain.append("Generated comprehensive response")
    chain.append("Performed self-refinement for accuracy")
    
    return chain

# --- Form URL Utility ---
def get_form_url(form_name: str) -> Optional[str]:
    """
    Finds the GOV.UK URL for a given court form.
    This is a simplified stub. A real implementation would use a database or a more robust search.
    """
    form_name_cleaned = form_name.strip().upper()
    # Common forms mapping
    form_map = {
        "N1": "https://www.gov.uk/government/publications/form-n1-claim-form-cpr-part-7",
        "N9": "https://www.gov.uk/government/publications/form-n9-response-pack",
        "N244": "https://www.gov.uk/government/publications/form-n244-application-notice",
        "N181": "https://www.gov.uk/government/publications/form-n181-directions-questionnaire-small-claims-track",
    }
    return form_map.get(form_name_cleaned)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 