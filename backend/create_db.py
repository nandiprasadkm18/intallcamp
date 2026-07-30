import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_db():
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="password", # wait, the config says nandi
        host="localhost",
        port="5432"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cursor = conn.cursor()
    
    # Check if database exists
    cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'majorproject'")
    exists = cursor.fetchone()
    
    if not exists:
        cursor.execute("CREATE DATABASE majorproject")
        print("Database majorproject created successfully.")
    else:
        print("Database majorproject already exists.")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    try:
        # Since config says postgres:nandi
        conn = psycopg2.connect(dbname="postgres", user="postgres", password="nandi", host="localhost", port="5432")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'majorproject'")
        if not cursor.fetchone():
            cursor.execute("CREATE DATABASE majorproject")
            print("DB Created")
        else:
            print("DB Exists")
    except Exception as e:
        print(f"Error: {e}")
