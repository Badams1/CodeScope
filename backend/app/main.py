from fastapi import FastAPI, UploadFile, File
import subprocess
import shutil
import json
from datetime import datetime
import os
from dotenv import load_dotenv
import openai

load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

analysis_history = []

app = FastAPI()

client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def explain_issue_with_gpt(issue_text):
    prompt = (
        f"A static analysis tool flagged this issue in a Python program:\n"
        f"\"{issue_text}\"\n\n"
        "Explain what this issue means, why it's a problem, and how to fix it with a safer alternative. "
        "Be concise and helpful."
        "Be very concise only the most important information, 10 words max"
    )

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.5
        )

        message = response.choices[0].message.content
        return message.strip() if message else "No explanation available."

    except Exception as e:
        print(f"GPT error: {e}")
        return "Error generating explanation."


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

    # Extract relevant data
    issues = []
    for item in bandit_json.get("results", []):
        explanation = explain_issue_with_gpt(item.get("issue_text", ""))
        issues.append({
            "filename": item.get("filename"),
            "line_number": item.get("line_number"),
            "issue": item.get("issue_text"),
            "severity": item.get("issue_severity"),
            "confidence": item.get("issue_confidence"),
            "explanation": explanation
        })

    analysis_history.append({
    "timestamp": datetime.now().isoformat(),
    "filename": file.filename,
    "issues": issues
    })

    # Return clean list
    print("Current history:", analysis_history)

    return {"issues": issues}

@app.get("/history")
def get_history():
  return {"history": analysis_history}


    

