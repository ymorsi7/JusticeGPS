import os
import json
import re
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle
from langchain.text_splitter import MarkdownTextSplitter

def get_cpr_url(part: str, rule: str) -> str:
    """Constructs a URL to a specific CPR rule on the justice.gov.uk website."""
    base_url = "https://www.justice.gov.uk/courts/procedure-rules/civil/rules"
    
    # Part numbers in URLs are typically zero-padded (e.g., part07)
    part_number = re.sub(r'\D', '', part)
    if part_number.isdigit():
        part_formatted = f"part{int(part_number):02d}"
    else:
        # Fallback for non-numeric parts
        part_formatted = part.lower().replace(" ", "")

    rule_anchor = rule.replace('.', '-')
    
    return f"{base_url}/{part_formatted}#{rule_anchor}"

class CPRRAGSystem:
    def __init__(self, data_dir: str = "cpr_data", index_file: str = "cpr_index.faiss"):
        self.data_dir = Path(data_dir)
        self.index_file = Path(index_file)
        self.rules_data = []
        self.embeddings = None
        self.index = None
        self.model = SentenceTransformer("all-MiniLM-L6-v2")
        self.text_splitter = MarkdownTextSplitter()
        self.load_and_index_rules()

    def load_and_index_rules(self):
        """Load all CPR markdown files and build FAISS index"""
        if self.index_file.exists():
            self.load_persisted_index()
        else:
            self.build_index_from_files()
            self.persist_index()

    def build_index_from_files(self):
        """Build index from markdown files"""
        self.rules_data = []
        texts = []
        
        for file in sorted(self.data_dir.glob("*.md")):
            if file.name == "cpr_data_links.json":
                continue
                
            with open(file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract part number and title from filename
            filename_match = re.match(r'(\d+)\s+Part\s+(\d+)\s*[–-]\s*(.+)\.md', file.name)
            if not filename_match:
                # Try alternative format for practice directions
                filename_match = re.match(r'(\d+)\s+Practice\s+Direction\s+(\d+[A-Z]*)\s*[–-]\s*(.+)\.md', file.name)
                if not filename_match:
                    continue
                else:
                    file_num = filename_match.group(1)
                    part_num = f"PD{filename_match.group(2)}"  # Practice Direction
                    part_title = filename_match.group(3)
            else:
                file_num = filename_match.group(1)
                part_num = filename_match.group(2)  # Use the actual part number
                part_title = filename_match.group(3)
            
            # Parse markdown content to extract rules
            rules = self.parse_cpr_markdown(content, part_num, part_title)
            self.rules_data.extend(rules)
            
            # Add full text for embedding
            for rule in rules:
                texts.append(rule['full_text'])
        
        # Build embeddings and FAISS index
        if texts:
            self.embeddings = self.model.encode(texts, show_progress_bar=True, convert_to_numpy=True)
            dim = self.embeddings.shape[1]
            self.index = faiss.IndexFlatL2(dim)
            self.index.add(self.embeddings)

    def parse_cpr_markdown(self, content: str, part_num: str, part_title: str) -> List[Dict[str, Any]]:
        """Parse CPR markdown content to extract individual rules"""
        rules = []
        
        # Look for rule numbers in bold format: **7.5**
        rule_pattern = r'\*\*(\d+\.\d+)\*\*'
        rule_matches = list(re.finditer(rule_pattern, content))
        
        for i, match in enumerate(rule_matches):
            rule_number = match.group(1)
            
            # Get the text after the rule number until the next rule or end
            start_pos = match.end()
            if i + 1 < len(rule_matches):
                end_pos = rule_matches[i + 1].start()
            else:
                end_pos = len(content)
            
            rule_text = content[start_pos:end_pos].strip()
            
            # Extract heading from the text before the rule number
            text_before = content[:match.start()].strip()
            lines_before = text_before.split('\n')
            
            # Look for the last heading (###) before this rule
            heading = f"Rule {rule_number}"
            for line in reversed(lines_before):
                if line.startswith('### '):
                    heading = line.replace('### ', '').strip()
                    break
            
            # Clean up rule text
            full_text = rule_text.strip()
            
            # Extract context (surrounding paragraphs)
            context = self.extract_context(content, match.group(0) + rule_text, [match.group(0), rule_text])
            
            rule_data = {
                'part': part_num,
                'part_title': part_title,
                'rule_number': rule_number,
                'heading': heading,
                'full_text': full_text,
                'context': context,
                'url': get_cpr_url(part_num, rule_number)
            }
            
            rules.append(rule_data)
        
        return rules

    def extract_context(self, full_content: str, section: str, lines: List[str]) -> str:
        """Extract context with surrounding paragraphs"""
        # Find section position in full content
        section_start = full_content.find(section)
        if section_start == -1:
            return section
        
        # Get text before and after the section
        before_text = full_content[max(0, section_start - 500):section_start]
        after_text = full_content[section_start + len(section):section_start + len(section) + 500]
        
        # Extract last paragraph before and first paragraph after
        before_paragraphs = before_text.split('\n\n')
        after_paragraphs = after_text.split('\n\n')
        
        context_parts = []
        if before_paragraphs and before_paragraphs[-1].strip():
            context_parts.append(before_paragraphs[-1].strip())
        
        context_parts.append(section.strip())
        
        if after_paragraphs and after_paragraphs[0].strip():
            context_parts.append(after_paragraphs[0].strip())
        
        return '\n\n'.join(context_parts)

    def persist_index(self):
        """Save index and metadata to disk"""
        if self.index is not None:
            faiss.write_index(self.index, str(self.index_file))
            
            # Save metadata
            metadata_file = self.index_file.with_suffix('.pkl')
            with open(metadata_file, 'wb') as f:
                pickle.dump({
                    'rules_data': self.rules_data,
                    'embeddings': self.embeddings
                }, f)

    def load_persisted_index(self):
        """Load index and metadata from disk"""
        if self.index_file.exists():
            self.index = faiss.read_index(str(self.index_file))
            
            metadata_file = self.index_file.with_suffix('.pkl')
            if metadata_file.exists():
                with open(metadata_file, 'rb') as f:
                    metadata = pickle.load(f)
                    self.rules_data = metadata['rules_data']
                    self.embeddings = metadata['embeddings']

    def get_relevant_rules(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve top-k relevant CPR rules for a query"""
        if self.index is None or not self.rules_data:
            return []
        
        query_emb = self.model.encode([query], convert_to_numpy=True)
        D, I = self.index.search(query_emb, k)
        
        results = []
        for idx, dist in zip(I[0], D[0]):
            if idx >= len(self.rules_data):
                continue
            
            rule = self.rules_data[idx]
            score = float(np.exp(-dist))  # Convert L2 to similarity-like score
            
            # Create excerpt with context
            excerpt = self.create_excerpt(rule, query)
            
            result = {
                'rule_number': rule['rule_number'],
                'heading': rule['heading'],
                'part': rule['part'],
                'part_title': rule['part_title'],
                'excerpt': excerpt,
                'score': round(score, 3),
                'full_text': rule['full_text'],
                'url': rule['url']
            }
            
            results.append(result)
        
        return results

    def create_excerpt(self, rule: Dict[str, Any], query: str) -> str:
        """Create a contextual excerpt for the rule"""
        full_text = rule['full_text']
        
        # If full text is short, return it all
        if len(full_text) < 500:
            return full_text
        
        # Find the most relevant sentence containing query terms
        sentences = re.split(r'[.!?]+', full_text)
        query_terms = query.lower().split()
        
        best_sentence = ""
        best_score = 0
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            score = sum(1 for term in query_terms if term in sentence_lower)
            if score > best_score:
                best_score = score
                best_sentence = sentence
        
        if best_sentence:
            # Get surrounding context
            sentence_pos = full_text.find(best_sentence)
            if sentence_pos != -1:
                start = max(0, sentence_pos - 200)
                end = min(len(full_text), sentence_pos + len(best_sentence) + 200)
                excerpt = full_text[start:end]
                
                # Clean up excerpt
                if start > 0:
                    excerpt = "..." + excerpt
                if end < len(full_text):
                    excerpt = excerpt + "..."
                
                return excerpt
        
        # Fallback to first 500 characters
        return full_text[:500] + "..." if len(full_text) > 500 else full_text

    def get_rule_by_number(self, rule_number: str) -> Optional[Dict[str, Any]]:
        """Get specific rule by number"""
        for rule in self.rules_data:
            if rule['rule_number'] == rule_number:
                return rule
        return None

    def get_rules_by_part(self, part: str) -> List[Dict[str, Any]]:
        """Get all rules from a specific part"""
        return [rule for rule in self.rules_data if rule['part'] == part]

    def search_rules(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """Search rules with semantic similarity"""
        return self.get_relevant_rules(query, k) 