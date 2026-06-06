import os
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# Define the Pydantic structure for Gemini Response
class AgentResponse(BaseModel):
    response: str = Field(
        description="The text response to show to the customer. Maintain a helpful, friendly, and professional sales tone."
    )
    intent: str = Field(
        description="The detected intent of the user message. Must be one of: FAQ, LeadQualification, Booking, Support, Greeting, Other."
    )
    extracted_name: Optional[str] = Field(
        None, description="The customer's name if they just provided it in their message."
    )
    extracted_email: Optional[str] = Field(
        None, description="The customer's email address if they just provided it in their message."
    )
    extracted_phone: Optional[str] = Field(
        None, description="The customer's phone number if they just provided it in their message."
    )
    extracted_budget: Optional[str] = Field(
        None, description="The customer's budget (e.g. ₹20,000/month) if they just provided it in their message."
    )
    extracted_appointment_date: Optional[str] = Field(
        None, description="The date the customer wants to schedule a call, in YYYY-MM-DD format, if they requested it in their message."
    )
    extracted_appointment_time: Optional[str] = Field(
        None, description="The time of day the customer wants to schedule a call (e.g. '4 PM' or '16:00') if they requested it."
    )
    lead_score: Optional[str] = Field(
        None, description="Score the lead: HOT (provided most contact info & clear intent), WARM (interested, but incomplete info or low budget), COLD (no interest/spam)."
    )


class AIAgentService:
    def __init__(self):
        # The Client will automatically use GEMINI_API_KEY from environment variables
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key or self.api_key == "your-google-gemini-api-key-here":
            # If no API key, we will run in mock mode
            self.client = None
            print("WARNING: GEMINI_API_KEY not set. Running in Mock Mode.")
        else:
            self.client = genai.Client()

    def process_chat(
        self,
        messages: List[Dict[str, str]],
        business_info: Dict[str, Any],
        faqs: List[Dict[str, str]],
        current_lead: Dict[str, Any]
    ) -> AgentResponse:
        
        # Build knowledge base context
        faq_context = ""
        for faq in faqs:
            faq_context += f"Q: {faq.get('title')}\nA: {faq.get('content')}\n\n"

        # Build lead qualification progress
        lead_progress = (
            f"Current accumulated Lead Details:\n"
            f"- Name: {current_lead.get('name') or 'Not provided yet'}\n"
            f"- Email: {current_lead.get('email') or 'Not provided yet'}\n"
            f"- Phone: {current_lead.get('phone') or 'Not provided yet'}\n"
            f"- Budget: {current_lead.get('budget') or 'Not provided yet'}\n"
        )

        # Formulate instructions
        system_instruction = (
            f"You are a premium AI Sales Agent for the business '{business_info.get('companyName')}' on their website.\n"
            f"Business Details:\n"
            f"- Website: {business_info.get('website')}\n"
            f"- Industry: {business_info.get('industry')}\n"
            f"- Description: {business_info.get('description')}\n\n"
            f"Knowledge Base (FAQs & Services info):\n"
            f"{faq_context}\n"
            f"Lead Capture Requirements:\n"
            f"You must qualify the visitor and capture these details: Name, Email, Phone, and Budget.\n"
            f"{lead_progress}\n\n"
            f"Rules:\n"
            f"1. Be friendly, polite, and helpful.\n"
            f"2. Use the Knowledge Base to answer visitor questions accurately. If you don't know, say so and offer to log their details for a call back.\n"
            f"3. If the visitor shows interest, lead-qualify them. Ask for missing details one at a time. Do not ask for all 4 at once (that feels like a form).\n"
            f"4. If they ask to schedule a call/appointment, invite them to state a date/time and confirm you'll book it. Capture that date/time in the fields.\n"
            f"5. You must return your response according to the JSON schema. Analyze the user's latest input, extract any parameters they provided, update the lead_score if appropriate, and write your next text response.\n"
        )

        if not self.client:
            # Return Mock response if Gemini client is not initialized
            return self._mock_response(messages[-1]["content"] if messages else "", current_lead)

        try:
            # Transform chat messages to Gemini SDK contents format
            contents = []
            for msg in messages[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                ))
            
            # The latest message goes in as the prompt
            latest_prompt = messages[-1]["content"] if messages else ""

            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents + [latest_prompt] if contents else latest_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AgentResponse,
                    temperature=0.3,
                )
            )

            # The response.text contains the JSON string matching AgentResponse structure
            return AgentResponse.model_validate_json(response.text)

        except Exception as e:
            print(f"Error in Gemini call: {e}")
            # Fallback to a safe mock/parsing mode or simple error response
            return AgentResponse(
                response="I'm having a little trouble connecting to my systems right now. Could you please share your name and email so I can have our team follow up with you directly?",
                intent="Support",
                lead_score="COLD"
            )

    def _mock_response(self, latest_message: str, current_lead: Dict[str, Any]) -> AgentResponse:
        """Fallback mock agent response when API Key is missing."""
        msg_lower = latest_message.lower()
        
        # Simple rule-based mock agent
        response_text = ""
        intent = "FAQ"
        name = current_lead.get("name")
        email = current_lead.get("email")
        phone = current_lead.get("phone")
        budget = current_lead.get("budget")
        extracted_name = None
        extracted_email = None
        extracted_phone = None
        extracted_budget = None
        extracted_date = None
        extracted_time = None
        
        # Simulated extraction
        if "@" in latest_message and not email:
            import re
            emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', latest_message)
            if emails:
                extracted_email = emails[0]
                email = emails[0]
                
        if ("my name is" in msg_lower or "i am" in msg_lower or "call me" in msg_lower) and not name:
            parts = latest_message.split()
            # simple mock name extraction
            if len(parts) > 2:
                extracted_name = parts[-1].strip(" .!,")
                name = extracted_name

        if not name:
            response_text = "Hello! Thanks for visiting our site. May I know your name and what you're looking for today?"
            intent = "Greeting"
        elif not email:
            response_text = f"Nice to meet you, {name}! How can we help you today? Also, could you share your email address so we can keep in touch?"
            intent = "LeadQualification"
        elif not budget:
            response_text = "Got it! What is your estimated monthly budget for this project? (e.g. ₹20,000/month or $500/month)"
            intent = "LeadQualification"
            extracted_budget = "₹20,000/month"
        else:
            response_text = f"Awesome! I've noted all your details. Would you like to schedule a call tomorrow at 4 PM to discuss this further?"
            intent = "Booking"
            
        if "schedule" in msg_lower or "book" in msg_lower or "call tomorrow" in msg_lower:
            extracted_date = "2026-06-07"
            extracted_time = "4 PM"
            response_text = "Perfect! I've booked that call for you on 2026-06-07 at 4 PM. Our team will contact you then."
            intent = "Booking"

        score = "COLD"
        if name and email:
            score = "WARM"
        if name and email and budget:
            score = "HOT"

        return AgentResponse(
            response=response_text,
            intent=intent,
            extracted_name=extracted_name,
            extracted_email=extracted_email,
            extracted_phone=extracted_phone,
            extracted_budget=extracted_budget,
            extracted_appointment_date=extracted_date,
            extracted_appointment_time=extracted_time,
            lead_score=score
        )
