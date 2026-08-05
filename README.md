<div align="center">

# 🌟 Intellcamp 🌟

*An intelligent, full-stack educational platform powered by AI.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)

</div>

---

## 🚀 Overview
**Intellcamp** is a cutting-edge web application blending a lightning-fast React frontend with a robust FastAPI backend. It leverages the power of AI (via Groq), vector databases, and scalable cloud storage to deliver a seamless learning experience.

---

## 🏗️ Architecture

```mermaid
graph TD
    Client([💻 React Frontend]) <-->|REST API / WebSockets| API(⚡ FastAPI Backend)
    
    subgraph Data Layer
        API <--> DB[(🐘 PostgreSQL + pgvector)]
        API <--> Cache[(🔴 Redis Cache)]
    end
    
    subgraph External Services
        API <-->|AI Inference| Groq(🧠 Groq LLM API)
        API <-->|Cloud Storage| R2(☁️ Cloudflare R2 / S3)
    end
```

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

<details>
<summary><b>🐍 Backend Requirements (Click to Expand)</b></summary>
<br>

- **Python 3.10+** (3.12 recommended)
- **PostgreSQL** (with `pgvector` extension)
- **Redis Server** (for caching & background tasks)
- Core dependencies: `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `pgvector`
- Security & Utilities: `pyjwt`, `bcrypt`, `python-multipart`, `python-dotenv`
- File Processing: `pymupdf`, `sentence-transformers`, `boto3`
</details>

<details>
<summary><b>⚛️ Frontend Requirements (Click to Expand)</b></summary>
<br>

- **Node.js** (v18+)
- **npm** or **yarn**
- Core: `react`, `react-router-dom`
- UI & Styling: `tailwindcss`, `framer-motion`, `lucide-react`, `recharts`
</details>

---

## ⚙️ Quick Start

### 1️⃣ Database & Cache Setup
Ensure your **PostgreSQL** server is running and create a new database (e.g., `majorproject`). Make sure your **Redis** server is active (default: `localhost:6379`).

> [!TIP]
> **Running Redis on Windows:**
> - If using **WSL (Windows Subsystem for Linux)**, open your WSL terminal and run: `sudo service redis-server start`
> - If using a **native Windows port**, open your terminal and run: `redis-server`

### 2️⃣ Environment Variables
Create a `.env` file in the `backend/` directory using this template:

```env
# 🐘 Database & Cache
DATABASE_URL=postgresql://<user>:<password>@localhost/<db_name>
REDIS_HOST=localhost
REDIS_PORT=6379

# 🔐 Security
SECRET_KEY=your_super_secret_key_here

# ☁️ Cloud Storage (Cloudflare R2/S3)
R2_BUCKET_NAME=your-bucket-name
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_ENDPOINT_URL=https://your-endpoint.r2.cloudflarestorage.com

# 🧠 AI / LLM Integration
GROQ_API_KEY=your_groq_api_key_here
```

### 3️⃣ Fire it up! 🔥

**Starting the Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```
*API docs available at: http://localhost:8000/docs*

**Starting the Frontend:**
```bash
cd frontend
npm install
npm run dev
```
*App available at: http://localhost:5173*

---

<div align="center">
  <i>Built with ❤️ for the future of education.</i>
</div>