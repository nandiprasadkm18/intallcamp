from sqlalchemy import create_engine, MetaData, text
from database import DATABASE_URL

def clear_database():
    print(f"Connecting to database: {DATABASE_URL}")
    engine = create_engine(DATABASE_URL)
    
    # Get metadata
    metadata = MetaData()
    metadata.reflect(bind=engine)
    
    with engine.begin() as conn:
        print("Truncating all tables in PostgreSQL with CASCADE...")
        table_names = list(metadata.tables.keys())
        if table_names:
            tables_str = ", ".join(f'"{name}"' for name in table_names)
            truncate_query = f"TRUNCATE TABLE {tables_str} RESTART IDENTITY CASCADE;"
            conn.execute(text(truncate_query))
            print(f"Successfully truncated tables: {', '.join(table_names)}")
        else:
            print("No tables found in database metadata.")
            
    print("--- Database Reset Complete ---")

if __name__ == "__main__":
    clear_database()
