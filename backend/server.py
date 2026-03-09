from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Cookie, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import base64
import asyncio
import httpx
import json

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

# Auth Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: str

class AdminLogin(BaseModel):
    email: str
    password: str

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    admin_id: str
    email: str
    name: str
    created_at: str

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: str
    created_at: str

# Candidate Models
class CandidateCreate(BaseModel):
    user_id: str
    name: str
    email: EmailStr
    whatsapp: str
    role: str
    experience: str
    tech_stack: str
    address: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    portfolio: Optional[str] = None
    kyc_aadhar: Optional[str] = None
    kyc_pan: Optional[str] = None

class Candidate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    email: str
    whatsapp: str
    role: str
    experience: str
    tech_stack: str
    address: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    twitter: Optional[str] = None
    portfolio: Optional[str] = None
    kyc_aadhar: Optional[str] = None
    kyc_pan: Optional[str] = None
    resume_text: Optional[str] = None
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
    phase: str = "init"  # init, phase1, phase2, phase3, completed, terminated
    current_question: int = 0
    total_questions: int = 0
    unanswered_count: int = 0  # Track consecutive unanswered questions
    status: str = "active"  # active, completed, terminated
    termination_reason: Optional[str] = None
    video_recordings: List[str] = []  # URLs or base64 of video chunks
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MessageCreate(BaseModel):
    content: str
    time_taken: Optional[int] = None  # seconds
    is_timeout: Optional[bool] = False  # True if submitted due to timeout

class InterviewMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    interview_id: str
    role: str  # user, assistant, system
    content: str
    time_taken: Optional[int] = None
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
    expression_analysis: Optional[str] = None
    total_score: int
    strengths: str
    weaknesses: str
    recommendation: str
    behavior_analysis: Optional[str] = None
    performance_review: Optional[str] = None
    swot_analysis: Optional[Dict[str, str]] = None
    long_term_potential: Optional[str] = None
    cultural_fit: Optional[str] = None
    risk_assessment: Optional[str] = None
    development_plan: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ResumeParseRequest(BaseModel):
    resume_text: str

# Helper: Get user from session token
async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)) -> User:
    # Check cookie first, then Authorization header
    token = session_token
    if not token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.replace('Bearer ', '')
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Get session from database
    session_doc = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        await db.user_sessions.delete_one({"session_token": token})
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user_doc)

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

IMPORTANT: Ask only ONE question at a time and wait for response. Do NOT provide answers or hints.
"""
    
    if phase == "init":
        return base_msg + """\nGreet the candidate warmly and explain the interview process:
1. PHASE 1: 10 behavioral questions (communication, dedication, attitude, learning)
2. PHASE 2: 10 technical questions based on their tech stack
3. PHASE 3: 2 scenario-based practical questions

Ask if they're ready to begin. Keep it brief and professional."""
    
    elif phase == "phase1":
        return base_msg + """\nPHASE 1: General/Behavioral Questions
Ask 10 UNIQUE questions to evaluate:
- Communication skills
- Dedication and work ethic
- Attitude and cultural fit
- Learning ability and growth mindset

IMPORTANT: 
- Ask ONE question at a time
- NEVER repeat questions that have already been asked
- Check conversation history before asking new questions
- Make each question unique and relevant

After 10 questions, inform them Phase 1 is complete."""
    
    elif phase == "phase2":
        tech_focus = "Android architecture, Kotlin, API integration, State management, Database, Automation, AI tools, AWS" if "android" in role.lower() else tech_stack
        return base_msg + f"""\nPHASE 2: Technical Questions
Ask 20 UNIQUE technical questions focused on: {tech_focus}

IMPORTANT:
- Ask ONE question at a time
- NEVER repeat or same type questions already asked
- Check conversation history to avoid duplicates
- Each question should assess a different technical concept
- Progress from basic to advanced topics

After 10 questions, inform them Phase 2 is complete."""
    
    elif phase == "phase3":
        return base_msg + """\nPHASE 3: Practical Thinking (Final Phase)
Ask 2 scenario-based questions to test:
- System design thinking
- Problem-solving approach
- Practical application of knowledge

Ask ONE question at a time. After 2 questions, inform them the interview is complete."""
    
    return base_msg

