import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import snowflake.connector
import requests

app = FastAPI(title="OneBill", version="1.0")

# Enable CORS for your React frontend
app.add_middleware(
    CORSMiddleware, 
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Request Model from Frontend
class UserQuery(BaseModel):
    province: str
    current_provider: str
    current_bill: float

# Helper: Query Snowflake for Regional Benchmarks
def fetch_snowflake_benchmark(province: str) -> float:
    try:
        conn = snowflake.connector.connect(
            user=os.getenv("SNOWFLAKE_USER"),
            password=os.getenv("SNOWFLAKE_PASSWORD"),
            account=os.getenv("SNOWFLAKE_ACCOUNT"),
            warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
            database=os.getenv("SNOWFLAKE_DATABASE"),
            schema=os.getenv("SNOWFLAKE_SCHEMA")
        )
        cursor = conn.cursor()

        sql = """
            SELECT AVG(monthly_spend) 
            FROM telecom_marketplace_data 
            WHERE province = %s
        """
        cursor.execute(sql, (province,))
        result = cursor.fetchone()

        avg_spend = result[0] if result and result[0] else 65.00
        return float(avg_spend)

    except Exception as e:
        print(f"Snowflake Error (using fallback): {e}")
        return 62.50 if province.lower() == "quebec" else 95.00

# Helper: Call Open-Weight Model via Groq
def generate_rate_match_script(province: str, provider: str, bill: float, benchmark: float) -> str:
    prompt = f"""
        You are a fierce consumer advocate against Canadian telecom monopolies (Robelus). 
        A user in {province} is currently paying ${bill}/month with {provider}. 
        Market data from Snowflake shows the average fair spend in {province} is ${benchmark:.2f}/month.

        Write a highly aggressive, data-backed customer service chat script that the user can copy and paste to demand a rate match. 
        Tone: Firm, uncompromising, quoting regional disparity facts, threatening to switch to a regional competitor (like Freedom, Videotron, or Fizz).
        """

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        # Mock fallback for safety during live demo
        return f"Hey {provider}, I live in {province} paying ${bill}. Competitors average ${benchmark:.2f}. Match it or I'm canceling today."

    headers = {
        "Authorization": f"Bearer {api_key}", 
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama3-70b-8192", 
        "messages": [{"role": "user", "content": prompt}], 
        "temperature": 0.7
    }

    # Fixed: passed headers=headers correctly as a keyword argument
    response = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers)
    return response.json()["choices"][0]["message"]["content"]

# Main API Endpoint
@app.post("/api/generate-script")
def get_rate_match(data: UserQuery):
    benchmark_price = fetch_snowflake_benchmark(data.province)
    script = generate_rate_match_script(data.province, data.current_provider, data.current_bill, benchmark_price)

    return {
        "province": data.province,
        "user_bill": data.current_bill,
        "provincial_average": benchmark_price,
        "negotiation_script": script
    }