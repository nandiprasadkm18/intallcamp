import React, { useState, useEffect, useMemo } from 'react';
import { Users as UsersIcon, Building2, ArrowLeft, Shield, Mail } from 'lucide-react';
import { DataTable } from '../components/tables/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface College {
  id: number;
  name: string;
  code: string;
  primary_domain: string;
  status: string;
  domains?: { domain: string, is_primary: boolean }[];
}

interface User {
  id: number;
  full_name: string;
  email: string;
  role: { name: string };
  is_active: boolean;
}

const SuperAdminUsers = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch Colleges on mount
  useEffect(() => {
    const fetchColleges = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenant/colleges`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setColleges(data);
        } else {
          setError("Failed to fetch colleges");
        }
      } catch (e: any) {
        setError(e.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // Fetch users when a college is selected
  useEffect(() => {
    if (!selectedCollege) return;
    
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/users/college/${selectedCollege.id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        } else {
          setError("Failed to fetch users for this college");
        }
      } catch (e: any) {
        setError(e.message || "An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [selectedCollege]);

  const collegeColumns = useMemo<ColumnDef<College>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Institution',
        cell: info => <div className="font-bold text-gray-900">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'code',
        header: 'Code',
        cell: info => <span className="text-gray-500 font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: 'primary_domain',
        header: 'Primary Domain',
        cell: info => {
          const row = info.row.original;
          const primaryDomain = row.domains?.find(d => d.is_primary)?.domain || row.primary_domain || 'N/A';
          return (
            <div className="flex items-center text-sm">
              <Mail className="h-3 w-3 mr-2 text-gray-400" />
              {primaryDomain}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: info => (
          <button 
            onClick={() => setSelectedCollege(info.row.original)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded transition-colors"
          >
            View Users
          </button>
        )
      }
    ],
    []
  );

  const userColumns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'full_name',
        header: 'Name',
        cell: info => <div className="font-bold text-gray-900">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: info => (
          <div className="flex items-center text-sm text-gray-600">
            <Mail className="h-3 w-3 mr-2 text-gray-400" />
            {info.getValue() as string}
          </div>
        ),
      },
      {
        accessorKey: 'role.name',
        header: 'Role',
        cell: info => {
          const role = info.getValue() as string;
          let color = 'bg-gray-100 text-gray-700 border-gray-200';
          if (role === 'College Admin') color = 'bg-purple-50 text-purple-700 border-purple-200';
          if (role === 'Teacher') color = 'bg-blue-50 text-blue-700 border-blue-200';
          if (role === 'Student') color = 'bg-emerald-50 text-emerald-700 border-emerald-200';
          
          return (
            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${color}`}>
              {role}
            </span>
          )
        },
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: info => (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-black">
            <span className={`h-2 w-2 mr-2 rounded-full ${info.getValue() ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {info.getValue() ? 'Active' : 'Inactive'}
          </span>
        ),
      }
    ],
    []
  );

  return (
    <div className="bg-white p-8 animate-fade-in font-sans min-h-full">
      <div className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center">
            {selectedCollege ? (
              <>
                <Building2 className="mr-3 h-6 w-6 text-gray-400" />
                {selectedCollege.name} Users
              </>
            ) : (
              <>
                <UsersIcon className="mr-3 h-6 w-6 text-gray-400" />
                User Directory
              </>
            )}
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            {selectedCollege ? `Manage students, teachers, and admins for ${selectedCollege.code}` : "Select an institution to view its users."}
          </p>
        </div>
        
        {selectedCollege && (
          <button 
            onClick={() => setSelectedCollege(null)}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center">
          <Shield className="h-4 w-4 mr-2" />
          <span className="font-bold mr-2">Error:</span> {error}
        </div>
      )}
      
      {loading && !users.length && !colleges.length && (
         <div className="py-12 flex justify-center text-sm font-medium text-gray-500">Loading data...</div>
      )}

      {!selectedCollege ? (
        <div className="animate-fade-in">
          <DataTable columns={collegeColumns} data={colleges} searchKey="name" />
        </div>
      ) : (
        <div className="animate-fade-in">
           {users.length === 0 && !loading ? (
             <div className="text-center py-12 border border-gray-200 bg-gray-50 rounded">
               <h3 className="text-lg font-bold text-gray-900 mb-2">No Users Found</h3>
               <p className="text-sm text-gray-500">There are no users registered for this college yet.</p>
             </div>
           ) : (
             <DataTable columns={userColumns} data={users} searchKey="full_name" />
           )}
        </div>
      )}
    </div>
  );
};

export default SuperAdminUsers;
