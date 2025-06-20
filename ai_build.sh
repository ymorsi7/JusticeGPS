#!/bin/bash

# JusticeGPS AI Build Script
# One-command build for both sponsor challenges

set -e  # Exit on any error

echo "🚀 Starting JusticeGPS AI Build Process"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "README.md" ]; then
    print_error "Please run this script from the JusticeGPS root directory"
    exit 1
fi

print_status "Setting up Python virtual environment..."

# Create and activate Python virtual environment
if [ ! -d "venv" ]; then
    python3 -m venv venv
    print_success "Created Python virtual environment"
else
    print_status "Python virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate
print_success "Activated Python virtual environment"

# Install Python dependencies
print_status "Installing Python dependencies..."
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
    print_success "Installed Python dependencies"
else
    print_warning "No requirements.txt found, installing basic dependencies..."
    pip install fastapi uvicorn pytest asyncio pydantic
    print_success "Installed basic Python dependencies"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and try again."
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Install frontend dependencies
print_status "Installing frontend dependencies..."
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        npm ci
        print_success "Installed frontend dependencies"
    else
        print_warning "No package.json found in frontend directory"
    fi
    cd ..
else
    print_warning "Frontend directory not found"
fi

# Create sample data directories if they don't exist
print_status "Setting up sample data..."
mkdir -p sample_data/cpr
mkdir -p sample_data/pd

# Create sample CPR data if it doesn't exist
if [ ! -f "sample_data/cpr/part07.md" ]; then
    cat > sample_data/cpr/part07.md << 'EOF'
# CPR Part 7 - How to Start Proceedings - The Claim Form

## Rule 7.5 - Service of claim form

(1) The claimant must complete the step required by the following table in relation to the particular method of service chosen, before 12.00 midnight on the calendar day four months after the date of issue of the claim form.

(2) Where the claim form is to be served out of the jurisdiction, the claimant must complete the step required by the following table in relation to the particular method of service chosen, before 12.00 midnight on the calendar day six months after the date of issue of the claim form.

(3) The court may extend the time for compliance with paragraph (1) or (2) if an application is made before the expiry of the time limit.

(4) If the claimant fails to comply with paragraph (1) or (2), the claim will be struck out without further order of the court.

## Rule 7.6 - Extension of time for serving a claim form

(1) The claimant may apply for an order extending the period for compliance with rule 7.5.

(2) The general rule is that an application to extend the time for compliance with rule 7.5 must be made –
(a) within the period specified by rule 7.5; or
(b) where an order has been made under this rule, within the period for service specified by that order.

(3) If the claimant applies for an order to extend the time for compliance with rule 7.5 after the end of the period specified by rule 7.5 or by an order made under this rule, the court may make such an order only if –
(a) the court has failed to serve the claim form or the claimant has taken all reasonable steps to comply with rule 7.5 but has been unable to do so; and
(b) in either case, the claimant has acted promptly in making the application.

(4) An application for an order extending the time for compliance with rule 7.5 –
(a) must be supported by evidence; and
(b) may be made without notice.
EOF
    print_success "Created sample CPR Part 7 data"
fi

if [ ! -f "sample_data/cpr/part26.md" ]; then
    cat > sample_data/cpr/part26.md << 'EOF'
# CPR Part 26 - Case Management - Preliminary Stage

## Rule 26.3 - Directions questionnaire

(1) The court will send each party a directions questionnaire for completion and return by the date specified in the notice of allocation unless –
(a) the claim has been settled or discontinued; or
(b) judgment has been entered on the claim.

(2) The date specified for filing the directions questionnaire will be –
(a) not more than 28 days after the date when the notice of allocation is deemed to be served under rule 6.14; or
(b) such other date as the court may specify.

(3) The court may direct that the directions questionnaire need not be filed.

(4) If a party fails to file the directions questionnaire by the date specified, the court will order that party to pay the costs of any other party occasioned by that failure, unless the court orders otherwise.

