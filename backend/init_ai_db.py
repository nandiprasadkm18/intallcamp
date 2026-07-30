import os
import sys

# Ensure backend directory is in path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from app.db.base import Base
from app.core.config import settings

# Import the new models so they are registered with Base
from app.models.ai import AIJobStatus, ResourceChunk

def init_ai_db():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    
    # Create the vector extension
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
        print("pgvector extension ensured.")

    # Create tables
    Base.metadata.create_all(bind=engine)
    print("AI tables created successfully.")

if __name__ == "__main__":
    init_ai_db()