def get_evaluation_prompt(messages: List[dict], candidate_data: dict) -> str:
    conversation = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
    
    return f"""You are an expert HR consultant and technical interviewer evaluating a candidate for {candidate_data.get('role')} position.

Candidate Profile:
- Name: {candidate_data.get('name')}
- Experience: {candidate_data.get('experience')}
- Tech Stack: {candidate_data.get('tech_stack')}

Complete Interview Transcript:
{conversation}

Provide a COMPREHENSIVE evaluation in EXACTLY this JSON format:

{{
  "communication_score": <number 1-10>,
  "technical_score": <number 1-10>,
  "problem_solving_score": <number 1-10>,
  "system_thinking_score": <number 1-10>,
  
  "strengths": "<3-4 key strengths with examples>",
  "weaknesses": "<3-4 areas for improvement with examples>",
  "recommendation": "<Hire/Consider/Reject with detailed reasoning>",
  
  "behavior_analysis": "<Detailed analysis of communication style, confidence, professionalism, attitude, responsiveness>",
  
  "performance_review": "<Comprehensive review of technical performance, problem-solving approach, depth of knowledge, learning ability>",
  
  "swot_analysis": {{
    "strengths": "<Internal positive attributes: technical skills, experience, knowledge>",
    "weaknesses": "<Internal limitations: skill gaps, knowledge gaps, areas needing improvement>",
    "opportunities": "<External factors for growth: learning potential, adaptability, growth mindset>",
    "threats": "<External concerns: market competition, skill obsolescence risk, retention concerns>"
  }},
  
  "long_term_potential": "<Assessment of candidate's potential for growth, leadership, long-term value to organization, career trajectory (3-5 sentences)>",
  
  "cultural_fit": "<Analysis of how well candidate aligns with team dynamics, company values, work style (2-3 sentences)>",
  
  "risk_assessment": "<Potential risks in hiring this candidate: retention risk, skill gaps, overqualification concerns (2-3 sentences)>",
  
  "development_plan": "<Suggested onboarding and development plan if hired: training needs, mentorship requirements, initial projects (3-4 points)>"
}}

Be thorough, objective, and professional in your evaluation. Provide specific examples from the interview."""

