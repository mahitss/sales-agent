import os
import re
import time
import json
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from google.genai import Client, types
from dotenv import load_dotenv

load_dotenv()

# Setup logging for this module
logger = logging.getLogger("ai-service.agent")

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
    lead_sentiment: Optional[str] = Field(
        None, description="The customer's sentiment in their message: Positive, Neutral, Negative, or Inquisitive."
    )
    engagement_score: Optional[int] = Field(
        None, description="A rating of customer engagement from 0 (completely uninterested) to 100 (ready to purchase/extremely active)."
    )


# FAQ Extraction Models
class FAQItem(BaseModel):
    title: str = Field(description="The question part of the FAQ.")
    content: str = Field(description="The answer part of the FAQ.")

class ExtractFAQsResponse(BaseModel):
    faqs: List[FAQItem] = Field(description="List of extracted FAQs.")


# Competitor Analysis Models
class ServiceCompareItem(BaseModel):
    feature: str = Field(description="The feature or service name being compared.")
    us: str = Field(description="How our business implements/offers this feature.")
    competitor: str = Field(description="How the competitor implements/offers this feature.")

class CompetitorAnalysisResponse(BaseModel):
    serviceCompare: List[ServiceCompareItem] = Field(description="Service comparison matrix.")
    missingOfferings: List[str] = Field(description="List of services/features the competitor has but we lack.")
    contentGaps: List[str] = Field(description="SEO content gaps or keyword areas we should cover.")


class ScoringFactors(BaseModel):
    budget: str = Field(description="Scoring assessment of budget.")
    urgency: str = Field(description="Scoring assessment of urgency.")
    timeline: str = Field(description="Scoring assessment of timeline.")
    decision_maker_status: str = Field(description="Is this contact a decision-maker?")
    business_size: str = Field(description="Calculated size of customer's business.")
    service_match: str = Field(description="Assessment of service match level.")
    engagement: int = Field(description="Engagement score value 0-100.")

class LeadScoring(BaseModel):
    score: int = Field(description="Lead intelligence score 0-100.")
    deal_probability: float = Field(description="Probability of closing project (0.0 to 1.0).")
    classification: str = Field(description="One of: HOT, WARM, COLD.")
    factors: ScoringFactors = Field(description="Scoring engine calculation factors.")

class SummaryAndAnalysis(BaseModel):
    summary: str = Field(description="1-2 sentences overview of this lead's needs.")
    goals: str = Field(description="Customer business goals.")
    pain_points: str = Field(description="Current friction or issues described.")
    requested_services: List[str] = Field(description="List of requested services matching features.")
    timeline: str = Field(description="Lead timeline constraint description.")
    objections: str = Field(description="Stated hesitations or concerns.")
    recommended_action: str = Field(description="Recommended follow-up action for human agent.")

class CompanyInfo(BaseModel):
    company_name: str = Field(description="Extracted company name.")
    website: Optional[str] = Field(None, description="Extracted website URL.")
    industry: Optional[str] = Field(None, description="Extracted industry name.")
    description: Optional[str] = Field(None, description="Extracted company description.")
    company_size: Optional[str] = Field(None, description="Extracted company size range.")
    country: Optional[str] = Field(None, description="Extracted country.")
    social_links: Dict[str, str] = Field(default={}, description="Links to social profiles.")

class ConversationIntelligence(BaseModel):
    intent: str = Field(description="Primary intent of conversation.")
    purchase_readiness: str = Field(description="Estimated readiness level (High, Medium, Low).")
    sentiment: str = Field(description="Sentiment polarity: Positive, Neutral, Negative.")
    objections: str = Field(description="Summary of main objections raised.")
    frequent_topics: List[str] = Field(description="Frequently mentioned terms or topics.")
    conversion_risk: str = Field(description="Risk assessment for conversion (High, Medium, Low).")

class RevenuePredictionModel(BaseModel):
    estimated_value: float = Field(description="Estimated total deal value in Rupees. If range, use average. If not mentioned, estimate based on industry averages.")
    deal_probability: float = Field(description="Probability of closing project (0.0 to 1.0).")
    expected_revenue: float = Field(description="Calculated expected revenue: estimated_value * deal_probability.")

class AnalyzeLeadResponse(BaseModel):
    summary: SummaryAndAnalysis = Field(description="AI Lead Summary analysis.")
    scoring: LeadScoring = Field(description="Lead scoring metrics.")
    enrichment: CompanyInfo = Field(description="Enriched company details.")
    intelligence: ConversationIntelligence = Field(description="Conversation intent analytics.")
    revenue: RevenuePredictionModel = Field(description="Expected value parameters.")


