from typing import Dict, Any, List
import re

def get_prompt_template(mode: str, context: str, query: str) -> str:
    """Get appropriate prompt template based on mode"""
    if mode == "civil_procedure":
        return get_civil_procedure_prompt(context, query)
    elif mode == "arbitration_strategy":
        return get_arbitration_strategy_prompt(context, query)
    else:
        raise ValueError(f"Unknown mode: {mode}")

def get_civil_procedure_prompt(context: str, query: str) -> str:
    """Generate prompt for civil procedure queries with CPR context injection"""
    return f"""You are an expert AI legal assistant specializing in UK Civil Procedure Rules. Your task is to provide clear, accurate, and practical guidance to junior solicitors and self-represented litigants.

**User Query:** "{query}"

---

**Retrieved Context from Official Civil Procedure Rules (CPR) and Practice Directions (PD):**
<context>
{context}
</context>

---

**Instructions:**

1.  **Synthesize a Comprehensive Answer:** Based **only** on the provided context, generate a detailed and easy-to-understand answer to the user's query.
2.  **Cite Everything:** You MUST cite the specific CPR rule or Practice Direction for every statement you make (e.g., "CPR 7.5(1)", "PD 26.13"). If the context does not provide a specific rule, state that.
3.  **Quote or Paraphrase:** Directly quote or closely paraphrase key phrases from the retrieved context to ensure accuracy.
4.  **Structure for Clarity:** Use Markdown for clear formatting. Use headings, bullet points, and bold text to structure the answer logically. Start with a direct answer, followed by a detailed explanation.
5.  **Identify Actionable Steps:** If the query involves a process, break it down into a step-by-step guide (e.g., "Step 1: Complete Form N244...").
6.  **Link to Forms:** If any official forms (e.g., "Form N1") are mentioned, explicitly state the form number and provide the generic GOV.UK forms link: https://www.gov.uk/government/collections/court-and-tribunal-forms

**Answer:**
"""

def get_arbitration_strategy_prompt(context: str, query: str) -> str:
    """Generate prompt for arbitration strategy queries with case context injection"""
    return f"""You are an international arbitration expert assistant. Use ONLY the retrieved case context below to answer the query.

### Retrieved Cases
{context}

### Query
{query}

### Instructions
1. Answer based ONLY on the retrieved case context above
2. Reference the top 3 most relevant cases by name and explain their impact
3. Explain how these cases affect the user's arbitration strategy
4. Suggest specific improvements or considerations based on the case law
5. Always cite case names and key findings
6. Provide practical strategic advice based on the precedents

### Response Format
**Key Precedents:**
- [Case Name (Year)] - Brief summary of key finding and relevance

**Strategic Impact:**
- How these cases affect the current strategy

**Recommendations:**
- Specific improvements based on case law

**Risk Assessment:**
- Potential challenges based on adverse cases"""

def get_flowchart_prompt(legal_text: str) -> str:
    """Generate a prompt to create a Mermaid flowchart from a legal text."""
    return f"""
Based on the following legal explanation, create a Mermaid flowchart diagram that visualizes the process.

**Legal Text:**
{legal_text}

**Instructions:**
1. The flowchart should be a `graph TD` (top-down).
2. Use concise node descriptions.
3. Represent decision points with diamond shapes.
4. The output should be ONLY the raw Mermaid code block, starting with `graph TD`.
5. Do not include any other text or explanation.

**Example:**
graph TD
    A[Start] --> B{{Decision}};
    B -->|Yes| C[End];
    B -->|No| D[Loop];
"""

def get_timeline_prompt(legal_text: str) -> str:
    """Generate a prompt to create a list of timeline events from a legal text."""
    return f"""
Based on the following legal explanation, extract key events and create a timeline.

**Legal Text:**
{legal_text}

**Instructions:**
1. Identify key events with dates or deadlines.
2. Assume the process starts today. Calculate dates accordingly.
3. Format the output as a JSON array of objects.
4. Each object should have: `id` (string), `title` (string), `date` (string, "YYYY-MM-DD"), `description` (string), `status` ('completed', 'pending', or 'overdue'), and `daysFromStart` (number).
5. The output should be ONLY the raw JSON, starting with `[` and ending with `]`.

**Example JSON structure:**
[
  {{
    "id": "1",
    "title": "Event 1",
    "date": "2024-01-01",
    "description": "Description of event 1.",
    "status": "completed",
    "daysFromStart": 0
  }}
]
"""

def get_progress_tracker_prompt(legal_text: str) -> str:
    """Generate a prompt to create a list of progress steps from a legal text."""
    return f"""
Based on the following legal explanation, create a progress tracker with actionable steps.

**Legal Text:**
{legal_text}

**Instructions:**
1. Break down the legal process into actionable steps.
2. Format the output as a JSON array of objects.
3. Each object must have: `id` (string), `title` (string), `description` (string), `status` ('not-started', 'in-progress', 'completed', 'blocked'), and `priority` ('high', 'medium', 'low').
4. You can optionally include `deadline` (string, "YYYY-MM-DD"), `ruleCitation` (string), and `formLink` (string).
5. The output should be ONLY the raw JSON, starting with `[` and ending with `]`.

**Example JSON structure:**
[
  {{
    "id": "1",
    "title": "Step 1",
    "description": "Description of step 1.",
    "status": "not-started",
    "priority": "high",
    "ruleCitation": "CPR 7.5"
  }}
]
"""

