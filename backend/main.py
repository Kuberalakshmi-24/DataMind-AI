from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from langchain_groq import ChatGroq
from langchain_experimental.agents.agent_toolkits import create_pandas_dataframe_agent
import os
import io
import base64
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE FILES ---
USERS_FILE = "users.json"
HISTORY_FILE = "history.json"
FILES_RECORD = "user_files.json" # <--- New File for File Names 📂

# --- DATA MODELS ---
class UserData(BaseModel):
    username: str
    password: str

class HistoryData(BaseModel):
    username: str
    filename: str
    query: str
    answer: str
    time: str

class FileRecord(BaseModel):
    username: str
    filename: str

# --- HELPER FUNCTIONS ---
def load_json(filename):
    if not os.path.exists(filename): return {}
    try:
        with open(filename, "r") as f: return json.load(f)
    except: return {}

def save_json(filename, data):
    with open(filename, "w") as f: json.dump(data, f)

# --- AUTH ENDPOINTS ---
@app.post("/register")
async def register(user: UserData):
    users = load_json(USERS_FILE)
    if user.username in users:
        return {"status": "error", "message": "Username already taken! 🚫"}
    users[user.username] = user.password
    save_json(USERS_FILE, users)
    return {"status": "success", "message": "Registration Successful! ✅"}

@app.post("/login")
async def login(user: UserData):
    users = load_json(USERS_FILE)
    if user.username in users and users[user.username] == user.password:
        return {"status": "success", "message": "Login Success!"}
    return {"status": "error", "message": "Invalid Username or Password! ❌"}

# --- HISTORY ENDPOINTS ---
@app.post("/save_history")
async def save_history_endpoint(data: HistoryData):
    history = load_json(HISTORY_FILE)
    if data.username not in history:
        history[data.username] = []
    
    history[data.username].insert(0, {
        "filename": data.filename,
        "query": data.query,
        "answer": data.answer,
        "time": data.time
    })
    save_json(HISTORY_FILE, history)
    return {"status": "success"}

@app.post("/get_history")
async def get_history_endpoint(user: UserData):
    history = load_json(HISTORY_FILE)
    return {"history": history.get(user.username, [])}

# --- NEW: FILE RECORD ENDPOINTS 📂 ---
@app.post("/add_file_record")
async def add_file_record(data: FileRecord):
    records = load_json(FILES_RECORD)
    if data.username not in records:
        records[data.username] = []
    
    # Avoid duplicates
    if data.filename not in records[data.username]:
        records[data.username].insert(0, data.filename) # Add to top
        save_json(FILES_RECORD, records)
    
    return {"status": "success"}

@app.post("/get_user_files")
async def get_user_files(user: UserData):
    records = load_json(FILES_RECORD)
    return {"files": records.get(user.username, [])}

# --- AI ANALYZE ENDPOINT ---
os.environ["GROQ_API_KEY"] = os.getenv("GROQ_API_KEY")

llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    api_key=os.environ["GROQ_API_KEY"],
    temperature=0
)

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...), query: str = Form(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        if os.path.exists("plot.png"):
            os.remove("plot.png")

        prefix_instruction = """
        You are an expert Data Analyst.
        If the user wants a visualization:
        1. Create the chart using 'seaborn' or 'matplotlib'.
        2. SAVE plot as 'plot.png'.
        3. DO NOT use plt.show().
        4. AFTER saving the plot, provide a clear and detailed textual explanation.
        """

        agent = create_pandas_dataframe_agent(
            llm, df, verbose=True, allow_dangerous_code=True,
            prefix=prefix_instruction, max_iterations=3,
            agent_executor_kwargs={"handle_parsing_errors": True} 
        )

        response = agent.invoke(query)
        output_text = response["output"]
        
        image_base64 = None
        if os.path.exists("plot.png"):
            with open("plot.png", "rb") as img_file:
                image_base64 = base64.b64encode(img_file.read()).decode('utf-8')

        return {"answer": output_text, "image": image_base64}

    except Exception as e:
        print(f"❌ Error: {e}") 
        return {"answer": f"Error: {str(e)}", "image": None}