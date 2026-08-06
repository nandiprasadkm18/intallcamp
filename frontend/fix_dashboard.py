import os

file_path = r"c:\Users\nandi\OneDrive\Desktop\MajorProject\frontend\src\pages\Dashboard.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. State variables
content = content.replace(
    "const [timetables, setTimetables] = useState([]);",
    "const [timetables, setTimetables] = useState([]);\n  const [isTimetableEditMode, setIsTimetableEditMode] = useState(false);\n  const [editingTimetableSlot, setEditingTimetableSlot] = useState(null);"
)

# 2. Update and Delete functions
update_delete_funcs = """
  const handleUpdateTimetable = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/timetables/${editingTimetableSlot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          subject_name: editingTimetableSlot.subject_name,
          start_time: editingTimetableSlot.start_time,
          end_time: editingTimetableSlot.end_time
        }),
      });
      if (response.ok) {
        setEditingTimetableSlot(null);
        loadTimetables();
      } else {
        alert("Failed to update timetable");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTimetable = async (id) => {
    if (!window.confirm("Are you sure you want to delete this class slot?")) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/admin/timetables/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setEditingTimetableSlot(null);
        loadTimetables();
      } else {
        alert("Failed to delete timetable");
      }
    } catch (err) {
      console.error(err);
    }
  };
"""
content = content.replace(
    "const handleAdminCreateUser = async (e) => {",
    update_delete_funcs.strip() + "\n\n  const handleAdminCreateUser = async (e) => {"
)

# 3. schedRoomName and AM/PM state
content = content.replace(
    'const [schedRoomId, setSchedRoomId] = useState("");',
    'const [schedRoomName, setSchedRoomName] = useState("");'
)
content = content.replace(
    'const [schedStart, setSchedStart] = useState("09:00");',
    'const [schedStart, setSchedStart] = useState("09:00 AM");'
)
content = content.replace(
    'const [schedEnd, setSchedEnd] = useState("10:30");',
    'const [schedEnd, setSchedEnd] = useState("10:30 AM");'
)

# 4. Update handleAdminCreateSchedule
old_create_sched = """  const handleAdminCreateSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!schedRoomId || !schedSubject || !schedStart || !schedEnd) {
      setError("Please fill out all fields");
      return;
    }
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin/timetables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classroom_id: parseInt(schedRoomId),
          day_of_week: schedDay,
          start_time: schedStart,
          end_time: schedEnd,
          subject_name: schedSubject,
          year: parseInt(schedYear),
          semester: parseInt(schedSem),
          department: schedDept,
          section: schedSection
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create schedule");
      }
      setSuccess("Timetable schedule block successfully created!");
      setSchedRoomId("");
      setSchedSubject("");
      loadTimetables();
    } catch (err) {
      setError(err.message);
    }
  };"""

new_create_sched = """  const handleAdminCreateSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!schedRoomName || !schedSubject || !schedStart || !schedEnd) {
      setError("Please fill out all fields");
      return;
    }
    try {
      let resolvedRoomId = null;
      const existingRoom = classrooms.find(c => c.name.toLowerCase() === schedRoomName.toLowerCase() || c.code.toLowerCase() === schedRoomName.toLowerCase());
      if (existingRoom) {
        resolvedRoomId = existingRoom.id;
      } else {
        const resRoom = await fetch('http://127.0.0.1:8000/api/v1/academic/classrooms', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ name: schedRoomName, code: schedRoomName }),
        });
        if (!resRoom.ok) throw new Error("Failed to auto-create classroom");
        const newRoomData = await resRoom.json();
        resolvedRoomId = newRoomData.id;
        loadRooms();
      }

      const response = await fetch('http://127.0.0.1:8000/api/admin/timetables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          classroom_id: resolvedRoomId,
          day_of_week: schedDay,
          start_time: schedStart,
          end_time: schedEnd,
          subject_name: schedSubject,
          year: parseInt(schedYear),
          semester: parseInt(schedSem),
          department: schedDept,
          section: schedSection
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to create schedule");
      }
      setSuccess("Timetable schedule block successfully created!");
      setSchedRoomName("");
      setSchedSubject("");
      loadTimetables();
    } catch (err) {
      setError(err.message);
    }
  };"""
content = content.replace(old_create_sched, new_create_sched)

# 5. Update Classroom Dropdown
old_dropdown = """                      <select
                        value={schedRoomId}
                        onChange={(e) => setSchedRoomId(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="">-- Choose Classroom --</option>
                        {classrooms.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </select>"""
