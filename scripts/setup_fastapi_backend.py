#!/usr/bin/env python3
"""
Alternative FastAPI backend setup script.
Run this if you want to use the original FastAPI backend instead of Next.js API routes.
"""

import os
import subprocess
import sys

def create_fastapi_backend():
    """Create the FastAPI backend structure"""
    
    # Create backend directory
    os.makedirs("backend", exist_ok=True)
    
    # FastAPI main.py
    fastapi_code = '''
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import fitz  # PyMuPDF
import tempfile
import os
from typing import List, Optional
import openai
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
from pydantic import BaseModel
import logging
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="PDF QA API", description="API for PDF Question Answering")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai.api_key = os.getenv("OPENAI_API_KEY")

class AnswerResponse(BaseModel):
    answer: str
    source_chunks: List[str]
    success: bool
    message: str

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF using PyMuPDF"""
    try:
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        logger.error(f"Error extracting text: {e}")
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF")

def chunk_text(text: str, chunk_size: int = 1000) -> List[Document]:
    """Split text into chunks"""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=200,
        length_function=len,
    )
    chunks = text_splitter.split_text(text)
    return [Document(page_content=chunk) for chunk in chunks]

async def generate_answer(question: str, context: str) -> str:
    """Generate answer using OpenAI"""
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Answer questions based on the provided context."},
                {"role": "user", "content": f"Context: {context}\\n\\nQuestion: {question}"}
            ],
            max_tokens=500,
            temperature=0.1
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating answer: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate answer")

@app.post("/upload-and-ask", response_model=AnswerResponse)
async def upload_and_ask(file: UploadFile = File(...), question: str = Form(...)):
    """Upload PDF and ask question"""
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
        content = await file.read()
        temp_file.write(content)
        temp_file_path = temp_file.name
    
    try:
        text = extract_text_from_pdf(temp_file_path)
        chunks = chunk_text(text)
        relevant_chunks = [doc.page_content for doc in chunks[:3]]
        context = "\\n\\n".join(relevant_chunks)
        answer = await generate_answer(question, context)
        
        return AnswerResponse(
            answer=answer,
            source_chunks=relevant_chunks,
            success=True,
            message="Success"
        )
    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
    
    # Write FastAPI code
    with open("backend/main.py", "w") as f:
        f.write(fastapi_code)
    
    # Requirements.txt
    requirements = '''
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
PyMuPDF==1.23.8
openai==1.3.7
langchain==0.0.340
python-dotenv==1.0.0
pydantic==2.5.0
'''
    
    with open("backend/requirements.txt", "w") as f:
        f.write(requirements.strip())
    
    # .env example
    env_example = '''
OPENAI_API_KEY=your-openai-api-key-here
'''
    
    with open("backend/.env.example", "w") as f:
        f.write(env_example.strip())
    
    print("✅ FastAPI backend created in 'backend/' directory")
    print("📝 Next steps:")
    print("1. cd backend")
    print("2. python -m venv venv")
    print("3. source venv/bin/activate  # On Windows: venv\\Scripts\\activate")
    print("4. pip install -r requirements.txt")
    print("5. cp .env.example .env")
    print("6. Add your OpenAI API key to .env")
    print("7. python main.py")

if __name__ == "__main__":
    create_fastapi_backend()
