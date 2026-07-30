from app.db.base import Base
from app.models.tenant import College, CollegeDomain
from app.models.user import User, Role, Permission, role_permission_association
from app.models.academic import Department, Program, Semester, Section, Course, ClassroomResource
from app.models.activity import AuditLog, StorageFile, AIRequest, Classroom, LectureSession, Attendance, Doubt, TranscriptRecord, LectureSummary
from app.models.ai import AIJobStatus, ResourceChunk, TranscriptChunk, SummaryChunk
