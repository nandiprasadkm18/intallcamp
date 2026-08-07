from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.v1.tenant import departments
from app.api.v1.academic import courses

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://intallcamp.vercel.app"
    ], # Specific origins are required when allow_credentials=True
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
from app.api.v1 import auth, users
from app.api.v1.tenant import departments, colleges, analytics
from app.api.v1.academic import courses, classrooms, resources, timetables
from app.api.v1.ai import compiler
from app.api.v1 import admin_dashboard
from app.api.ws import classroom as ws_classroom

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["Users"])
app.include_router(colleges.router, prefix=f"{settings.API_V1_STR}/tenant/colleges", tags=["Tenant Management (Super Admin)"])
app.include_router(departments.router, prefix=f"{settings.API_V1_STR}/tenant/departments", tags=["Tenant Management"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/tenant/analytics", tags=["Tenant Analytics"])
app.include_router(courses.router, prefix=f"{settings.API_V1_STR}/academic/courses", tags=["Academic Structure"])
app.include_router(classrooms.router, prefix=f"{settings.API_V1_STR}/academic/classrooms", tags=["Academic Classrooms"])
app.include_router(resources.router, prefix=f"{settings.API_V1_STR}/academic/classrooms", tags=["Academic Resources"])
app.include_router(compiler.router, prefix=f"{settings.API_V1_STR}/ai", tags=["AI Compiler Workspace"])
app.include_router(timetables.router, prefix="/api/admin/timetables", tags=["Timetables"])
app.include_router(admin_dashboard.router, prefix="/api/admin/system", tags=["Admin Dashboard"])

app.include_router(ws_classroom.router, prefix="/ws/classroom", tags=["WebSockets"])

@app.get("/")
def root():
    return {"message": "Welcome to INTELLCAMP Enterprise API"}
