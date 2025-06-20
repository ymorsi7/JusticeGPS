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

def validate_answer_quality(answer: str, query: str, mode: str) -> Dict[str, Any]:
    """Validate answer quality and provide feedback""" 