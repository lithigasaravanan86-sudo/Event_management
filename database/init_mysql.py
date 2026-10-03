"""
Helper script to initialize MySQL database and execute schema.sql directly into MySQL.
Run: python database/init_mysql.py
"""
import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "schema.sql")

MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "cems_db")

def init_mysql():
    print("=" * 60)
    print("  Initializing College Event Management System (CEMS) MySQL DB")
    print(f"  Target: {MYSQL_USER}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}")
    print("=" * 60)

    try:
        conn = pymysql.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            autocommit=True
        )
        cursor = conn.cursor()
        print("[1/3] Connected to MySQL Server.")

        # Read schema.sql
        with open(SCHEMA_FILE, "r", encoding="utf-8") as f:
            sql_script = f.read()

        print("[2/3] Executing database/schema.sql...")
        # Split into statements while skipping comments
        statements = sql_script.split(";")
        for stmt in statements:
            stmt = stmt.strip()
            if stmt and not stmt.startswith("--") and not stmt.startswith("/*"):
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    print(f"Warning on query: {stmt[:60]}... -> {e}")

        cursor.close()
        conn.close()
        print("[3/3] MySQL Database initialized and seeded successfully!")
        print("=" * 60)
        print("  You can now start CEMS with: python app.py")
        print("=" * 60)
    except Exception as e:
        print(f"[Error] Failed to connect to MySQL: {e}")
        print("Make sure your MySQL service (e.g. XAMPP) is running on port 3306.")

if __name__ == "__main__":
    init_mysql()