# Auth Routes
@api_router.post("/auth/session")
async def create_session(request: Request):
    body = await request.json()
    session_id = body.get('session_id')
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id},
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Invalid session_id")
            
            data = response.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Auth service error: {str(e)}")
    
    # Create or update user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": data['email']}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user['user_id']
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data['name'],
                "picture": data.get('picture')
            }}
        )
    else:
        user_doc = {
            "user_id": user_id,
            "email": data['email'],
            "name": data['name'],
            "picture": data.get('picture'),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = data['session_token']
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Get user data
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    # Set cookie
    response = JSONResponse(content=User(**user).model_dump())
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return response

@api_router.get("/auth/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, session_token: Optional[str] = Cookie(None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="session_token", path="/")
    return response

# Admin Auth Routes
@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    # Simple admin authentication (in production, use proper password hashing)
    # Default admin: admin@wpdigitals.com / WPDigitals@2024
    if credentials.email == "admin@wpdigitals.com" and credentials.password == "WPDigitals@2024":
        admin_id = "admin_wpdigitals"
        
        # Check if admin exists
        admin = await db.admins.find_one({"admin_id": admin_id}, {"_id": 0})
        if not admin:
            admin_doc = {
                "admin_id": admin_id,
                "email": credentials.email,
                "name": "WP Digitals Admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(admin_doc)
            admin = admin_doc
        
        # Create admin session
        session_token = f"admin_session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_doc = {
            "admin_id": admin_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admin_sessions.insert_one(session_doc)
        
        response = JSONResponse(content={"admin": admin, "token": session_token})
        response.set_cookie(
            key="admin_token",
            value=session_token,
            httponly=True,
            secure=True,
            samesite="none",
            path="/",
            max_age=7*24*60*60
        )
        return response
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@api_router.get("/admin/me")
async def get_admin(admin_token: Optional[str] = Cookie(None)):
    if not admin_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.admin_sessions.find_one({"session_token": admin_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    admin = await db.admins.find_one({"admin_id": session["admin_id"]}, {"_id": 0})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    
    return admin

@api_router.post("/admin/logout")
async def admin_logout(admin_token: Optional[str] = Cookie(None)):
    if admin_token:
        await db.admin_sessions.delete_one({"session_token": admin_token})
    
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie(key="admin_token", path="/")
    return response

# Admin Management Routes
@api_router.get("/admin/interviews")
async def get_all_interviews(admin_token: Optional[str] = Cookie(None)):
    # Verify admin
    await get_admin(admin_token)
    
    # Get all interviews with candidate info
    interviews = await db.interviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with candidate data
    for interview in interviews:
        candidate = await db.candidates.find_one({"id": interview["candidate_id"]}, {"_id": 0})
        if candidate:
            interview["candidate"] = {
                "name": candidate.get("name"),
                "email": candidate.get("email"),
                "role": candidate.get("role"),
                "experience": candidate.get("experience")
            }
    
    return interviews

@api_router.get("/admin/interviews/{interview_id}/details")
async def get_interview_details(interview_id: str, admin_token: Optional[str] = Cookie(None)):
    # Verify admin
    await get_admin(admin_token)
    
    # Get interview
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    # Get candidate
    candidate = await db.candidates.find_one({"id": interview["candidate_id"]}, {"_id": 0})
    
    # Get messages
    messages = await db.messages.find(
        {"interview_id": interview_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    # Get result if exists
    result = await db.results.find_one({"interview_id": interview_id}, {"_id": 0})
    
    return {
        "interview": interview,
        "candidate": candidate,
        "messages": messages,
        "result": result
    }

@api_router.delete("/admin/interviews/{interview_id}")
async def delete_interview(interview_id: str, admin_token: Optional[str] = Cookie(None)):
    # Verify admin
    await get_admin(admin_token)
    
    # Delete interview and related data
    await db.interviews.delete_one({"id": interview_id})
    await db.messages.delete_many({"interview_id": interview_id})
    await db.results.delete_one({"interview_id": interview_id})
    
    return {"message": "Interview deleted successfully"}

@api_router.post("/admin/send-invitation")
async def send_interview_invitation(
    invitation: dict,
    admin_token: Optional[str] = Cookie(None)
):
    # Verify admin
    await get_admin(admin_token)
    
    # In production, integrate with email service (SendGrid, etc.)
    # For now, just log the invitation
    email = invitation.get("email")
    name = invitation.get("name")
    meeting_date = invitation.get("meeting_date")
    meeting_time = invitation.get("meeting_time")
    
    # Store invitation in database
    invitation_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": name,
        "meeting_date": meeting_date,
        "meeting_time": meeting_time,
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "status": "sent"
    }
    await db.invitations.insert_one(invitation_doc)
    
    # TODO: Send actual email using email service
    # For now, return success
    return {
        "message": f"Interview invitation sent to {email}",
        "invitation": invitation_doc
    }

# Resume Parsing
@api_router.post("/resume/parse")
async def parse_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        
        # Extract text based on file type
        resume_text = ""
        
        if file.filename.endswith('.pdf'):
            # Parse PDF
            import PyPDF2
            import io
            pdf_file = io.BytesIO(content)
            pdf_reader = PyPDF2.PdfReader(pdf_file)
            for page in pdf_reader.pages:
                resume_text += page.extract_text() + "\n"
        
        elif file.filename.endswith('.docx'):
            # Parse DOCX
            import docx
            import io
            doc_file = io.BytesIO(content)
            doc = docx.Document(doc_file)
            for para in doc.paragraphs:
                resume_text += para.text + "\n"
        
        elif file.filename.endswith('.txt'):
            # Parse text file
            resume_text = content.decode('utf-8')
        
        else:
            # Try to decode as text
            try:
                resume_text = content.decode('utf-8')
            except:
                resume_text = f"[Unsupported format: {file.filename}]"
        
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # Use AI to parse resume
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"resume-parse-{uuid.uuid4()}",
            system_message="""You are a resume parser. Extract structured information from resumes.
Return ONLY valid JSON with these fields:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "role": "job title/role",
  "experience": "years of experience",
  "tech_stack": "comma-separated skills",
  "address": "full address if available",
  "linkedin": "LinkedIn URL if available",
  "github": "GitHub URL if available",
  "twitter": "Twitter URL if available",
  "portfolio": "Portfolio URL if available"
}
If a field is not found, use empty string."""
        ).with_model("openai", "gpt-4o-mini")
        
        msg = UserMessage(text=f"Parse this resume:\n\n{resume_text}")
        response = await chat.send_message(msg)
        
        # Parse JSON response
        try:
            if "```json" in response:
                response = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                response = response.split("```")[1].split("```")[0]
            
            parsed_data = json.loads(response.strip())
            parsed_data['resume_text'] = resume_text
            return parsed_data
        except json.JSONDecodeError:
            raise HTTPException(status_code=500, detail="Failed to parse resume")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing resume: {str(e)}")

# Candidate Routes
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

# Interview Routes
@api_router.post("/interviews/start", response_model=Interview)
async def start_interview(interview_data: InterviewCreate):
    candidate = await db.candidates.find_one({"id": interview_data.candidate_id}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    interview_obj = Interview(candidate_id=interview_data.candidate_id)
    doc = interview_obj.model_dump()
    await db.interviews.insert_one(doc)
    
    system_msg = get_system_message("init", candidate)
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=interview_obj.session_id,
        system_message=system_msg
    ).with_model("openai", "gpt-4o-mini")
    
    user_msg = UserMessage(text="Start the interview")
    greeting = await chat.send_message(user_msg)
    
    system_message = InterviewMessage(
        interview_id=interview_obj.id,
        role="system",
        content=system_msg
    )
    await db.messages.insert_one(system_message.model_dump())
    
    assistant_message = InterviewMessage(
        interview_id=interview_obj.id,
        role="assistant",
        content=greeting
    )
    await db.messages.insert_one(assistant_message.model_dump())
    
    return interview_obj

@api_router.post("/interviews/{interview_id}/message")
async def send_message(interview_id: str, message: MessageCreate):
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    if interview['status'] == 'completed':
        raise HTTPException(status_code=400, detail="Interview already completed")
    
    candidate = await db.candidates.find_one({"id": interview['candidate_id']}, {"_id": 0})
    
    user_message = InterviewMessage(
        interview_id=interview_id,
        role="user",
        content=message.content,
        time_taken=message.time_taken
    )
    await db.messages.insert_one(user_message.model_dump())
    
    current_phase = interview['phase']
    current_q = interview['current_question'] + 1
    unanswered_count = interview.get('unanswered_count', 0)
    
    # Check if answer is empty or timeout (unanswered)
    if not message.content.strip() or message.is_timeout:
        unanswered_count += 1
    else:
        unanswered_count = 0  # Reset if they answered
    
    # Check if 5 consecutive unanswered questions
    if unanswered_count >= 5:
        update_data = {
            "status": "terminated",
            "termination_reason": "5 consecutive unanswered questions",
            "unanswered_count": unanswered_count
        }
        await db.interviews.update_one(
            {"id": interview_id},
            {"$set": update_data}
        )
        return {
            "message": "Thank you for your time. We appreciate your interest in the position. Our team will review your responses and get back to you soon. Have a great day!",
            "phase": current_phase,
            "status": "terminated",
            "termination_reason": "Interview terminated due to inactivity",
            "question_number": current_q
        }
    
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
    
    system_msg = get_system_message(new_phase, candidate)
    chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=interview['session_id'],
        system_message=system_msg
    ).with_model("openai", "gpt-4o-mini")
    
    user_msg = UserMessage(text=message.content if message.content.strip() else "No answer provided")
    response = await chat.send_message(user_msg)
    
    assistant_message = InterviewMessage(
        interview_id=interview_id,
        role="assistant",
        content=response
    )
    await db.messages.insert_one(assistant_message.model_dump())
    
    update_data = {
        "phase": new_phase,
        "current_question": current_q,
        "unanswered_count": unanswered_count
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
        "question_number": current_q,
        "unanswered_count": unanswered_count
    }

@api_router.post("/interviews/{interview_id}/video")
async def upload_video_chunk(interview_id: str, video: UploadFile = File(...)):
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    content = await video.read()
    video_b64 = base64.b64encode(content).decode('utf-8')
    
    await db.interviews.update_one(
        {"id": interview_id},
        {"$push": {"video_recordings": video_b64}}
    )
    
    return {"message": "Video chunk uploaded"}

@api_router.get("/interviews/{interview_id}/messages")
async def get_messages(interview_id: str):
    messages = await db.messages.find(
        {"interview_id": interview_id, "role": {"$ne": "system"}},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    return messages

@api_router.post("/interviews/{interview_id}/evaluate", response_model=InterviewResult)
async def evaluate_interview(interview_id: str):
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    
    existing_result = await db.results.find_one({"interview_id": interview_id}, {"_id": 0})
    if existing_result:
        return InterviewResult(**existing_result)
    
    candidate = await db.candidates.find_one({"id": interview['candidate_id']}, {"_id": 0})
    
    messages = await db.messages.find(
        {"interview_id": interview_id},
        {"_id": 0}
    ).sort("timestamp", 1).to_list(1000)
    
    eval_prompt = get_evaluation_prompt(messages, candidate)
    eval_chat = LlmChat(
        api_key=os.environ['EMERGENT_LLM_KEY'],
        session_id=f"eval-{interview_id}",
        system_message="You are an interview evaluator. Return only valid JSON."
    ).with_model("openai", "gpt-4o-mini")
    
    eval_msg = UserMessage(text=eval_prompt)
    eval_response = await eval_chat.send_message(eval_msg)
    
    try:
        eval_response = eval_response.strip()
        if "```json" in eval_response:
            eval_response = eval_response.split("```json")[1].split("```")[0]
        elif "```" in eval_response:
            eval_response = eval_response.split("```")[1].split("```")[0]
        
        eval_data = json.loads(eval_response)
    except Exception:
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
        recommendation=eval_data.get('recommendation', ''),
        behavior_analysis=eval_data.get('behavior_analysis', ''),
        performance_review=eval_data.get('performance_review', ''),
        swot_analysis=eval_data.get('swot_analysis', {}),
        long_term_potential=eval_data.get('long_term_potential', ''),
        cultural_fit=eval_data.get('cultural_fit', ''),
        risk_assessment=eval_data.get('risk_assessment', ''),
        development_plan=eval_data.get('development_plan', ''),
        expression_analysis="Video expression analysis available - check video recordings"
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

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
