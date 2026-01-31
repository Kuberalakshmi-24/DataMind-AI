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
import seaborn as sns
from dotenv import load_dotenv # <--- New Import
import os

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
USERS_FILE = "users.json"

class UserData(BaseModel):
    username: str
    password: str

def load_users():
    if not os.path.exists(USERS_FILE): return {}
    try:
        with open(USERS_FILE, "r") as f: return json.load(f)
    except: return {}

def save_users(users):
    with open(USERS_FILE, "w") as f: json.dump(users, f)

@app.post("/register")
async def register(user: UserData):
    users = load_users()
    if user.username in users:
        return {"status": "error", "message": "Username already taken! 🚫"}
    users[user.username] = user.password
    save_users(users)
    return {"status": "success", "message": "Registration Successful! ✅"}

@app.post("/login")
async def login(user: UserData):
    users = load_users()
    if user.username in users and users[user.username] == user.password:
        return {"status": "success", "message": "Login Success!"}
    return {"status": "error", "message": "Invalid Username or Password! ❌"}

# --- AI SETUP ---
llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    temperature=0
)

@app.post("/analyze")
async def analyze_data(file: UploadFile = File(...), query: str = Form(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))

        if os.path.exists("plot.png"):
            os.remove("plot.png")

        # --- 👇 IMPORTANT CHANGE: Ask for Explanation 👇 ---
        prefix_instruction = """
        You are an expert Data Analyst.
        If the user wants a visualization:
        1. Create the chart using 'seaborn' or 'matplotlib'.
        2. SAVE plot as 'plot.png'.
        3. DO NOT use plt.show().
        4. AFTER saving the plot, provide a clear and detailed textual explanation of what the chart shows. 
           - Mention key trends, highest/lowest values, and insights.
           - Do NOT say "Chart generated successfully", instead describe the data.
        """

        agent = create_pandas_dataframe_agent(
            llm, 
            df, 
            verbose=True, 
            allow_dangerous_code=True,
            prefix=prefix_instruction,
            max_iterations=3,
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
        if os.path.exists("plot.png"):
             with open("plot.png", "rb") as img_file:
                image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                return {"answer": "Here is the chart based on your data.", "image": image_base64}
        
        return {"answer": f"Error: {str(e)}", "image": None}