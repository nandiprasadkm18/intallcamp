<div align="center">

# 🌟 Intellcamp 🌟

*An intelligent, full-stack educational platform powered by AI.*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 🚀 Overview
**Intellcamp** is a cutting-edge web application blending a lightning-fast React frontend with a robust FastAPI backend. Designed to revolutionize the modern classroom, it leverages the power of AI (via Groq), WebSockets for real-time collaboration, and scalable cloud storage to deliver a seamless learning experience for students, teachers, and enterprise administrators.

---

## ✨ Features

### 🎓 Live Smart Classroom
- **Real-Time Collaborative Coding:** Integrated Monaco Editor with multi-language support (Python, JS, Java, C, Go). Code changes are synchronized live across all student screens via WebSockets.
- **Built-in AI Compiler & Debugger:** Execute code directly in the browser. If a student encounters a syntax error, the "AI Fix" button automatically analyzes the traceback, explains the error, and provides the corrected code using Groq LLM.
- **Live Speech-to-Text Whisper:** Real-time transcription of the teacher's lecture using advanced audio streaming.
- **Ghost Doubt Board:** An anonymous QA board where students can safely ask questions during live lectures without fear of judgment.

### 🤖 Automated AI Administration
- **Instant Lecture Summarization:** Upon ending a class, the raw lecture transcript is automatically processed by AI to generate executive summaries, key concepts, and pop quizzes.
- **Cloud Archival:** All transcripts and generated summaries are securely archived to Cloudflare R2 / AWS S3 object storage to preserve database performance.

### 📊 Role-Based Dashboards
- **Student Portal:** Track attendance percentages, view registered subjects, access preserved lecture summaries, and monitor academic growth logs.
- **Teacher Portal:** Create live classroom sessions with targeted Year and Section scoping, monitor live class telemetry, and manage timetables.
- **Super Admin Enterprise Portal:** Manage participating colleges, oversee global users, monitor system health, and control feature toggles across the entire platform.

### 📱 Responsive & Accessible
- **Mobile-First Design:** Fully responsive fluid grids and hamburger navigation ensure the platform looks and works perfectly on mobile phones, tablets, and desktop computers.

---

## 🏗️ Architecture

```mermaid
graph TD
    Client([💻 React Frontend]) <-->|REST API / WebSockets| API(⚡ FastAPI Backend)
    
    subgraph Data Layer
        API <--> DB[(🐘 PostgreSQL + pgvector)]
        API <--> Redis[(🔴 Redis Pub/Sub)]
    end
    
    subgraph External Services
        API <-->|AI Inference| Groq(🧠 Groq LLM API)
        API <-->|Cloud Storage| R2(☁️ Cloudflare R2 / S3)
        API <-->|Code Execution| Judge(⚖️ Judge0 / Piston API)
    end
```

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React.js (v18) with React Router
- **Styling:** Tailwind CSS, Framer Motion (Animations)
- **Icons & Charts:** Lucide React, Recharts
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)

### Backend
- **Framework:** FastAPI, Uvicorn
- **Database:** PostgreSQL (with `pgvector` for semantic search), SQLAlchemy ORM
- **Authentication:** PyJWT, bcrypt, python-multipart
- **Real-Time:** WebSockets, Redis (Pub/Sub for scaling)
- **File Processing:** PyMuPDF, sentence-transformers, boto3

---

## ⚙️ Quick Start

### 1️⃣ Database Setup
Ensure your **PostgreSQL** server is running and create a new database (e.g., `majorproject`). Ensure **Redis** is running locally for WebSocket Pub/Sub.

### 2️⃣ Environment Variables
Create a `.env` file in the `backend/` directory using this template:

```env
# 🐘 Database Configuration
DATABASE_URL=postgresql://<user>:<password>@localhost/<db_name>

# 🔴 Redis Configuration
REDIS_URL=redis://localhost:6379

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