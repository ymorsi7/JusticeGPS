import os
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle

class ArbitrationRAGSystem:
    def __init__(self, cases_file: str = "sample_data/cases.json", index_file: str = "cases_index.faiss"):
        self.cases_file = Path(cases_file)
        self.index_file = Path(index_file)
        self.cases_data = []
        self.embeddings = None
        self.index = None
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        
        # Load or build index
        if self.index_file.exists() and Path("cases_index.pkl").exists():
            self.load_index()
        else:
            self.build_index_from_files()
    
    def load_index(self):
        """Load existing FAISS index and case data"""
        print("Loading existing cases index...")
        
        # Load case data
        with open("cases_index.pkl", "rb") as f:
            self.cases_data = pickle.load(f)
        
        # Load FAISS index
        self.index = faiss.read_index(str(self.index_file))
        
        # Load embeddings
        self.embeddings = np.array([case['embedding'] for case in self.cases_data])
        
        print(f"Loaded {len(self.cases_data)} cases from index")
    
    def build_index_from_files(self):
        """Build FAISS index from a single JSON case file"""
        print("Building cases index from file...")
        
        if not self.cases_file.exists():
            print(f"Cases file not found at {self.cases_file}")
            self.cases_data = []
            return

        try:
            with open(self.cases_file, 'r', encoding='utf-8') as f:
                raw_cases = json.load(f)
            print(f"Found {len(raw_cases)} cases in the JSON file.")

            for case_data in raw_cases:
                case_info = self.extract_case_info(case_data)
                if case_info:
                    self.cases_data.append(case_info)
                    
        except Exception as e:
            print(f"Error processing {self.cases_file}: {e}")

        print(f"Processed {len(self.cases_data)} cases")
        
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
        with open("cases_index.pkl", "wb") as f:
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
    
    def determine_supportive_status(self, status: str) -> bool:
        """Determine if case is supportive or adverse based on status"""
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
        """Extract full text content from case decisions"""
        full_text = ""
        
        # Add case title and basic info
        full_text += f"Case: {case_data.get('Title', '')}\n"
        full_text += f"Citation: {case_data.get('CaseNumber', '')}\n"
        full_text += f"Status: {case_data.get('Status', '')}\n"
        full_text += f"Institution: {case_data.get('Institution', '')}\n\n"
        
        # Extract content from decisions
        decisions = case_data.get('Decisions', [])
        for decision in decisions:
            full_text += f"Decision: {decision.get('Title', '')}\n"
            full_text += f"Type: {decision.get('Type', '')}\n"
            full_text += f"Date: {decision.get('Date', '')}\n"
            full_text += f"Content: {decision.get('Content', '')}\n\n"
            
            # Extract content from opinions
            opinions = decision.get('Opinions', [])
            for opinion in opinions:
                full_text += f"Opinion: {opinion.get('Title', '')}\n"
                full_text += f"Type: {opinion.get('Type', '')}\n"
                full_text += f"Date: {opinion.get('Date', '')}\n"
                full_text += f"Content: {opinion.get('Content', '')}\n\n"
        
        return full_text
    
    def get_relevant_cases(self, query: str, k: int = 7) -> List[Dict[str, Any]]:
        """Get relevant cases for a query"""
        if not self.cases_data or not self.index:
            return []
        
        query_embedding = self.model.encode([query])
        distances, indices = self.index.search(query_embedding.astype('float32'), k)

        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.cases_data):
                case = self.cases_data[idx].copy()  # Create a copy to modify
                case['relevance'] = float(distances[0][i])
                case['score'] = 1 - float(distances[0][i])
                
                # Remove the embedding to prevent serialization errors
                case.pop('embedding', None)
                
                # Generate a dynamic excerpt based on the query
                case['excerpt'] = self.extract_excerpt(case['full_text'], query)
                results.append(case)
                
        return results
    
    def extract_excerpt(self, full_text: str, query: str, context_chars: int = 300) -> str:
        """Extract a query-relevant excerpt from the full text."""
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