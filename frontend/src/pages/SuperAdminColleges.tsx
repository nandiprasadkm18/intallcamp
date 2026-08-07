import React, { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Globe, HardDrive, Check, ArrowLeft, ArrowRight, MapPin, Phone, Mail, Link as LinkIcon, GraduationCap } from 'lucide-react';
import { DataTable } from '../components/tables/DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface College {
  id: number;
  name: string;
  code: string;
  institution_type?: string;
  storage_limit: number;
  max_students: number;
  created_at?: string;
  status: string;
  subscription: string;
  domains?: { domain: string, is_primary: boolean }[];
}

const SuperAdminColleges = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [view, setView] = useState<'list' | 'add'>('list');
  
  // Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [affiliation, setAffiliation] = useState("");
  const [accreditation, setAccreditation] = useState<string[]>([]);
  
  const [officialEmail, setOfficialEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  
  const [primaryDomain, setPrimaryDomain] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchColleges = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenant/colleges`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const enriched = data.map((c: any) => ({
          ...c,
          status: c.status || 'Active',
          subscription: c.storage_limit > 50 ? 'Enterprise' : 'Professional'
        }));
        setColleges(enriched);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleCreateCollege = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/tenant/colleges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name, 
          code, 
          institution_type: institutionType,
          established_year: establishedYear ? parseInt(establishedYear) : null,
          affiliation: affiliation || null,
          accreditation: accreditation.length > 0 ? accreditation : null,
          official_email: officialEmail,
          phone, 
          website,
          country,
          state,
          city,
          pin_code: pinCode || null,
          full_address: fullAddress || null,
          primary_domain: primaryDomain,
          additional_domains: [],
          admin_email: adminEmail,
          admin_password: adminPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to provision tenant");
      setSuccess(`Successfully provisioned tenant: ${data.name}`);
      
      // Reset form
      setName(""); setCode(""); setInstitutionType(""); setEstablishedYear(""); 
      setAffiliation(""); setAccreditation([]); setOfficialEmail(""); setPhone(""); 
      setWebsite(""); setCountry(""); setState(""); setCity(""); setPinCode(""); 
      setFullAddress(""); setPrimaryDomain(""); setAdminEmail(""); setAdminPassword("");
      
      fetchColleges();
      setTimeout(() => setView("list"), 2000); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccreditationChange = (val: string) => {
    if (accreditation.includes(val)) {
      setAccreditation(accreditation.filter(a => a !== val));
    } else {
      setAccreditation([...accreditation, val]);
    }
  };

  const columns = useMemo<ColumnDef<College>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Institution',
        cell: info => <div className="font-bold text-gray-900">{info.getValue() as string}</div>,
      },
      {
        accessorKey: 'primary_domain',
        header: 'Domain',
        cell: info => {
          const row = info.row.original;
          const primaryDomain = row.domains?.find(d => d.is_primary)?.domain || row.primary_domain || 'N/A';
          return (
            <div className="flex items-center text-sm">
              <Globe className="h-3 w-3 mr-2 text-gray-400" />
              {primaryDomain}
            </div>
          )
        },
      },
      {
        accessorKey: 'subscription',
        header: 'Subscription',
        cell: info => (
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
            info.getValue() === 'Enterprise' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: 'max_students',
        header: 'Students Limit',
        cell: info => (info.getValue() as number).toLocaleString(),
      },
      {
        accessorKey: 'storage_limit',
        header: 'Storage',
        cell: info => (
          <div className="flex items-center text-sm">
            <HardDrive className="h-3 w-3 mr-2 text-gray-400" />
            {info.getValue() as number} GB
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: info => (
          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-black">
            <span className={`h-2 w-2 mr-2 rounded-full ${info.getValue() === 'Pending Configuration' ? 'bg-yellow-400' : 'bg-emerald-500'}`}></span>
            {info.getValue() as string}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="bg-white p-8 animate-fade-in font-sans min-h-full">
      <div className="mb-8 border-b border-gray-200 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Colleges Management</h2>
          <p className="text-gray-500 mt-1 text-sm">Manage enterprise tenants, quotas, and subscriptions.</p>
        </div>
        
        {view === 'list' ? (
          <button 
            onClick={() => { setView('add'); setSuccess(''); setError(''); }}
            className="bg-black hover:bg-gray-800 text-white px-5 py-2.5 text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> Create College
          </button>
        ) : (
          <button 
            onClick={() => setView('list')}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-2.5 text-sm font-medium flex items-center transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center">
          <span className="font-bold mr-2">Error:</span> {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center">
          <Check className="h-4 w-4 mr-2" />
          <span className="font-bold mr-2">Success:</span> {success}
        </div>
      )}

      {view === 'list' ? (
        <div className="animate-fade-in">
          <DataTable columns={columns} data={colleges} searchKey="name" />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-sm animate-fade-in mb-10">
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Building2 className="mr-2 h-5 w-5 text-gray-600" />
              Step 1: Create College (Minimum Information)
            </h3>
            <p className="text-sm text-gray-500 mt-1 ml-7">
              Enter the basic institution details. Features, storage, and quotas can be configured later.
            </p>
          </div>
          
          <form onSubmit={handleCreateCollege} className="p-8 space-y-10">
            
            {/* Basic Institution Information */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2 text-gray-400"/> Basic Institution Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Institution Name *</label>
                  <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Example: Vidyavardhaka College of Engineering" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Institution Short Name *</label>
                  <input required type="text" value={code} onChange={e => setCode(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Example: VVCE" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Institution Type *</label>
                  <select required value={institutionType} onChange={e => setInstitutionType(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black appearance-none">
                    <option value="" disabled>Select Type...</option>
                    <option value="University">University</option>
                    <option value="Engineering College">Engineering College</option>
                    <option value="Medical College">Medical College</option>
                    <option value="Polytechnic">Polytechnic</option>
                    <option value="School">School</option>
                    <option value="Training Institute">Training Institute</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Established Year</label>
                  <input type="number" value={establishedYear} onChange={e => setEstablishedYear(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Example: 1997" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">University Affiliation</label>
                  <input type="text" value={affiliation} onChange={e => setAffiliation(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Example: Visvesvaraya Technological University (VTU)" />
                </div>
                
                <div className="relative">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Accreditation (Multi-select)</label>
                  
                  {/* Custom Dropdown */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => {
                        const el = document.getElementById('accreditation-dropdown');
                        if (el) el.classList.toggle('hidden');
                      }}
                      className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm text-left flex justify-between items-center focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
                    >
                      <span className="truncate">
                        {accreditation.length > 0 ? accreditation.join(', ') : 'Select Accreditations...'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    
                    {/* Dropdown Menu */}
                    <div id="accreditation-dropdown" className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg hidden">
                      <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                        {['NAAC', 'NBA', 'AICTE', 'UGC', 'Autonomous', 'Other'].map(acc => (
                          <label key={acc} className="flex items-center px-3 py-2 hover:bg-gray-50 rounded cursor-pointer text-sm text-gray-700">
                            <input 
                              type="checkbox" 
                              className="mr-3 text-black focus:ring-black rounded-sm border-gray-300" 
                              checked={accreditation.includes(acc)} 
                              onChange={() => handleAccreditationChange(acc)} 
                            />
                            {acc}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Official Contact Information */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center">
                <Phone className="h-4 w-4 mr-2 text-gray-400"/> Official Contact Information
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Official Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input required type="email" value={officialEmail} onChange={e => setOfficialEmail(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="info@vvce.ac.in" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Official Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input required type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="+91 821 241 1450" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Website</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="https://www.vvce.ac.in" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Address */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-gray-400"/> Address
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Country *</label>
                  <input required type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="India" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">State *</label>
                  <input required type="text" value={state} onChange={e => setState(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Karnataka" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">City *</label>
                  <input required type="text" value={city} onChange={e => setCity(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Mysuru" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">PIN Code</label>
                  <input type="text" value={pinCode} onChange={e => setPinCode(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="570002" />
                </div>
                <div className="col-span-1 md:col-span-3">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Address</label>
                  <input type="text" value={fullAddress} onChange={e => setFullAddress(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="P.B. No.206, Gokulam III Stage..." />
                </div>
              </div>
            </div>

            {/* Email Domain & Admin Account Configuration */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2 flex items-center">
                <Globe className="h-4 w-4 mr-2 text-gray-400"/> Admin Account & Domain Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1.5">Primary Email Domain *</label>
                  <input required type="text" value={primaryDomain} onChange={e => setPrimaryDomain(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Example: vvce.ac.in" />
                  <p className="text-xs text-gray-500 mt-2">Used to validate institutional email addresses.</p>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1.5">College Admin Email *</label>
                  <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="admin@vvce.ac.in" />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-900 uppercase tracking-widest mb-1.5">College Admin Password *</label>
                  <input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full bg-transparent border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black" placeholder="Secure password" />
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end border-t border-gray-200">
              <button disabled={loading} type="submit" className="bg-black hover:bg-gray-900 text-white font-medium text-sm py-3 px-8 rounded transition-colors flex justify-center items-center shadow-md">
                {loading ? 'Processing...' : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Create College
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SuperAdminColleges;

