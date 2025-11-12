# load_openai_key.py
import os
from dotenv import load_dotenv
import psycopg2

def preload_openai_key():
    print("Fetching OPENAI_API_KEY from database")

    """
    Load the OpenAI API key from PostgreSQL and set it in os.environ.
    """
    load_dotenv()

    if os.getenv("OPENAI_API_KEY"):
        # Skip if already set
        return

    # If not directly provided, build from individual var
    db_user = os.getenv("DB_USER", "flow_user")
    db_pass = os.getenv("DB_PASS", "flow_pass")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    db_name = os.getenv("DB_NAME", "flow")
    db_url = f"postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}"

    conn = psycopg2.connect(db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT openai_api_key FROM settings LIMIT 1;")
            row = cur.fetchone()
            if not row or not row[0]:
                raise RuntimeError("openai_api_key not found in settings table")
            os.environ["OPENAI_API_KEY"] = row[0]
    finally:
        conn.close()
