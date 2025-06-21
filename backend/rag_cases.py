import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle
from prompt_templates import get_case_support_prompt
from utils import generate_structured_data
import asyncio

class ArbitrationRAGSystem:
    def __init__(self, cases_dir: str = "jus_mundi_hackathon_data/cases", index_file: str = "cases_index.faiss"):
        self.cases_dir = Path(cases_dir)
        self.index_file = Path(index_file)
        self.cases_data = []
        self.embeddings = None
        self.index = None
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Load or build index
        if self.index_file.exists() and Path("cases_data_new.pkl").exists():
            self.load_index()
        else:
            # Clean up old index files if they exist
            if self.index_file.exists():
                self.index_file.unlink()
            if Path("cases_index.pkl").exists():
                Path("cases_index.pkl").unlink()
            if Path("cases_data_new.pkl").exists():
                Path("cases_data_new.pkl").unlink()
            self.build_index_from_files()
    
    def load_index(self):
        """Load existing FAISS index and case data"""
        print("Loading existing cases index...")
        
        # Load case data
        with open("cases_data_new.pkl", "rb") as f:
            self.cases_data = pickle.load(f)
        
        # Load FAISS index
        self.index = faiss.read_index(str(self.index_file))
        
        # Load embeddings
        self.embeddings = np.array([case['embedding'] for case in self.cases_data])
        
        print(f"Loaded {len(self.cases_data)} cases from index")
    
    def build_index_from_files(self):
        """Build FAISS index from a directory of JSON case files"""
        print(f"Building cases index from directory: {self.cases_dir}...")
        
        if not self.cases_dir.exists() or not self.cases_dir.is_dir():
            print(f"Cases directory not found at {self.cases_dir}")
            self.cases_data = []
            return

        raw_cases = []
        for json_file in self.cases_dir.glob('*.json'):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    raw_cases.append(json.load(f))
            except Exception as e:
                print(f"Error reading or parsing {json_file}: {e}")

        print(f"Found {len(raw_cases)} cases in the directory.")

        for case_data in raw_cases:
            case_info = self.extract_case_info(case_data)
            if case_info:
                self.cases_data.append(case_info)
                    
        print(f"Successfully processed {len(self.cases_data)} cases")
        
        if not self.cases_data:
            print("No cases loaded, creating empty index")
            return
        
        # Create embeddings
        texts = [case['markdown_text'] for case in self.cases_data]
        embeddings = self.model.encode(texts, show_progress_bar=True)
        
        # Store embeddings in case data
        for i, case in enumerate(self.cases_data):
            case['embedding'] = embeddings[i]
        
        # Create FAISS index
        dimension = embeddings.shape[1]
        self.index = faiss.IndexFlatIP(dimension)  # Inner product for cosine similarity
        self.index.add(embeddings.astype('float32'))
        
        # Save index and data
        faiss.write_index(self.index, str(self.index_file))
        # Use a new pickle file to avoid conflicts with old data structure
        with open("cases_data_new.pkl", "wb") as f:
            pickle.dump(self.cases_data, f)
        
        print(f"Index built and saved with {len(self.cases_data)} cases")
    
    def extract_case_info(self, case_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Extract relevant information from case JSON data"""
        try:
            # Extract basic case information
            case_name = case_data.get('Title', 'Unknown Case')
            citation = case_data.get('CaseNumber', 'No Citation')
            status = case_data.get('Status', 'Unknown Status')
            institution = case_data.get('Institution', 'Unknown Institution')
            
            # Determine if case is supportive or adverse based on status
            supportive = self.determine_supportive_status(status)
            
            # Extract full text content from decisions
            full_text = self.extract_full_text(case_data)
            
            # Create summary from first 200 characters
            summary = full_text[:200] + "..." if len(full_text) > 200 else full_text
            
            # Create markdown text for search
            markdown_text = f"""
# {case_name}

**Citation:** {citation}
**Status:** {status}
**Institution:** {institution}

## Summary
{summary}

## Full Content
{full_text}
"""
            
            return {
                'case_name': case_name,
                'citation': citation,
                'summary': summary,
                'supportive': supportive,
                'markdown_text': markdown_text,
                'full_text': full_text,
                'status': status,
                'institution': institution,
                'embedding': None  # Will be set later
            }
            
        except Exception as e:
            print(f"Error extracting case info: {e}")
            return None
    
    async def get_case_support_analysis(self, case_text: str, user_query: str) -> Dict[str, Any]:
        """
        Uses an LLM to determine if a case is supportive, opposing, or neutral.
        """
        # Limit case text to prevent token overflow
        if len(case_text) > 2000:
            case_text = case_text[:2000] + "... [Text truncated for analysis]"
        
        prompt = get_case_support_prompt(case_text, user_query)
        try:
            # We expect a single JSON object from the LLM
            support_data = await generate_structured_data(prompt, is_json=True)
            if isinstance(support_data, list): # Handle LLM inconsistency
                support_data = support_data[0]
            
            # Basic validation
            if "classification" in support_data and "justification" in support_data:
                 return support_data
            return {"classification": "Unknown", "justification": "AI analysis failed or returned invalid format."}
        except Exception as e:
            print(f"Error getting case support analysis from LLM: {e}")
            return {"classification": "Unknown", "justification": "Error during AI analysis."}

    def determine_supportive_status(self, status: str) -> bool:
        """
        [DEPRECATED] Determine if case is supportive or adverse based on status.
        This will be replaced by LLM-based analysis.
        """
        status_lower = status.lower()
        
        # Supportive cases (favorable to environmental counterclaims)
        supportive_keywords = [
            'favor of state', 'state won', 'counterclaim accepted', 'environmental',
            'dismissed in favor of state', 'state prevailed'
        ]
        
        # Adverse cases (unfavorable to environmental counterclaims)
        adverse_keywords = [
            'favor of investor', 'investor won', 'counterclaim dismissed',
            'dismissed in favor of investor', 'investor prevailed'
        ]
        
        for keyword in supportive_keywords:
            if keyword in status_lower:
                return True
        
        for keyword in adverse_keywords:
            if keyword in status_lower:
                return False
        
        # Default to neutral if unclear
        return None
    
    def extract_full_text(self, case_data: Dict[str, Any]) -> str:
        """Extract full text content from case decisions with aggressive token limiting"""
        full_text = ""
        
        # Add case title and basic info
        full_text += f"Case: {case_data.get('Title', '')}\n"
        full_text += f"Citation: {case_data.get('CaseNumber', '')}\n"
        full_text += f"Status: {case_data.get('Status', '')}\n"
        full_text += f"Institution: {case_data.get('Institution', '')}\n\n"
        
        # Extract content from decisions with very aggressive length limiting
        decisions = case_data.get('Decisions', [])
        for decision in decisions:
            full_text += f"Decision: {decision.get('Title', '')}\n"
            full_text += f"Type: {decision.get('Type', '')}\n"
            full_text += f"Date: {decision.get('Date', '')}\n"
            
            # Very aggressive limit on decision content
            decision_content = decision.get('Content', '')
            if len(decision_content) > 1000:  # Limit to ~1000 characters per decision
                decision_content = decision_content[:1000] + "... [Content truncated]"
            full_text += f"Content: {decision_content}\n\n"
            
            # Extract content from opinions with very aggressive limiting
            opinions = decision.get('Opinions', [])
            for opinion in opinions:
                full_text += f"Opinion: {opinion.get('Title', '')}\n"
                full_text += f"Type: {opinion.get('Type', '')}\n"
                full_text += f"Date: {opinion.get('Date', '')}\n"
                
                # Very aggressive limit on opinion content
                opinion_content = opinion.get('Content', '')
                if len(opinion_content) > 500:  # Limit to ~500 characters per opinion
                    opinion_content = opinion_content[:500] + "... [Content truncated]"
                full_text += f"Content: {opinion_content}\n\n"
        
        # Very aggressive final safety check - limit total length
        if len(full_text) > 3000:  # Limit total case text to ~3000 characters
            full_text = full_text[:3000] + "... [Case content truncated]"
        
        return full_text
    
    async def get_relevant_cases(self, query: str, k: int = 2) -> List[Dict[str, Any]]:
        """Get relevant cases for a query without LLM analysis to prevent token overflow"""
        if not self.cases_data or not self.index:
            return []
        
        # Very aggressive limit to prevent token overflow
        k = min(k, 2)  # Maximum 2 cases to stay within token limits
        
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(query_embedding.astype('float32'), k)
        
        # Convert numpy arrays to Python lists to avoid serialization issues
        distances = distances.tolist()
        indices = indices.tolist()
        
        results = []

        # Gather cases without LLM analysis to prevent token overflow
        for i, idx in enumerate(indices[0]):
            if idx != -1:
                case = self.cases_data[idx].copy()
                case.pop('embedding', None)
                
                # Normalize the score
                max_possible_score = float(np.dot(query_embedding[0], query_embedding[0]))
                raw_score = float(distances[0][i])
                case['score'] = min(1.0, raw_score / max_possible_score) if max_possible_score > 0 else 0.0
                
                case['excerpt'] = self.extract_excerpt(case['full_text'], query)
                
                # Add missing fields that the frontend expects
                case['url'] = ''  # No URL for cases
                case['rule_number'] = case.get('citation', '')
                case['heading'] = case.get('case_name', '')
                case['part'] = case.get('institution', '')
                case['part_title'] = case.get('status', '')
                
                # Simple status-based support analysis without LLM
                status = case.get('status', '').lower()
                if 'favor of state' in status or 'state won' in status:
                    support_classification = 'Supportive'
                    support_justification = 'Case decided in favor of state'
                elif 'favor of investor' in status or 'investor won' in status:
                    support_classification = 'Adverse'
                    support_justification = 'Case decided in favor of investor'
                else:
                    support_classification = 'Neutral'
                    support_justification = 'Case outcome unclear from status'
                
                case['support'] = {
                    'classification': support_classification,
                    'justification': support_justification
                }
                
                results.append(case)

        return results

    def extract_excerpt(self, full_text: str, query: str, context_chars: int = 300) -> str:
        """Extract a relevant excerpt from the text"""
        # Simple excerpt extraction - first 300 characters
        excerpt = full_text[:context_chars]
        if len(full_text) > context_chars:
            excerpt += "..."
        return excerpt
    
    def get_case_by_name(self, case_name: str) -> Optional[Dict[str, Any]]:
        """Get case by name"""
        for case in self.cases_data:
            if case_name.lower() in case['case_name'].lower():
                return case
        return None
    
    def search_cases(self, query: str, k: int = 10) -> List[Dict[str, Any]]:
        """Search cases with more detailed results"""
        return self.get_relevant_cases(query, k)

    def get_all_cases(self):
        return self.cases_data 