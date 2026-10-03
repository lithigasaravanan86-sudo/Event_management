import os
import pymysql
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "cems_college_secret_key_2026_super_secure")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # MySQL Configuration Defaults (Standard XAMPP / local MySQL)
    DB_TYPE = os.getenv("DB_TYPE", "mysql").lower()
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB = os.getenv("MYSQL_DB", "cems_db")

    @classmethod
    def get_database_uri(cls):
        """
        Attempts to connect to MySQL if configured.
        If MySQL is offline or connection fails, seamlessly falls back to SQLite
        to guarantee zero-downtime demonstration for college projects.
        """
        if cls.DB_TYPE == "sqlite":
            sqlite_path = os.path.join(BASE_DIR, "cems.db")
            print(f"[CEMS Config] Explicitly using SQLite database: {sqlite_path}")
            return f"sqlite:///{sqlite_path}", "SQLite"

        # Attempt MySQL Connection
        try:
            conn = pymysql.connect(
                host=cls.MYSQL_HOST,
                port=cls.MYSQL_PORT,
                user=cls.MYSQL_USER,
                password=cls.MYSQL_PASSWORD,
                connect_timeout=2
            )
            # Ensure database exists
            with conn.cursor() as cursor:
                cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{cls.MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            conn.close()

            # Encode password if needed
            pwd_part = f":{cls.MYSQL_PASSWORD}" if cls.MYSQL_PASSWORD else ""
            mysql_uri = f"mysql+pymysql://{cls.MYSQL_USER}{pwd_part}@{cls.MYSQL_HOST}:{cls.MYSQL_PORT}/{cls.MYSQL_DB}"
            print(f"[CEMS Config] Successfully connected to MySQL server at {cls.MYSQL_HOST}:{cls.MYSQL_PORT}/{cls.MYSQL_DB}")
            return mysql_uri, "MySQL"

        except Exception as e:
            # MySQL not available: auto fallback to SQLite
            sqlite_path = os.path.join(BASE_DIR, "cems.db")
            print(f"[CEMS Notice] MySQL connection not reachable ({e}).")
            print(f"[CEMS Notice] Automatically using local SQLite database at: {sqlite_path}")
            print(f"[CEMS Notice] (To use MySQL, start XAMPP/MySQL and import database/schema.sql)")
            return f"sqlite:///{sqlite_path}", "SQLite (Fallback)"