class AccountIntelligenceResponse(BaseModel):
    summary: str = Field(description="A concise summary of the company, its mission, and its value proposition.")
    industry: str = Field(description="The primary industry or sector of the company.")
    employee_estimate: str = Field(description="An estimate of the company size or employee count range (e.g., '100-500 employees').")
    tech_stack: List[str] = Field(description="Key technologies, software, frameworks, or platforms detected in use.")
    challenges: List[str] = Field(description="Likely business challenges or pain points faced by the company.")
    opportunities: List[str] = Field(description="Key sales opportunities, new product matches, or value-add areas for our offerings.")
    buying_signals: List[str] = Field(description="Growth or buying signals detected (e.g., hiring, fundraising, expansion, new product launches).")
    outreach_strategy: str = Field(description="A recommended personalized sales outreach strategy.")
    email_draft: str = Field(description="A draft of a personalized outreach email targeting the company's pain points.")
    meeting_notes: str = Field(description="Meeting preparation notes to guide a sales representative during a first call.")

class ScoreCriteria(BaseModel):
    score: int = Field(description="Score from 0 to 100 for this specific criterion.")
    details: str = Field(description="Reasoning or description of findings for this criterion.")

class LeadScoreResponse(BaseModel):
    score: int = Field(description="Overall consolidated lead score (0-100).")
    priority_level: str = Field(description="Priority level: HIGH, MEDIUM, or LOW.")
    reasoning: str = Field(description="Detailed overview reasoning for the overall score.")
    recommended_next_action: str = Field(description="Actionable next step for the sales representative.")
    
    buying_intent: ScoreCriteria = Field(description="Buying intent signal scoring and analysis.")
    company_growth_signals: ScoreCriteria = Field(description="Company growth signal scoring and analysis (e.g. funding, expansion).")
    hiring_signals: ScoreCriteria = Field(description="Hiring signal scoring and analysis (e.g. open job roles, recruitment trends).")
    engagement_activity: ScoreCriteria = Field(description="Engagement activity scoring and analysis (e.g. conversation velocity, responsiveness).")
    website_activity: ScoreCriteria = Field(description="Website activity scoring and analysis (e.g. page views, session durations).")
    email_activity: ScoreCriteria = Field(description="Email activity scoring and analysis (e.g. emails exchanged, open rates).")


