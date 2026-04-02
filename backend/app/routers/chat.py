from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import create_sql_agent
from langchain_groq import ChatGroq

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])

class ChatRequest(BaseModel):
    query: str

@router.post("")
async def chat_with_erp(request: ChatRequest):
    try:
        # 1. Get your existing Database URL from the environment
        original_db_url = os.getenv("DATABASE_URL", "sqlite:///./nexus.db")
        
        # Standardize for SQLAlchemy
        if original_db_url.startswith("postgres://"):
            original_db_url = original_db_url.replace("postgres://", "postgresql://", 1)
            
        # 2. THE FIX: Strip out the async drivers (+asyncpg or +aiosqlite)
        sync_db_url = original_db_url.replace("+asyncpg", "").replace("+aiosqlite", "")
        
        # 3. Connect LangChain using the cleaned, synchronous URL
        db = SQLDatabase.from_uri(sync_db_url)

        # 2. NEW BRAIN: Initialize Groq with the current Llama 3.3 model
        llm = ChatGroq(
            temperature=0,
            model_name="llama-3.3-70b-versatile" # FIXED: Updated to supported model
        )

        # 3. Security & Style Guardrails
        system_prompt = """
        You are the Nexus ERP Intelligent Assistant. 
        Your job is to answer questions about inventory, suppliers, and sales by querying the PostgreSQL database.
        
        RULES:
        1. Format all currency in Indian Rupees (₹).
        2. Keep answers professional and concise (max 3 sentences).
        3. SECURITY: ONLY execute 'SELECT' queries. 
        4. If a user asks to DELETE, DROP, or UPDATE, refuse politely.
        5. If no data is found, say 'No matching records were found in the database.'
        """

        # 4. Create the Agent
        agent = create_sql_agent(
            llm=llm,
            db=db,
            agent_type="openai-tools",
            verbose=True, 
            prefix=system_prompt
        )
        
        # 5. Run the query and return JSON
        user_query = request.query
        system_instructions = """
        \n\nCRITICAL SYSTEM INSTRUCTIONS:
        1. BUSINESS RULE: If the user asks for "low stock", ALWAYS filter for products where the stock/quantity is strictly less than 10 units.
        2. FORMATTING: Always use Markdown bullet points (*). Put each item on a new line. 
        3. FORMATTING: Use **bold** text for product names.
        4. NEVER output a single paragraph of comma-separated items.
        """
        response = agent.invoke({"input": user_query + system_instructions})
        return {"answer": response["output"]}
        
    except Exception as e:
        print(f"AI AGENT ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="The AI Assistant is currently processing another request. Please try again.")
