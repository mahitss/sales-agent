import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from app.services.agent import AIAgentService, AgentResponse
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Beacon AI Sales Agent - AI Service", version="1.0.0")

# Enable CORS for frontend and backend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to dashboard/backend domains
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
        # Convert Pydantic chat messages to dicts
        msg_dicts = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        
        # Call the agent service to process the chat
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

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