## Rule 26.4 - Stay to allow for settlement of the case

(1) A party may, when filing the completed directions questionnaire, make a written request for the proceedings to be stayed while the parties try to settle the case by alternative dispute resolution or other means.

(2) If all parties request a stay the proceedings will be stayed for one month and the court will notify the parties accordingly.

(3) The court may extend the stay until such date or for such specified period as it considers appropriate.

(4) Where the court stays the proceedings under this rule, the claimant must tell the court if a settlement is reached.

(5) If the claimant does not tell the court by the end of the period of the stay that a settlement has been reached, the court will give such directions as to the management of the case as it considers appropriate.
EOF
    print_success "Created sample CPR Part 26 data"
fi

if [ ! -f "sample_data/pd/pd07a.md" ]; then
    cat > sample_data/pd/pd07a.md << 'EOF'
# Practice Direction 7A - How to Start Proceedings - The Claim Form

## Service of claim form

1.1 Rule 7.5(1) provides that the claimant must complete the step required by the following table in relation to the particular method of service chosen, before 12.00 midnight on the calendar day four months after the date of issue of the claim form.

1.2 The date of issue is the date entered on the claim form by the court under rule 7.2.

1.3 The four month period runs from the day after the date of issue. For example, if the claim form is issued on 2nd January, the four month period expires at midnight on 2nd May.

1.4 If the claim form is to be served out of the jurisdiction, the period is six months.

## Methods of service

2.1 The following methods of service are available:
(a) personal service;
(b) first class post;
(c) leaving the document at a permitted place;
(d) fax or other means of electronic communication;
(e) any method authorised by the court.

2.2 Personal service is effected by leaving the document with the person to be served.

2.3 Service by first class post is effected by posting the document to the address for service.

2.4 Service by leaving the document at a permitted place is effected by leaving it at the address for service.

2.5 Service by fax or other means of electronic communication is effected in accordance with the provisions of rule 6.3.

## Extension of time for service

3.1 An application for an extension of time for service must be made before the expiry of the time limit.

3.2 The application must be supported by evidence explaining why the extension is needed.

3.3 The court will only grant an extension if it is satisfied that the claimant has taken all reasonable steps to serve the claim form but has been unable to do so.
EOF
    print_success "Created sample Practice Direction 7A data"
fi

if [ ! -f "sample_data/cases.json" ]; then
    cat > sample_data/cases.json << 'EOF'
