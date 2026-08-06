import os
import subprocess
import tempfile
import re
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.config import settings
from groq import Groq

router = APIRouter()

class CodeExecuteRequest(BaseModel):
    language: str
    code: str

class CodeFixRequest(BaseModel):
    language: str
    code: str
    error: str
    model: str = "llama-3.3-70b-versatile"

@router.post("/compiler/execute")
def execute_code(req: CodeExecuteRequest):
    lang = req.language.lower()
    code = req.code

    if lang not in ["python", "c", "cpp", "java"]:
        raise HTTPException(status_code=400, detail="Unsupported language")

    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Determine filenames and commands
        compile_cmd = None
        run_cmd = None
        filename = ""

        if lang == "python":
            filename = "script.py"
            run_cmd = ["python", filename]
        elif lang == "c":
            filename = "main.c"
            compile_cmd = ["gcc", filename, "-o", "main.exe"]
            run_cmd = ["main.exe"]
        elif lang == "cpp":
            filename = "main.cpp"
            compile_cmd = ["g++", filename, "-o", "main.exe"]
            run_cmd = ["main.exe"]
        elif lang == "java":
            # Extract class name or default to Main
            match = re.search(r'class\s+([A-Za-z0-9_]+)', code)
            class_name = match.group(1) if match else "Main"
            filename = f"{class_name}.java"
            compile_cmd = ["javac", filename]
            run_cmd = ["java", class_name]

        # Write code to file
        file_path = os.path.join(temp_dir, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(code)

        # Helper to run process
        def run_proc(cmd):
            try:
                # Add current directory to path if it's an executable
                if cmd[0].endswith(".exe") and not os.path.isabs(cmd[0]):
                    cmd[0] = os.path.join(temp_dir, cmd[0])
                
                proc = subprocess.run(
                    cmd,
                    cwd=temp_dir,
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                return proc.stdout, proc.stderr, proc.returncode
            except subprocess.TimeoutExpired:
                return "", "Error: Execution Timed Out (5 seconds max)", -1
            except Exception as e:
                return "", f"System Error: {str(e)}", -1

        stdout, stderr, returncode = "", "", 0

        # Compile if needed
        if compile_cmd:
            c_out, c_err, c_ret = run_proc(compile_cmd)
            if c_ret != 0:
                return {"output": c_out, "error": c_err or "Compilation Failed", "exit_code": c_ret}
        
        # Run
        stdout, stderr, returncode = run_proc(run_cmd)

        return {
            "output": stdout,
            "error": stderr,
            "exit_code": returncode
        }

@router.post("/compiler/fix")
def fix_code(req: CodeFixRequest):
    client = Groq(api_key=settings.GROQ_API_KEY)
    
    prompt = f"""
    The following {req.language} code produced an error.
    
    CODE:
    {req.code}
    
    ERROR:
    {req.error}
    
    Please provide:
    1. A short explanation of what went wrong.
    2. The fully fixed code in a markdown block.
    
    Format exactly like this:
    EXPLANATION:
    <your explanation>
    
    FIXED_CODE:
    ```{req.language}
    <fixed code>
    ```
    """
    
    actual_model = req.model
    if actual_model == "openai/gpt-oss-120b" or "llama3-8b-8192" in actual_model:
        actual_model = "llama-3.3-70b-versatile"
        
    try:
        completion = client.chat.completions.create(
            model=actual_model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_completion_tokens=2048,
        )
        content = completion.choices[0].message.content
        
        explanation = "Could not parse explanation."
        fixed_code = req.code
        
        # Parse the response
        exp_match = re.search(r'EXPLANATION:(.*?)FIXED_CODE:', content, re.DOTALL)
        if exp_match:
            explanation = exp_match.group(1).strip()
            
        code_match = re.search(r'```(?:[a-zA-Z]*)\n(.*?)```', content, re.DOTALL)
        if code_match:
            fixed_code = code_match.group(1).strip()
            
        return {
            "explanation": explanation,
            "fixed_code": fixed_code
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Fix Failed: {str(e)}")