new_dropdown = """                      <input
                        type="text"
                        required
                        value={schedRoomName}
                        onChange={(e) => setSchedRoomName(e.target.value)}
                        className="w-full bg-slate-955 border border-gray-200 rounded pl-3 pr-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. M408"
                      />"""
content = content.replace(old_dropdown, new_dropdown)


# 6. Update Timetable Grid Header (Edit Mode UI)
old_grid_header = """                <div className="flex items-center gap-4">
                  <h4 className="font-semibold text-sm text-gray-800">Master Academic Schedule</h4>
                </div>"""
new_grid_header = """                <div className="flex items-center gap-4">
                  <h4 className="font-semibold text-sm text-gray-800">Master Academic Schedule</h4>
                  {user?.role === 'College Admin' && (
                    <label className="flex items-center gap-2 cursor-pointer border border-indigo-200 bg-indigo-50 px-3 py-1 rounded-full">
                      <input type="checkbox" checked={isTimetableEditMode} onChange={e => setIsTimetableEditMode(e.target.checked)} className="sr-only peer" />
                      <div className="w-7 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600 relative"></div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900">Edit Mode</span>
                    </label>
                  )}
                </div>"""
content = content.replace(old_grid_header, new_grid_header)


# 7. Update Grid Class Click to Open Modal
old_class_click = """                                            <div className="h-full w-full p-2 border-l-4 rounded bg-indigo-50/80 border-indigo-500 hover:bg-indigo-100/90 transition-colors group flex flex-col justify-between">"""
new_class_click = """                                            <div 
                                              className={`h-full w-full p-2 border-l-4 rounded bg-indigo-50/80 border-indigo-500 hover:bg-indigo-100/90 transition-all group flex flex-col justify-between ${isTimetableEditMode ? 'cursor-pointer hover:ring-2 hover:ring-indigo-400' : ''}`}
                                              onClick={() => {
                                                if (isTimetableEditMode) setEditingTimetableSlot(classStartingHere);
                                              }}
                                            >"""
content = content.replace(old_class_click, new_class_click)


# 8. Fix parseTime and classStartingHere
old_parse_time = """                  const parseTime = (timeStr) => {
                    if (!timeStr) return 0;
                    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (!match) return 0;
                    let [, hours, minutes, period] = match;
                    hours = parseInt(hours, 10);
                    minutes = parseInt(minutes, 10);
                    if (period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                    if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                  };"""
new_parse_time = """                  const parseTime = (timeStr) => {
                    if (!timeStr) return 0;
                    const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
                    if (!match) return 0;
                    let [, hours, minutes, period] = match;
                    hours = parseInt(hours, 10);
                    minutes = parseInt(minutes, 10);
                    if (period && period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
                    if (period && period.toUpperCase() === 'AM' && hours === 12) hours = 0;
                    return hours * 60 + minutes;
                  };"""
content = content.replace(old_parse_time, new_parse_time)

old_class_starting = "const classStartingHere = timetables.find(t => t.day_of_week === day && t.start_time === slot.start);"
new_class_starting = "const classStartingHere = timetables.find(t => t.day_of_week === day && parseTime(t.start_time) === parseTime(slot.start));"
content = content.replace(old_class_starting, new_class_starting)

# 9. Add Edit Modal
edit_modal = """        {editingTimetableSlot && (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-semibold text-gray-800">Edit Timetable Slot</h3>
                <button onClick={() => setEditingTimetableSlot(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateTimetable} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject Name</label>
                  <input type="text" value={editingTimetableSlot.subject_name} onChange={e => setEditingTimetableSlot({...editingTimetableSlot, subject_name: e.target.value})} className="w-full bg-slate-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                    <input type="text" value={editingTimetableSlot.start_time} onChange={e => setEditingTimetableSlot({...editingTimetableSlot, start_time: e.target.value})} className="w-full bg-slate-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                    <input type="text" value={editingTimetableSlot.end_time} onChange={e => setEditingTimetableSlot({...editingTimetableSlot, end_time: e.target.value})} className="w-full bg-slate-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500" required />
                  </div>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                  <button type="button" onClick={() => handleDeleteTimetable(editingTimetableSlot.id)} className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded text-sm font-semibold transition-colors">
                    Delete Slot
                  </button>
                  <div className="flex-1"></div>
                  <button type="button" onClick={() => setEditingTimetableSlot(null)} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-sm font-semibold transition-colors">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
"""

content = content.replace(
    "      </div>\n    );\n  };\n\n  return (",
    edit_modal + "\n      </div>\n    );\n  };\n\n  return ("
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fix script applied successfully.")
