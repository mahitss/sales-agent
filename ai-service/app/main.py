import os
import time
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.agent import (
    AIAgentService,
    AgentResponse,
    ExtractFAQsResponse,
    CompetitorAnalysisResponse
)
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Beacon AI Sales Agent - AI Service", version="1.0.0")

# Custom Rate Limiter Middleware to mitigate DoS
class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = 100, window: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.cache = {} # IP -> (count, reset_time)

    async def dispatch(self, request: Request, call_next):
        ip = "unknown"
        if request.client:
            ip = request.client.host
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            ip = x_forwarded_for.split(",")[0].strip()
            
        now = time.time()
        
        if ip in self.cache:
            count, reset_time = self.cache[ip]
            if now > reset_time:
                self.cache[ip] = (1, now + self.window)
            elif count >= self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. Please try again later."}
                )
            else:
                self.cache[ip] = (count + 1, reset_time)
        else:
            self.cache[ip] = (1, now + self.window)
            
        return await call_next(request)

app.add_middleware(RateLimitMiddleware, limit=100, window=60)

# Secure CORS: Allow specific origins, disable credentials
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:4000")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

# Strict Input Validation Models
class BusinessInfoModel(BaseModel):
    companyName: str
    website: str
    industry: str
    description: str

class LeadModel(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    budget: Optional[str] = None

class ChatPayload(BaseModel):
    messages: List[ChatMessage]
    business_info: BusinessInfoModel
    faqs: List[Dict[str, Any]]
    current_lead: LeadModel

class ExtractFAQsPayload(BaseModel):
    url: str
    scraped_text: str
    company_name: str
    industry: str
    description: str

class CompetitorAnalysisPayload(BaseModel):
    competitor_url: str
    scraped_text: str
    my_business: Dict[str, Any]

agent_service = AIAgentService()

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Beacon AI Agent Service",
        "mock_mode": agent_service.client is None
    }

@app.post("/chat", response_model=AgentResponse)
def chat_endpoint(payload: ChatPayload):
    try:
        msg_dicts = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        result = agent_service.process_chat(
            messages=msg_dicts,
            business_info=payload.business_info,
            faqs=payload.faqs,
            current_lead=payload.current_lead
        )
        return result
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/extract-faqs", response_model=ExtractFAQsResponse)
def extract_faqs_endpoint(payload: ExtractFAQsPayload):
    try:
        result = agent_service.extract_faqs(
            scraped_text=payload.scraped_text,
            company_name=payload.company_name,
            industry=payload.industry,
            description=payload.description
        )
        return result
    except Exception as e:
        print(f"Error in extract-faqs endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/competitor-analysis", response_model=CompetitorAnalysisResponse)
def competitor_analysis_endpoint(payload: CompetitorAnalysisPayload):
    try:
        result = agent_service.analyze_competitor(
            competitor_url=payload.competitor_url,
            scraped_text=payload.scraped_text,
            my_business=payload.my_business
        )
        return result
    except Exception as e:
        print(f"Error in competitor-analysis endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", os.getenv("AI_PORT", 8000)))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