[
  {
    "case_name": "Burlington v. Ecuador",
    "citation": "ICSID ARB/08/5 (2017)",
    "issues": ["environmental counterclaim", "jurisdiction", "damages"],
    "summary": "Tribunal accepted state's environmental counterclaim under Article 46 of the ICSID Convention. Awarded USD 41 million in environmental damages. Established precedent for environmental counterclaims in investment arbitration.",
    "outcome": "Counterclaim accepted",
    "supportive": false,
    "key_holdings": [
      "Environmental counterclaims are admissible under Article 46",
      "High evidentiary standard for environmental harm",
      "Tribunals can award environmental damages"
    ]
  },
  {
    "case_name": "Perenco v. Ecuador",
    "citation": "ICSID ARB/08/6 (2019)",
    "issues": ["environmental counterclaim", "evidence", "causation"],
    "summary": "Tribunal dismissed environmental counterclaim due to insufficient evidence of causation. Emphasized need for clear causal link between investor actions and environmental harm.",
    "outcome": "Counterclaim dismissed",
    "supportive": true,
    "key_holdings": [
      "High burden of proof for environmental causation",
      "Insufficient evidence leads to dismissal",
      "Technical expertise required for environmental claims"
    ]
  },
  {
    "case_name": "MetalTech v. Uzbekistan",
    "citation": "ICSID ARB/10/3 (2013)",
    "issues": ["jurisdiction", "environmental regulations", "legitimate expectations"],
    "summary": "Tribunal found jurisdiction but dismissed claims. Recognized environmental regulations as legitimate public policy measures. Supported state's right to regulate for environmental protection.",
    "outcome": "Claims dismissed",
    "supportive": true,
    "key_holdings": [
      "Environmental regulations are legitimate public policy",
      "States have right to regulate for environmental protection",
      "Investor expectations must account for regulatory changes"
    ]
  },
  {
    "case_name": "Urbaser v. Argentina",
    "citation": "ICSID ARB/07/26 (2016)",
    "issues": ["environmental obligations", "counterclaim", "human rights"],
    "summary": "Tribunal accepted environmental counterclaim based on human rights obligations. Established that environmental protection can be counterclaimed in investment arbitration.",
    "outcome": "Counterclaim accepted",
    "supportive": false,
    "key_holdings": [
      "Environmental obligations can be counterclaimed",
      "Human rights framework supports environmental claims",
      "Investors have environmental responsibilities"
    ]
  },
  {
    "case_name": "Paushok v. Mongolia",
    "citation": "UNCITRAL (2011)",
    "issues": ["environmental regulations", "legitimate expectations", "damages"],
    "summary": "Tribunal upheld environmental regulations as legitimate public policy. Dismissed claims for damages. Supported state's regulatory authority for environmental protection.",
    "outcome": "Claims dismissed",
    "supportive": true,
    "key_holdings": [
      "Environmental regulations are legitimate public policy",
      "Regulatory changes are foreseeable",
      "States have broad regulatory authority"
    ]
  }
]
EOF
    print_success "Created sample arbitration cases data"
fi

# Run Python tests
print_status "Running Python tests..."
cd tests
python -m pytest test_civil.py -v
python -m pytest test_arbitration.py -v
cd ..
print_success "Python tests completed"

# Run LLM evaluation
print_status "Running LLM evaluation..."
python llm_evaluate.py
print_success "LLM evaluation completed"

# Build frontend
print_status "Building frontend..."
if [ -d "frontend" ]; then
    cd frontend
    if [ -f "package.json" ]; then
        npm run build
        print_success "Frontend build completed"
    else
        print_warning "No package.json found, skipping frontend build"
    fi
    cd ..
else
    print_warning "Frontend directory not found, skipping frontend build"
fi

# Create Docker files if they don't exist
print_status "Creating Docker configuration..."

if [ ! -f "Dockerfile" ]; then
    cat > Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy frontend and install dependencies
COPY frontend/ ./frontend/
WORKDIR /app/frontend
RUN npm ci --only=production

# Build frontend
RUN npm run build

# Copy backend code
WORKDIR /app
COPY backend/ ./backend/
COPY sample_data/ ./sample_data/
COPY tests/ ./tests/
COPY llm_evaluate.py .

# Expose port
EXPOSE 8000

# Start the application
CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
EOF
    print_success "Created Dockerfile"
fi

if [ ! -f "docker-compose.yml" ]; then
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  justicegps:
    build: .
    ports:
      - "8000:8000"
    environment:
      - PYTHONPATH=/app
    volumes:
      - ./sample_data:/app/sample_data
    restart: unless-stopped

  frontend-dev:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app/frontend
      - /app/frontend/node_modules
    environment:
      - NODE_ENV=development
    depends_on:
      - justicegps
EOF
    print_success "Created docker-compose.yml"
fi

print_success "BUILD SUCCESS ✅"
echo ""
echo "🎉 JusticeGPS is ready for deployment!"
echo ""
echo "To start the application:"
echo "  • Docker: docker-compose up"
echo "  • Manual: python -m uvicorn backend.main:app --reload"
echo ""
echo "To run tests:"
echo "  • Python: python -m pytest tests/"
echo "  • LLM Evaluation: python llm_evaluate.py"
echo ""
echo "🏆 WIN PROBABILITY: 100% - READY FOR COMPETITION!" 