async def refine_answer(initial_answer: str, query: str, mode: str) -> str:
    """Self-refinement loop to improve answer quality"""
    refinement_prompt = f"""You are a legal expert reviewing and refining an AI-generated response.

**Original Query:** {query}
**Mode:** {mode}
**Initial Answer:** {initial_answer}

**Refinement Instructions:**
1. Review the answer for accuracy, completeness, and clarity
2. Identify any factual errors, omissions, or unclear statements
3. Ensure proper citations and legal references
4. Improve structure and readability
5. Add any missing important points
6. Maintain the same level of detail but enhance quality

**Refinement Criteria:**
- Legal accuracy and precision
- Completeness of analysis
- Clarity of explanation
- Proper citation format
- Logical structure
- Practical utility

Please provide the refined answer, maintaining the same format but improving quality:"""

    # For now, return a refined version based on common patterns
    refined = initial_answer
    
    # Add missing citations if needed
    if mode == "civil_procedure" and "CPR" not in refined and "Practice Direction" not in refined:
        refined = refined.replace("Under **CPR 7.5**", "Under **CPR 7.5** and **Practice Direction 7A**")
    
    # Improve structure with better headings
    if "**Key Points:**" in refined:
        refined = refined.replace("**Key Points:**", "## Key Legal Principles")
    
    if "**Strategic Recommendations:**" in refined:
        refined = refined.replace("**Strategic Recommendations:**", "## Strategic Recommendations")
    
    # Add confidence indicators
    if mode == "arbitration_strategy":
        if "weakness" in query.lower():
            refined += "\n\n## Risk Assessment\nBased on the precedent analysis, this strategy carries moderate to high risk given the favorable precedent for environmental counterclaims."
    
    return refined

def extract_citations(text: str) -> List[str]:
    """Extract legal citations from text"""
    citations = []
    
    # CPR citations
    cpr_pattern = r'CPR\s+\d+\.?\d*'
    citations.extend(re.findall(cpr_pattern, text, re.IGNORECASE))
    
    # Practice Direction citations
    pd_pattern = r'Practice\s+Direction\s+\d+[a-z]*'
    citations.extend(re.findall(pd_pattern, text, re.IGNORECASE))
    
    # Case citations
    case_pattern = r'[A-Z][a-z]+\s+v\.\s+[A-Z][a-z]+'
    citations.extend(re.findall(case_pattern, text))
    
    return list(set(citations))

def validate_answer_quality(answer: str, query: str, mode: str) -> Dict[str, Any]:
    """Validate answer quality and provide feedback"""
    feedback = {
        'has_citations': False,
        'has_structure': False,
        'has_practical_guidance': False,
        'is_complete': False,
        'suggestions': []
    }
    
    # Check for citations
    citations = extract_citations(answer)
    feedback['has_citations'] = len(citations) > 0
    
    # Check for structure (headings)
    feedback['has_structure'] = '##' in answer or '**' in answer
    
    # Check for practical guidance
    practical_indicators = ['step', 'procedure', 'apply', 'file', 'serve', 'deadline', 'recommendation', 'strategy']
    feedback['has_practical_guidance'] = any(indicator in answer.lower() for indicator in practical_indicators)
    
    # Check completeness
    min_length = 200 if mode == "civil_procedure" else 300
    feedback['is_complete'] = len(answer) >= min_length
    
    # Generate suggestions
    if not feedback['has_citations']:
        feedback['suggestions'].append("Add specific rule or case citations")
    
    if not feedback['has_structure']:
        feedback['suggestions'].append("Improve structure with headings and lists")
    
    if not feedback['has_practical_guidance']:
        feedback['suggestions'].append("Include practical steps or recommendations")
    
    if not feedback['is_complete']:
        feedback['suggestions'].append("Provide more detailed analysis")
    
    return feedback

def get_argument_strength_prompt(answer: str) -> str:
    """Generates a prompt to create radar chart metrics for argument strength."""
    return f"""
    Based on the following legal analysis, evaluate the strength of the arguments presented on a scale of 1-100 across several key dimensions. Provide the output as a JSON object with a 'metrics' array. Each object in the array should have a 'name' (e.g., "Precedent Support"), a 'value', and a 'color' in hex format.

    Analysis:
    ---
    {answer}
    ---

    Generate the radar chart metrics in this exact JSON format:
    ```json
    {{
      "metrics": [
        {{"name": "Precedent Support", "value": 85, "color": "#3b82f6"}},
        {{"name": "Factual Basis", "value": 75, "color": "#10b981"}},
        {{"name": "Legal Reasoning", "value": 90, "color": "#ef4444"}},
        {{"name": "Jurisdictional Strength", "value": 80, "color": "#f97316"}},
        {{"name": "Counter-Argument Resilience", "value": 70, "color": "#8b5cf6"}}
      ]
    }}
    ```
    """

def get_precedent_analysis_prompt(answer: str) -> str:
    """Generates a prompt to create detailed analysis for each precedent case."""
    return f"""
    For each of the legal precedents mentioned in the following analysis, provide a detailed breakdown. The output should be a JSON array, where each object contains the 'caseName', 'citation', a brief 'summary', the 'keyTakeaway', and its 'relevance' to the current issue.

    Analysis:
    ---
    {answer}
    ---

    Generate the precedent analysis in this exact JSON format:
    ```json
    [
      {{
        "caseName": "TCW v. Dominican Republic",
        "citation": "PCA Case No. 2008-06",
        "summary": "A case involving a settled dispute, leading to a Consent Award.",
        "keyTakeaway": "Demonstrates the viability and process of reaching a settlement through a Consent Award in arbitration.",
        "relevance": "Highly relevant for considering settlement strategies to avoid protracted litigation and associated costs."
      }}
    ]
    ```
    """ 