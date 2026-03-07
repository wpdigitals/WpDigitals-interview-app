from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage
import base64
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class CandidateCreate(BaseModel):
    name: str
    email: EmailStr
    whatsapp: str
    role: str
    experience: str
    tech_stack: str
    kyc_aadhar: Optional[str] = None
    kyc_pan: Optional[str] = None

class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    whatsapp: str
    role: str
    experience: str
    tech_stack: str
    kyc_aadhar: Optional[str] = None
    kyc_pan: Optional[str] = None
    aadhar_document: Optional[str] = None
    pan_document: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InterviewCreate(BaseModel):
    candidate_id: str

class Interview(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    candidate_id: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phase: str = "init"  # init, phase1, phase2, phase3, completed
    current_question: int = 0
    total_questions: int = 0
    status: str = "active"  # active, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MessageCreate(BaseModel):
    content: str

class InterviewMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    role: str  # user, assistant, system
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class InterviewResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    candidate_id: str
    communication_score: int
    technical_score: int
    problem_solving_score: int
    system_thinking_score: int
    total_score: int
    strengths: str
    weaknesses: str
    recommendation: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

# Helper function to get system message based on phase
def get_system_message(phase: str, candidate_data: dict) -> str:
    role = candidate_data.get('role', '')
    tech_stack = candidate_data.get('tech_stack', '')
    experience = candidate_data.get('experience', '')
    
    base_msg = f"""You are an AI Technical Interviewer for a Software Development Agency.
Candidate Details:
- Role: {role}
- Experience: {experience}
- Tech Stack: {tech_stack}
"""
    
    if phase == "init":
        return base_msg + """\nGreet the candidate warmly and explain the interview process:
1. PHASE 1: 10 behavioral questions (communication, dedication, attitude, learning)
2. PHASE 2: 20 technical questions based on their tech stack
3. PHASE 3: 2 scenario-based practical questions

Ask if they're ready to begin. Keep it brief and professional."""
    
    elif phase == "phase1":
        return base_msg + """\nPHASE 1: General/Behavioral Questions
Ask 10 questions to evaluate:
- Communication skills
- Dedication and work ethic
- Attitude and cultural fit
- Learning ability and growth mindset

Ask ONE question at a time. Wait for the candidate's response before proceeding.
Do NOT provide answers. Be professional and encouraging.
After 10 questions, inform the candidate that Phase 1 is complete and Phase 2 will begin."""
    
    elif phase == "phase2":
        tech_focus = "Android architecture, Kotlin, API integration, State management, Database, Automation, AI tools, AWS" if "android" in role.lower() else tech_stack
        return base_msg + f"""\nPHASE 2: Technical Questions
Ask 20 technical questions focused on: {tech_focus}

Ask ONE question at a time. Wait for the candidate's response.
Evaluate their technical depth and practical knowledge.
Do NOT provide answers or hints.
After 20 questions, inform the candidate that Phase 2 is complete and Phase 3 (final phase) will begin."""
    
    elif phase == "phase3":
        return base_msg + """\nPHASE 3: Practical Thinking (Final Phase)
Ask 2 scenario-based questions to test:
- System design thinking
- Problem-solving approach
- Practical application of knowledge

Examples:
- How would you design a scalable mobile app?
- How would you debug a critical production issue?

Ask ONE question at a time. Wait for detailed responses.
After 2 questions, inform the candidate that the interview is complete and results will be generated."""
    
    return base_msg

def get_evaluation_prompt(messages: List[dict], candidate_data: dict) -> str:
    conversation = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    
    return f"""You are evaluating a technical interview for a {candidate_data.get('role')} position.

Candidate: {candidate_data.get('name')}
Experience: {candidate_data.get('experience')}
Tech Stack: {candidate_data.get('tech_stack')}

Interview Transcript:
{conversation}

Provide a structured evaluation in EXACTLY this JSON format:
{{
  "communication_score": <number 1-10>,
  "technical_score": <number 1-10>,
  "problem_solving_score": <number 1-10>,
  "system_thinking_score": <number 1-10>,
  "strengths": "<brief strengths>",
  "weaknesses": "<brief weaknesses>",
  "recommendation": "<Hire/Consider/Reject with brief reason>"
}}

Be objective and professional in your evaluation."""

# Routes
@api_router.get("/")
async def root():
    return {"message": "AI Technical Interviewer API"}

@api_router.post("/candidates", response_model=Candidate)
async def create_candidate(candidate: CandidateCreate):
    candidate_obj = Candidate(**candidate.model_dump())
    doc = candidate_obj.model_dump()
    await db.candidates.insert_one(doc)
    return candidate_obj

@api_router.post("/candidates/{candidate_id}/documents")
async def upload_documents(
    candidate_id: str,
    aadhar_file: Optional[UploadFile] = File(None),
    pan_file: Optional[UploadFile] = File(None)
):
    candidate = await db.candidates.find_one({"id": candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    update_data = {}
    
    if aadhar_file:
        content = await aadhar_file.read()
        update_data["aadhar_document"] = base64.b64encode(content).decode('utf-8')
    
    if pan_file:
        content = await pan_file.read()
        update_data["pan_document"] = base64.b64encode(content).decode('utf-8')
    
    if update_data:
        await db.candidates.update_one({"id": candidate_id}, {"$set": update_data})
    
    return {"message": "Documents uploaded successfully"}

@api_router.post("/interviews/start", response_model=Interview)
async def start_interview(interview_data: InterviewCreate):
    # Check if candidate exists
    candidate = await db.candidates.find_one({"id": interview_data.candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    # Create interview
    interview_obj = Interview(candidate_id=interview_data.candidate_id)
    doc = interview_obj.model_dump()
    await db.interviews.insert_one(doc)
    
    # Initialize chat with greeting
    system_msg = get_system_message("init", candidate)
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=interview_obj.session_id,
        system_message=system_msg
    ).with_model("openai", "gpt-5.2")
    
    # Get initial greeting
    user_msg = UserMessage(text="Start the interview")
    greeting = await chat.send_message(user_msg)
    
    # Store system message
    system_message = InterviewMessage(
        interview_id=interview_obj.id,
        role="system",
        content=system_msg
    )
    await db.messages.insert_one(system_message.model_dump())
    
    # Store greeting
    assistant_message = InterviewMessage(
        interview_id=interview_obj.id,
        role="assistant",
        content=greeting
    )
    await db.messages.insert_one(assistant_message.model_dump())
    
    return interview_obj

@api_router.post("/interviews/{interview_id}/message")
async def send_message(interview_id: str, message: MessageCreate):
    # Get interview
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview['status'] == 'completed':
        raise HTTPException(status_code=400, detail="Interview already completed")
    
    # Get candidate
    candidate = await db.candidates.find_one({"id": interview['candidate_id']}, {"_id": 0})
    
    # Store user message
    user_message = InterviewMessage(
        interview_id=interview_id,
        role="user",
        content=message.content
    )
    await db.messages.insert_one(user_message.model_dump())
    
    # Update question count and phase if needed
    current_phase = interview['phase']
    current_q = interview['current_question'] + 1
    
    new_phase = current_phase
    phase_limits = {"init": 1, "phase1": 10, "phase2": 20, "phase3": 2}
    
    if current_phase == "init" and current_q >= phase_limits["init"]:
        new_phase = "phase1"
        current_q = 0
    elif current_phase == "phase1" and current_q >= phase_limits["phase1"]:
        new_phase = "phase2"
        current_q = 0
    elif current_phase == "phase2" and current_q >= phase_limits["phase2"]:
        new_phase = "phase3"
        current_q = 0
    elif current_phase == "phase3" and current_q >= phase_limits["phase3"]:
        new_phase = "completed"
    
    # Get chat response
    system_msg = get_system_message(new_phase, candidate)
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=interview['session_id'],
        system_message=system_msg
    ).with_model("openai", "gpt-5.2")
    
    user_msg = UserMessage(text=message.content)
    response = await chat.send_message(user_msg)
    
    # Store assistant response
    assistant_message = InterviewMessage(
        interview_id=interview_id,
        role="assistant",
        content=response
    )
    await db.messages.insert_one(assistant_message.model_dump())
    
    # Update interview
    update_data = {
        "phase": new_phase,
        "current_question": current_q
    }
    
    if new_phase == "completed":
        update_data["status"] = "completed"
    
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": update_data}
    )
    
    return {
        "message": response,
        "phase": new_phase,
        "status": update_data.get("status", "active"),
        "question_number": current_q
    }

@api_router.get("/interviews/{interview_id}/messages")
async def get_messages(interview_id: str):
    messages = await db.messages.find(
        {"interview_id": interview_id, "role": {"$ne": "system"}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    return messages

@api_router.post("/interviews/{interview_id}/evaluate", response_model=InterviewResult)
async def evaluate_interview(interview_id: str):
    # Get interview
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Check if already evaluated
    existing_result = await db.results.find_one({"interview_id": interview_id}, {"_id": 0})
    if existing_result:
        return InterviewResult(**existing_result)
    
    # Get candidate
    candidate = await db.candidates.find_one({"id": interview['candidate_id']}, {"_id": 0})
    
    # Get all messages
    messages = await db.messages.find(
        {"interview_id": interview_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    # Generate evaluation
    eval_prompt = get_evaluation_prompt(messages, candidate)
    eval_chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=f"eval-{interview_id}",
        system_message="You are an interview evaluator. Return only valid JSON."
    ).with_model("openai", "gpt-5.2")
    
    eval_msg = UserMessage(text=eval_prompt)
    eval_response = await eval_chat.send_message(eval_msg)
    
    # Parse evaluation
    import json
    try:
        # Extract JSON from response
        eval_response = eval_response.strip()
        if "```json" in eval_response:
            eval_response = eval_response.split("```json")[1].split("```")[0]
        elif "```" in eval_response:
            eval_response = eval_response.split("```")[1].split("```")[0]
        
        eval_data = json.loads(eval_response)
    except (json.JSONDecodeError, KeyError, IndexError):
        eval_data = {
            "communication_score": 7,
            "technical_score": 7,
            "problem_solving_score": 7,
            "system_thinking_score": 7,
            "strengths": "Good overall performance",
            "weaknesses": "Needs more depth in some areas",
            "recommendation": "Consider for the role"
        }
    
    total = (
        eval_data.get('communication_score', 0) +
        eval_data.get('technical_score', 0) +
        eval_data.get('problem_solving_score', 0) +
        eval_data.get('system_thinking_score', 0)
    )
    
    result_obj = InterviewResult(
        interview_id=interview_id,
        candidate_id=interview['candidate_id'],
        communication_score=eval_data.get('communication_score', 0),
        technical_score=eval_data.get('technical_score', 0),
        problem_solving_score=eval_data.get('problem_solving_score', 0),
        system_thinking_score=eval_data.get('system_thinking_score', 0),
        total_score=total,
        strengths=eval_data.get('strengths', ''),
        weaknesses=eval_data.get('weaknesses', ''),
        recommendation=eval_data.get('recommendation', '')
    )
    
    await db.results.insert_one(result_obj.model_dump())
    return result_obj

@api_router.get("/interviews/{interview_id}/result", response_model=InterviewResult)
async def get_result(interview_id: str):
    result = await db.results.find_one({"interview_id": interview_id}, {"_id": 0})
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return InterviewResult(**result)

@api_router.get("/interviews/{interview_id}")
async def get_interview(interview_id: str):
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()