import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.db.base import Base
from app.core.config import settings
from app.models.observability import AIRequestLog

def init_observability_db():
    engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
    AIRequestLog.__table__.create(bind=engine, checkfirst=True)
    print("Observability table created successfully.")

if __name__ == "__main__":
    init_observability_db()
