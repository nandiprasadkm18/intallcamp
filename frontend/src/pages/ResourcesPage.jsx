import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClassroom } from '../contexts/ClassroomContext';
import { 
  Folder, 
  FileText, 
  Download, 
  Search, 
  Upload, 
  FileArchive, 
  PlayCircle,
  FolderPlus,
  ArrowDownToLine,
  ChevronRight
} from 'lucide-react';

const ResourcesPage = () => {
  const { user } = useAuth();
  const { resources, uploadResource, downloadResource } = useClassroom();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFolder, setActiveFolder] = useState("all"); // all, notes, code, sheets
  
  // Custom upload fields
  const [title, setTitle] = useState("");
  const [type, setType] = useState("PDF");
  const [success, setSuccess] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!title) return;
    const sizes = ["1.8 MB", "3.4 MB", "5.2 MB", "0.9 MB"];
    const fileSize = sizes[Math.floor(Math.random() * sizes.length)];
    
    await uploadResource(title, type, fileSize);
    setTitle("");
    setSuccess("Academic document package created and stored successfully.");
    setTimeout(() => setSuccess(""), 4000);
  };

  const handleDownload = async (id, title) => {
    await downloadResource(id);
    // Simulate downloading by opening a alert
    alert(`Initiating secure institutional download for packet: "${title}"`);
  };

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  // Filter list by folder and search
  const filtered = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = activeFolder === 'all' || 
      (activeFolder === 'notes' && res.file_type === 'PDF') ||
      (activeFolder === 'code' && res.file_type === 'ZIP') ||
      (activeFolder === 'sheets' && (res.file_type === 'PPTX' || res.file_type === 'DOCX'));
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-8">
      {success && (
        <div className="p-3.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
          {success}
        </div>
      )}

      {/* Split section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side (Search & Folder List Tabs) */}
        <div className="space-y-6">
          {/* Search Card */}
          <div className="academic-card p-6">
            <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">
              Resource Search Index
            </h4>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded pl-10 pr-4 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                placeholder="Search subject documents..."
              />
            </div>
          </div>

          {/* Subject Folders */}
          <div className="academic-card p-6">
            <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4">
              Subject Folders Roster
            </h4>
            <nav className="space-y-1.5">
              {[
                { id: 'all', name: 'All Packets', count: resources.length },
                { id: 'notes', name: 'PDF Lecture Notes', count: resources.filter(r => r.file_type === 'PDF').length },
                { id: 'code', name: 'Source Archives (ZIP)', count: resources.filter(r => r.file_type === 'ZIP').length },
                { id: 'sheets', name: 'Syllabi & Sheets (PPT/DOC)', count: resources.filter(r => r.file_type === 'PPTX' || r.file_type === 'DOCX').length }
              ].map(folder => {
                const isActive = activeFolder === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => setActiveFolder(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded text-xs font-bold transition-all uppercase tracking-wider ${
                      isActive 
                        ? 'bg-black/10 text-indigo-600 border border-indigo-200' 
                        : 'text-gray-600 hover:bg-white/40 hover:text-gray-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Folder className={`h-4 w-4 ${isActive ? 'text-indigo-600' : 'text-gray-500'}`} />
                      <span>{folder.name}</span>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-white text-gray-500 border border-gray-200 text-[10px]">
                      {folder.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Uploader (Teachers only) */}
          {isTeacher && (
            <div className="academic-card p-6">
              <h4 className="font-bold text-sm text-gray-800 border-b border-gray-200 pb-4 mb-4 flex items-center space-x-2">
                <FolderPlus className="h-4.5 w-4.5 text-indigo-500" />
                <span>Upload Document Packet</span>
              </h4>
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">Document Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-xs text-gray-800 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Distributed Sagas Guide"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1.5">File Format</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded px-2.5 py-2 text-xs text-gray-600 font-bold focus:outline-none"
                  >
                    <option value="PDF">PDF (Lecture Notes)</option>
                    <option value="ZIP">ZIP (Code Sandbox)</option>
                    <option value="PPTX">PPTX (Lecture Slides)</option>
                    <option value="DOCX">DOCX (Syllabus/Sheet)</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded bg-white hover:bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5"
                >
                  <Upload className="h-4 w-4" />
                  <span>Broadcast Resource</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side (Folders content browser) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="academic-card p-6">
            <h4 className="font-bold text-base text-gray-800 border-b border-gray-200 pb-4 mb-5 flex items-center justify-between">
              <span>Classroom Resources Index</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-gray-600 border border-gray-200">
                {filtered.length} Packets Found
              </span>
            </h4>

            <div className="space-y-4">
              {filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-xs font-semibold">
                  No files cataloged under this criteria.
                </div>
              ) : (
                filtered.map((file) => (
                  <div key={file.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between gap-4 transition-colors hover:border-gray-200">
                    <div className="flex items-center space-x-3.5 select-text">
                      <div className="p-2.5 bg-white border border-gray-200 text-indigo-600 rounded-lg">
                        {file.file_type === 'ZIP' ? <FileArchive className="h-5.5 w-5.5" /> : <FileText className="h-5.5 w-5.5" />}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-800 text-xs sm:text-sm">{file.title}</h5>
                        <div className="flex items-center space-x-3 text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-wider">
                          <span>{file.file_type} Format</span>
                          <span>&bull;</span>
                          <span>Size: {file.file_size}</span>
                          {isTeacher && (
                            <>
                              <span>&bull;</span>
                              <span className="text-indigo-600 font-bold">Downloads: {file.downloads}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(file.id, file.title)}
                      className="p-2 bg-white hover:bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-indigo-600 transition-colors"
                      title="Download Secure Lecture Packet"
                    >
                      <ArrowDownToLine className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
