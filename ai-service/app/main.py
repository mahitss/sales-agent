import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# Enable CORS for frontend and backend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatPayload(BaseModel):
    messages: List[ChatMessage]
    business_info: Dict[str, Any]
    faqs: List[Dict[str, Any]]
    current_lead: Dict[str, Any]

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
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