class AIAgentService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if (
            not self.api_key 
            or self.api_key.strip() == "" 
            or self.api_key.strip() == "your-google-gemini-api-key-here"
        ):
            self.client = None
            logger.warning("WARNING: GEMINI_API_KEY not set or placeholder detected. Running in Mock Mode.")
        else:
            self.client = Client(api_key=self.api_key)

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

        tone = business_info.get('agentTone') or 'PROFESSIONAL'
        custom_instructions = business_info.get('agentPrompt') or ''

        # Formulate instructions
        system_instruction = (
            f"You are a premium AI Sales Agent for the business '{business_info.get('companyName')}' on their website.\n"
            f"Adopt a {tone} conversational sales tone at all times.\n"
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
            f"1. Conversational Tone: Maintain a {tone} tone.\n"
            f"2. Use the Knowledge Base to answer visitor questions accurately. If you don't know, say so and offer to log their details for a call back.\n"
            f"3. If the visitor shows interest, lead-qualify them. Ask for missing details one at a time. Do not ask for all 4 at once (that feels like a form).\n"
            f"4. If they ask to schedule a call/appointment, invite them to state a date/time and confirm you'll book it. Capture that date/time in the fields.\n"
            f"5. Analyze the user's latest input and determine lead_sentiment (Positive, Neutral, Negative, or Inquisitive) and compute an engagement_score (0-100) based on their interest level.\n"
            f"6. Custom Prompts / Rules: {custom_instructions}\n\n"
            f"You must return your response according to the JSON schema. Analyze the user's latest input, extract any parameters they provided, update the lead_score, lead_sentiment, and engagement_score, and write your next text response.\n"
        )

        if not self.client:
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

            # Try generating content with retries
            max_retries = 3
            backoff_factor = 0.5
            for attempt in range(max_retries):
                try:
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
                    return AgentResponse.model_validate_json(response.text)
                except Exception as e:
                    logger.warning(f"Gemini API attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(backoff_factor * (2 ** attempt))

        except Exception as e:
            logger.exception("Error in Gemini call")
            return AgentResponse(
                response="I'm having a little trouble connecting to my systems right now. Could you please share your name and email so I can have our team follow up with you directly?",
                intent="Support",
                lead_score="COLD",
                lead_sentiment="Neutral",
                engagement_score=10
            )

    def process_chat_stream(
        self,
        messages: List[Dict[str, str]],
        business_info: Dict[str, Any],
        faqs: List[Dict[str, str]],
        current_lead: Dict[str, Any]
    ):
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

        tone = business_info.get('agentTone') or 'PROFESSIONAL'
        custom_instructions = business_info.get('agentPrompt') or ''

        # Formulate instructions
        system_instruction = (
            f"You are a premium AI Sales Agent for the business '{business_info.get('companyName')}' on their website.\n"
            f"Adopt a {tone} conversational sales tone at all times.\n"
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
            f"1. Conversational Tone: Maintain a {tone} tone.\n"
            f"2. Use the Knowledge Base to answer visitor questions accurately. If you don't know, say so and offer to log their details for a call back.\n"
            f"3. If the visitor shows interest, lead-qualify them. Ask for missing details one at a time. Do not ask for all 4 at once (that feels like a form).\n"
            f"4. If they ask to schedule a call/appointment, invite them to state a date/time and confirm you'll book it. Capture that date/time in the fields.\n"
            f"5. Custom Prompts / Rules: {custom_instructions}\n"
        )

        if not self.client:
            mock_res = self._mock_response(messages[-1]["content"] if messages else "", current_lead)
            words = mock_res.response.split(" ")
            for word in words:
                yield f"data: {json.dumps({'text': word + ' '})}\n\n"
                time.sleep(0.08)
            meta = mock_res.model_dump()
            meta.pop("response", None)
            yield f"data: {json.dumps({'metadata': meta})}\n\n"
            return

        try:
            # Transform chat messages to Gemini SDK contents format
            contents = []
            for msg in messages[:-1]:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["content"])]
                ))
            
            latest_prompt = messages[-1]["content"] if messages else ""

            # Call generate_content_stream with retry
            max_retries = 3
            backoff_factor = 0.5
            response_stream = None
            for attempt in range(max_retries):
                try:
                    response_stream = self.client.models.generate_content_stream(
                        model='gemini-2.5-flash',
                        contents=contents + [latest_prompt] if contents else latest_prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=system_instruction,
                            temperature=0.3,
                        )
                    )
                    break
                except Exception as e:
                    logger.warning(f"Gemini API stream attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(backoff_factor * (2 ** attempt))

            full_text = ""
            for chunk in response_stream:
                if chunk.text:
                    full_text += chunk.text
                    yield f"data: {json.dumps({'text': chunk.text})}\n\n"

            # Post-stream: run a fast structured extraction call to get the updated metadata
            history_for_extraction = messages + [{"role": "model", "content": full_text}]
            metadata_instruction = (
                f"You are an assistant analyzer. Your job is to extract current lead information and conversation stats from the conversation history.\n"
                f"Identify the intent, extracted_name, extracted_email, extracted_phone, extracted_budget, extracted_appointment_date (YYYY-MM-DD), extracted_appointment_time, lead_score, lead_sentiment, and engagement_score.\n"
                f"Use the existing lead details to avoid losing previously collected info:\n"
                f"{lead_progress}\n"
            )

            try:
                extraction_res = self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=history_for_extraction[-3:],
                    config=types.GenerateContentConfig(
                        system_instruction=metadata_instruction,
                        response_mime_type="application/json",
                        response_schema=AgentResponse,
                        temperature=0.0,
                    )
                )
                meta_data = AgentResponse.model_validate_json(extraction_res.text)
                meta_dict = meta_data.model_dump()
                meta_dict.pop("response", None)
                yield f"data: {json.dumps({'metadata': meta_dict})}\n\n"
            except Exception as extract_err:
                logger.error(f"Failed to extract metadata after stream: {extract_err}")
                yield f"data: {json.dumps({'metadata': {'intent': 'Other', 'lead_score': 'COLD', 'lead_sentiment': 'Neutral', 'engagement_score': 10}})}\n\n"

        except Exception as e:
            logger.exception("Error in Gemini streaming call")
            yield f"data: {json.dumps({'text': 'I am currently experiencing some technical difficulties. Can you please repeat your message?'})}\n\n"
            yield f"data: {json.dumps({'metadata': {'intent': 'Support', 'lead_score': 'COLD', 'lead_sentiment': 'Neutral', 'engagement_score': 5}})}\n\n"

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
        
        # Simulated email extraction
        if "@" in latest_message and not email:
            emails = re.findall(r'[\w\.-]+@[\w\.-]+\.\w+', latest_message)
            if emails:
                extracted_email = emails[0]
                email = emails[0]
                
        # Simulated phone extraction
        phone_match = re.search(r'(\+?\d[\d\-\s\(\)]{8,15})', latest_message)
        if phone_match and not phone:
            extracted_phone = phone_match.group(1).strip()
            phone = extracted_phone

        # Simulated name extraction (robust regex matching name context)
        name_match = re.search(r'(?:my name is|i am|call me)\s+([a-zA-Z\s]+)', latest_message, re.IGNORECASE)
        if name_match and not name:
            extracted_name = name_match.group(1).strip(" .!,")
            name_parts = extracted_name.split()
            if name_parts:
                extracted_name = " ".join(name_parts[:2])
                name = extracted_name

        # Simulated budget extraction (detecting currency and numbers dynamically)
        budget_match = re.search(r'(?:[$₹€]\s*\d+[\d,]*|\d+[\d,]*\s*(?:USD|INR|dollars|rupees|per month|/month|pm|k))', latest_message, re.IGNORECASE)
        if budget_match and not budget:
            extracted_budget = budget_match.group(0).strip(" .!,")
            budget = extracted_budget

        if not name:
            response_text = "Hello! Thanks for visiting our site. May I know your name and what you're looking for today?"
            intent = "Greeting"
        elif not email:
            response_text = f"Nice to meet you, {name}! How can we help you today? Also, could you share your email address so we can keep in touch?"
            intent = "LeadQualification"
        elif not budget:
            response_text = "Got it! What is your estimated monthly budget for this project? (e.g. ₹20,000/month or $500/month)"
            intent = "LeadQualification"
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

        # Sentiment detection
        sentiment = "Neutral"
        if any(w in msg_lower for w in ["yes", "great", "awesome", "perfect", "good", "love", "thanks", "thank you"]):
            sentiment = "Positive"
        elif any(w in msg_lower for w in ["bad", "wrong", "no", "hate", "issue", "error", "broken", "fail"]):
            sentiment = "Negative"
        elif "?" in latest_message or any(w in msg_lower for w in ["what", "how", "why", "who", "when"]):
            sentiment = "Inquisitive"

        # Engagement score computation - capped at 100 without double counting
        engagement = 15
        if name:
            engagement += 20
        if email:
            engagement += 30
        if budget:
            engagement += 20
        if phone:
            engagement += 10
        if "schedule" in msg_lower or "book" in msg_lower:
            engagement += 15
        engagement = min(100, engagement)

        return AgentResponse(
            response=response_text,
            intent=intent,
            extracted_name=extracted_name,
            extracted_email=extracted_email,
            extracted_phone=extracted_phone,
            extracted_budget=extracted_budget,
            extracted_appointment_date=extracted_date,
            extracted_appointment_time=extracted_time,
            lead_score=score,
            lead_sentiment=sentiment,
            engagement_score=engagement
        )

    # --- Auto Website Learning (FAQ extract) Service ---
    def extract_faqs(self, scraped_text: str, company_name: str, industry: str, description: str) -> ExtractFAQsResponse:
        if not self.client:
            return ExtractFAQsResponse(faqs=[
                FAQItem(title=f"What are the core offerings of {company_name}?", content=f"We provide specialized services in the {industry} sector tailored specifically to user specifications as described in our company profile: {description[:100]}..."),
                FAQItem(title="Do you provide customizable configurations?", content="Yes, all client widget configurations and integrations are fully custom-built and modular."),
                FAQItem(title="How do I setup billing?", content="Billing details and service quotes can be finalized during your onboarding demo call. Please leave your email to schedule a consult."),
            ])

        try:
            prompt = (
                f"Analyze the following scraped text from the company website and extract a structured list of at least 3 FAQ (Q&A) items.\n"
                f"Company Details:\n- Name: {company_name}\n- Industry: {industry}\n- Description: {description}\n\n"
                f"Scraped Web Text:\n{scraped_text or 'No scraped text. Please generate standard FAQs based on the company details above.'}"
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ExtractFAQsResponse,
                    temperature=0.2,
                )
            )
            return ExtractFAQsResponse.model_validate_json(response.text)
        except Exception as e:
            logger.exception("Error in Gemini extract_faqs")
            return ExtractFAQsResponse(faqs=[
                FAQItem(title=f"What services does {company_name} provide?", content=f"We provide professional services in the {industry} sector."),
                FAQItem(title="Where can I view pricing?", content="Please contact our sales team by providing your name and email in the chat widget."),
            ])

    # --- Competitor Analysis Service ---
    def analyze_competitor(self, competitor_url: str, scraped_text: str, my_business: Dict[str, Any]) -> CompetitorAnalysisResponse:
        my_name = my_business.get("companyName", "Our Business")
        my_industry = my_business.get("industry", "Technology")
        my_desc = my_business.get("description", "")

        if not self.client:
            return CompetitorAnalysisResponse(
                serviceCompare=[
                    ServiceCompareItem(feature="Product Customization", us="Highly customized modular setups", competitor="Standard fixed plans only"),
                    ServiceCompareItem(feature="Instant AI Chatbot", us="Yes, live 24/7", competitor="No, email forms only"),
                    ServiceCompareItem(feature="Multi-channel Inbox", us="WhatsApp, Instagram, Email, Web", competitor="Web chat only"),
                    ServiceCompareItem(feature="Data Analytics", us="Live Lead qualifying & tracking", competitor="Basic stats grid"),
                ],
                missingOfferings=[
                    "Self-service onboarding portal dashboards",
                    "Automated text-message verification sequences",
                ],
                contentGaps=[
                    f"Low competition keywords for '{my_name} alternatives'",
                    f"SEO optimization target keyword groups in {my_industry}",
                ]
            )

        try:
            prompt = (
                f"Perform a professional competitor analysis comparing our business '{my_name}' against the competitor website '{competitor_url}'.\n"
                f"Our Business details:\n- Industry: {my_industry}\n- Description: {my_desc}\n\n"
                f"Scraped competitor web text:\n{scraped_text or 'No competitor text. Please simulate standard comparative insights.'}\n\n"
                f"Extract a structured JSON response comparing features, listing our missing offerings, and noting SEO content gaps."
            )
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=CompetitorAnalysisResponse,
                    temperature=0.3,
                )
            )
            return CompetitorAnalysisResponse.model_validate_json(response.text)
        except Exception as e:
            logger.exception("Error in Gemini analyze_competitor")
            return CompetitorAnalysisResponse(
                serviceCompare=[
                    ServiceCompareItem(feature="AI Sales Agent", us="Yes (Standard)", competitor="Unknown"),
                ],
                missingOfferings=["Detailed competitor comparison metrics"],
                contentGaps=["SEO optimization target terms"]
            )

    # --- Advanced Lead Intelligence Service ---
    def analyze_lead(self, messages: List[Dict[str, str]], business_context: Dict[str, Any]) -> AnalyzeLeadResponse:
        if not self.client:
            return self._mock_lead_analysis(messages, business_context)

        try:
            # Build conversation log text
            conv_log = ""
            for msg in messages:
                role_label = "Customer" if msg["role"] == "user" else "Assistant"
                conv_log += f"{role_label}: {msg['content']}\n"

            prompt = (
                f"You are an elite business analyst and sales intelligence agent. Your job is to analyze the conversation history between a customer lead and our AI assistant.\n\n"
                f"Business Details:\n"
                f"- Name: {business_context.get('companyName')}\n"
                f"- Website: {business_context.get('website')}\n"
                f"- Industry: {business_context.get('industry')}\n"
                f"- Description: {business_context.get('description')}\n\n"
                f"Conversation Log:\n"
                f"{conv_log}\n"
                f"Perform lead analysis, scoring, company enrichment, and expected project revenue estimation. Return the structured JSON response matching the schema."
            )

            max_retries = 3
            backoff_factor = 0.5
            for attempt in range(max_retries):
                try:
                    response = self.client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=AnalyzeLeadResponse,
                            temperature=0.2,
                        )
                    )
                    return AnalyzeLeadResponse.model_validate_json(response.text)
                except Exception as e:
                    logger.warning(f"Gemini API lead analysis attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(backoff_factor * (2 ** attempt))

        except Exception as e:
            logger.exception("Error in Gemini lead analysis pipeline")
            return self._mock_lead_analysis(messages, business_context)

    def _mock_lead_analysis(self, messages: List[Dict[str, str]], business_context: Dict[str, Any]) -> AnalyzeLeadResponse:
        # Fallback simple analyzer when offline or error occurs
        last_message = messages[-1]["content"] if messages else ""
        
        estimated_val = 50000.0
        msg_lower = last_message.lower()
        if "100" in msg_lower or "lakh" in msg_lower or "1,00" in msg_lower:
            estimated_val = 100000.0
        elif "20" in msg_lower or "25" in msg_lower:
            estimated_val = 25000.0
            
        prob = 0.70
        if "now" in msg_lower or "immediate" in msg_lower or "urgent" in msg_lower:
            prob = 0.90
            
        return AnalyzeLeadResponse(
            summary=SummaryAndAnalysis(
                summary="Lead is inquiring about services. Interested in standard packaging.",
                goals="Streamline sales operations and qualify visitors 24/7.",
                pain_points="Losing visitors during off-hours, high lead dropoff.",
                requested_services=["AI Chat Widget Setup", "Multi-Channel Inbox Integration"],
                timeline="30 days",
                objections="None stated yet",
                recommended_action="Email follow-up to coordinate custom demo call."
            ),
            scoring=LeadScoring(
                score=85,
                deal_probability=prob,
                classification="HOT",
                factors=ScoringFactors(
                    budget="Standard",
                    urgency="High",
                    timeline="Immediate",
                    decision_maker_status="Undetermined",
                    business_size="SMB",
                    service_match="High Match",
                    engagement=80
                )
            ),
            enrichment=CompanyInfo(
                company_name=business_context.get("companyName", "Acme Corp"),
                website="https://theirwebsite.com",
                industry=business_context.get("industry", "Technology"),
                description="A client enterprise using Beacon AI widget.",
                company_size="10-50",
                country="India",
                social_links={"linkedin": "https://linkedin.com/company/acme"}
            ),
            intelligence=ConversationIntelligence(
                intent="Service Inquiry",
                purchase_readiness="High",
                sentiment="Positive",
                objections="None",
                frequent_topics=["pricing", "customization"],
                conversion_risk="Low"
            ),
            revenue=RevenuePredictionModel(
                estimated_value=estimated_val,
                deal_probability=prob,
                expected_revenue=estimated_val * prob
            )
        )

    def analyze_account(self, domain: str, scraped_text: str) -> AccountIntelligenceResponse:
        if not self.client:
            return self._mock_account_analysis(domain, scraped_text)

        try:
            prompt = (
                f"You are an elite AI Account Intelligence Engine and Sales Intelligence Architect.\n"
                f"Perform deep account research and analysis on the company website domain: {domain}.\n"
                f"Use the scraped website content below to extract and synthesize the required intelligence details.\n\n"
                f"Scraped Web Text:\n{scraped_text or 'No website content available. Please simulate based on domain.'}\n\n"
                f"Analyze the domain name and web text to: \n"
                f"1. Summarize the company's business.\n"
                f"2. Identify the industry.\n"
                f"3. Estimate the company size (employee count).\n"
                f"4. Detect the technology stack (frameworks, SaaS platforms, libraries, servers).\n"
                f"5. Identify key business challenges and pain points.\n"
                f"6. Pinpoint sales opportunities and matches for modern CRM/SaaS automation.\n"
                f"7. Detect growth/buying signals (hiring, expansion, scaling).\n"
                f"8. Outline a recommended outreach strategy.\n"
                f"9. Generate a highly personalized email draft to the decision maker.\n"
                f"10. Write meeting preparation notes for the sales team.\n\n"
                f"Return the results strictly adhering to the JSON schema."
            )

            max_retries = 3
            backoff_factor = 0.5
            for attempt in range(max_retries):
                try:
                    response = self.client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=AccountIntelligenceResponse,
                            temperature=0.2,
                        )
                    )
                    return AccountIntelligenceResponse.model_validate_json(response.text)
                except Exception as e:
                    logger.warning(f"Gemini API account analysis attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(backoff_factor * (2 ** attempt))

        except Exception as e:
            logger.exception("Error in Gemini account analysis pipeline")
            return self._mock_account_analysis(domain, scraped_text)

    def _mock_account_analysis(self, domain: str, scraped_text: str) -> AccountIntelligenceResponse:
        # Extract company name from domain e.g. stripe.com -> Stripe
        clean_name = domain.split(".")[0].capitalize() if domain else "Target Account"
        
        return AccountIntelligenceResponse(
            summary=f"{clean_name} is a high-growth technology enterprise offering advanced solutions and services. They focus on customer-centric design, robust scaling capabilities, and streamlining operational workflows to accelerate market positioning.",
            industry="Technology & Software Services",
            employee_estimate="150-500 employees",
            tech_stack=["React", "Next.js", "PostgreSQL", "Redis", "Google Cloud Platform", "Node.js", "Docker", "TailwindCSS"],
            challenges=[
                f"Scaling customer acquisition channels cost-effectively in a saturated {clean_name} market space.",
                "Friction in manual sales qualification processes leading to pipeline delays.",
                "High response times during off-hours causing drop-offs from website visitors."
            ],
            opportunities=[
                "Deploying our Beacon real-time AI Sales Widget on their primary web portal.",
                "Automating lead qualification sequences directly integrated into their calendar tools.",
                "Implementing multi-channel customer communication workflows (WhatsApp & Instagram API)."
            ],
            buying_signals=[
                "Active job postings for senior engineers and account executives.",
                "Recent expansion into secondary international markets.",
                "Increased focus on web presence and conversion optimization tools."
            ],
            outreach_strategy=f"Approach the Head of Sales or Director of Growth with a personalization angle highlighting their active website. Propose how integrating an AI agent widget like Beacon can capture and qualify high-intent website visitors 24/7, reducing sales cycle times by up to 40%.",
            email_draft=f"Subject: Accelerating {clean_name}'s web conversions by 40% with AI\n\nHi team,\n\nI was looking at {clean_name}'s website and noticed you are scaling your growth and engineering teams. With high traffic, how is your team handling lead qualification during off-hours?\n\nBeacon is an enterprise AI Sales Operating System that integrates a 24/7 qualifying sales agent directly on your website, pre-scoring leads and syncing them to your sales pipeline. \n\nI'd love to show you a quick 10-minute demo tailored for {clean_name}. Do you have time next Tuesday at 2 PM?\n\nBest regards,\n[Your Name]\nBeacon Sales Team",
            meeting_notes=f"1. Introduction: Acknowledge {clean_name}'s recent growth signals and tech stack.\n2. Goal: Guide the discussion toward their website lead flow and manual overhead.\n3. Case Study: Emphasize how similar tech stacks benefit from NextJS-based AI widgets.\n4. Close: Secure a follow-up session with their VP of Sales or Product Lead."
        )

    def score_lead(
        self,
        lead_info: Dict[str, Any],
        enrichment_info: Dict[str, Any],
        research_info: Dict[str, Any],
        conversation_log: List[Dict[str, str]],
        email_metrics: Dict[str, Any],
        website_metrics: Dict[str, Any]
    ) -> LeadScoreResponse:
        if not self.client:
            return self._mock_lead_scoring(lead_info, enrichment_info, research_info, conversation_log, email_metrics, website_metrics)

        try:
            conv_log = ""
            for msg in conversation_log:
                role_label = "Customer" if msg.get("role") == "user" else "Assistant"
                conv_log += f"{role_label}: {msg.get('content')}\n"

            prompt = (
                f"You are an elite Lead Scoring Analyst and Sales AI. Your objective is to compute a detailed lead score and analyze multiple signals for a specific prospect.\n\n"
                f"=== LEAD PROFILE ===\n"
                f"- Name: {lead_info.get('name') or 'Anonymous'}\n"
                f"- Email: {lead_info.get('email') or 'N/A'}\n"
                f"- Phone: {lead_info.get('phone') or 'N/A'}\n"
                f"- Budget: {lead_info.get('budget') or 'N/A'}\n"
                f"- Source Channel: {lead_info.get('source') or 'N/A'}\n"
                f"- Current Status: {lead_info.get('status') or 'N/A'}\n"
                f"- Lead Sentiment: {lead_info.get('sentiment') or 'N/A'}\n\n"
                f"=== COMPANY ENRICHMENT ===\n"
                f"- Company: {enrichment_info.get('companyName') or 'N/A'}\n"
                f"- Website: {enrichment_info.get('website') or 'N/A'}\n"
                f"- Industry: {enrichment_info.get('industry') or 'N/A'}\n"
                f"- Description: {enrichment_info.get('description') or 'N/A'}\n"
                f"- Company Size: {enrichment_info.get('companySize') or 'N/A'}\n"
                f"- Country: {enrichment_info.get('country') or 'N/A'}\n\n"
                f"=== DETAILED ACCOUNT RESEARCH ===\n"
                f"- Summary: {research_info.get('summary') or 'N/A'}\n"
                f"- Tech Stack: {', '.join(research_info.get('techStack') or []) or 'N/A'}\n"
                f"- Challenges: {', '.join(research_info.get('challenges') or []) or 'N/A'}\n"
                f"- Opportunities: {', '.join(research_info.get('opportunities') or []) or 'N/A'}\n"
                f"- Buying Signals: {', '.join(research_info.get('buyingSignals') or []) or 'N/A'}\n\n"
                f"=== EMAIL ENGAGEMENT METRICS ===\n"
                f"- Total Email Exchange: {email_metrics.get('totalExchange') or 0} messages\n"
                f"- Open Rate: {email_metrics.get('openRate') or 0}%\n"
                f"- Last Email Body Snippet: {email_metrics.get('lastEmailSnippet') or 'N/A'}\n\n"
                f"=== WEBSITE ACTIVITY ===\n"
                f"- Pages Viewed: {website_metrics.get('pageViews') or 0}\n"
                f"- Total Session Duration: {website_metrics.get('sessionDuration') or 0} seconds\n\n"
                f"=== CONVERSATION CHAT LOG ===\n"
                f"{conv_log or 'No chat history.'}\n\n"
                f"=== INSTRUCTIONS ===\n"
                f"Calculate the following structured details:\n"
                f"1. **Buying Intent** (0-100 & details): Look at budget presence, timeline constraints, conversation tone, and request specifics.\n"
                f"2. **Company Growth Signals** (0-100 & details): Look at company size, funding/expansion reports, and tech stack size.\n"
                f"3. **Hiring Signals** (0-100 & details): Look at growth indicators like recruiting trends, open roles, or expansion opportunities.\n"
                f"4. **Engagement Activity** (0-100 & details): Analyze user chat responses, questions asked, and interactivity.\n"
                f"5. **Website Activity** (0-100 & details): Analyze number of pages viewed and session length.\n"
                f"6. **Email Activity** (0-100 & details): Look at reply count, opens count, and reply content.\n\n"
                f"Consolidate these into an overall **Score** from 0 to 100, determine a **Priority Level** (HIGH, MEDIUM, LOW), write a detailed **Reasoning** explaining your evaluation, and draft a highly actionable **Recommended Next Action**.\n\n"
                f"Return the results strictly adhering to the JSON schema."
            )

            max_retries = 3
            backoff_factor = 0.5
            for attempt in range(max_retries):
                try:
                    response = self.client.models.generate_content(
                        model='gemini-2.5-flash',
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=LeadScoreResponse,
                            temperature=0.2,
                        )
                    )
                    return LeadScoreResponse.model_validate_json(response.text)
                except Exception as e:
                    logger.warning(f"Gemini API lead scoring attempt {attempt + 1} failed: {e}")
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(backoff_factor * (2 ** attempt))

        except Exception as e:
            logger.exception("Error in Gemini lead scoring pipeline")
            return self._mock_lead_scoring(lead_info, enrichment_info, research_info, conversation_log, email_metrics, website_metrics)

    def _mock_lead_scoring(
        self,
        lead_info: Dict[str, Any],
        enrichment_info: Dict[str, Any],
        research_info: Dict[str, Any],
        conversation_log: List[Dict[str, str]],
        email_metrics: Dict[str, Any],
        website_metrics: Dict[str, Any]
    ) -> LeadScoreResponse:
        status = lead_info.get("status") or "COLD"
        score = 82 if status == "HOT" else 55 if status == "WARM" else 28
        
        email_count = email_metrics.get("totalExchange") or 0
        pages = website_metrics.get("pageViews") or 0
        
        if email_count > 3 or pages > 5:
            score = min(100, score + 12)
            
        priority = "HIGH" if score >= 75 else "MEDIUM" if score >= 45 else "LOW"
        
        return LeadScoreResponse(
            score=score,
            priority_level=priority,
            reasoning=f"Lead shows moderate interest and holds a budget of {lead_info.get('budget') or 'N/A'}. Enriched profile signals operating in the {enrichment_info.get('industry') or 'Technology'} sector.",
            recommended_next_action="Send customized onboarding deck and invite to standard demo call.",
            buying_intent=ScoreCriteria(
                score=min(100, score + 5),
                details=f"Expressed explicit interest in {lead_info.get('budget') or 'standard pricing'} range."
            ),
            company_growth_signals=ScoreCriteria(
                score=65,
                details=f"Growing presence in {enrichment_info.get('country') or 'India'} with estimated size {enrichment_info.get('companySize') or '10-50'}."
            ),
            hiring_signals=ScoreCriteria(
                score=45,
                details="No specific open job roles detected from domain scraping."
            ),
            engagement_activity=ScoreCriteria(
                score=min(100, score + 10),
                details=f"Active interaction channel: {lead_info.get('source') or 'widget'} with {len(conversation_log)} chat history events."
            ),
            website_activity=ScoreCriteria(
                score=min(100, 20 + pages * 10),
                details=f"Viewed {pages} pages on the website, spending a total of {website_metrics.get('sessionDuration') or 0} seconds."
            ),
            email_activity=ScoreCriteria(
                score=min(100, 15 + email_count * 15),
                details=f"Exchanged {email_count} emails with open rate of {email_metrics.get('openRate') or 0}%."
            )
        )


