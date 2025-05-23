from fastapi import FastAPI, UploadFile, File
import subprocess
import shutil
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import openai
import re

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

analysis_history = []

app = FastAPI()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def batch_explain_issues_with_gpt(issue_texts):
    numbered_issues = "\n".join(
        f"{i+1}. {text}" for i, text in enumerate(issue_texts)
    )

    prompt = (
        "You are a secure code auditor. Explain each of the following security issues "
        "in concise, clear language. Also suggest safer alternatives when appropriate." 
        "Be very concise 15 word limit per issue, \n\n"
        f"{numbered_issues}\n\n"
        "Return your answers in the format:\n"
        "1. Explanation...\n"
        "2. Explanation...\n"
        "...\n"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5
        )
        message = response.choices[0].message.content
        return message.strip().split("\n", maxsplit=len(issue_texts)) if message else ["Error generating explanation."] * len(issue_texts)
    except Exception as e:
        print(f"GPT error: {e}")
        return ["Error generating explanation."] * len(issue_texts)



@app.get("/")
def read_root():
    return {"message": "Welcome to CodeScope!"}

@app.post("/scan")
async def scan_file(file: UploadFile = File(...)):

    temp_path = "/tmp/codescope_uploads/temp_upload.py"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = subprocess.run(
        ["bandit", "-f", "json", temp_path],
        capture_output=True,
        text=True
    )

    # Parse Bandit's JSON 
    bandit_json = json.loads(result.stdout)

    issue_texts = [
    item.get("issue_text", "") for item in bandit_json.get("results", [])
    ]

    # Extract relevant data
    explanations = batch_explain_issues_with_gpt(issue_texts)
    issues = []
    
    # Read the original file so we can show line content
    with open(temp_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    for i, item in enumerate(bandit_json.get("results", [])):
        line_number = item.get("line_number")
        code_line = lines[line_number - 1].strip() if line_number and line_number <= len(lines) else ""
        code_line = '"' + code_line + '"'
        cleaned_explanation = re.sub(r"^\s*\d+\.\s*", "", explanations[i].strip())


        issues.append({
            "filename": item.get("filename"),
            "line_number": item.get("line_number"),
            "code": code_line,
            "issue": item.get("issue_text"),
            "severity": item.get("issue_severity"),
            "confidence": item.get("issue_confidence"),
            "explanation": cleaned_explanation
        })

    



    analysis_history.append({
    "timestamp": datetime.now().isoformat(),
    "filename": file.filename,
    "issues": issues
    })

    return {"issues": issues,
            "source_code": lines}

@app.get("/history")
def get_history():
  return {"history": analysis_history}


    

