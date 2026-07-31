# Intellcamp

Intellcamp is a full-stack web application featuring a React-based frontend and a FastAPI-based backend.

## Requirements

### Backend Requirements
- **Python 3.10+** (Python 3.12 recommended)
- **PostgreSQL** (with `pgvector` extension enabled for vector operations)
- **Redis** server (for caching or background tasks)
- Dependencies in `backend/requirements.txt`:
  - `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `pgvector`
  - `pyjwt`, `bcrypt`, `python-multipart`, `python-dotenv`
  - `pymupdf` (for PDF processing), `sentence-transformers`
  - `boto3` (for S3/R2 storage integration)

### Frontend Requirements
- **Node.js** (v18+)
- **npm** or **yarn**
- Dependencies (from `frontend/package.json`):
  - `react`, `react-router-dom`
  - `tailwindcss`, `framer-motion`, `lucide-react`, `recharts`

## Setup Instructions

### 1. Database Connections
Ensure you have a PostgreSQL server running and create a database for the project (e.g., `majorproject`).
You will also need to have a Redis server running (usually on `localhost:6379`).

### 2. Environment Variables (.env)
Create a `.env` file in the `backend/` directory and configure the following required connections and API keys:

```env
# PostgreSQL Database Connection
DATABASE_URL=postgresql://<username>:<password>@localhost/<database_name>

# Authentication
SECRET_KEY=your_super_secret_key_here

# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379

# Cloudflare R2 / S3 Compatible Storage Configuration
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT_URL=https://your-endpoint.r2.cloudflarestorage.com

# Groq API Key (For AI/LLM functionality)
GROQ_API_KEY=your_groq_api_key_here
```

### 3. Running the Application

#### Backend
Navigate to the `backend` directory, install the Python dependencies, and run the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
Navigate to the `frontend` directory, install dependencies, and start the Vite development server:
```bash
cd frontend
npm install
npm run dev
```