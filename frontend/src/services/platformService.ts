export interface PlatformKPIs {
  totalColleges: number;
  totalStudents: number;
  totalTeachers: number;
  totalCollegeAdmins: number;
  storageUsedTB: number;
  storageTotalTB: number;
  aiRequestsToday: number;
  monthlyRevenue: number;
  platformUptime: number;
}

export interface Activity {
  id: string;
  time: string;
  message: string;
  college: string;
  type: 'success' | 'warning' | 'info';
}

export const platformService = {
  async getKPIs(): Promise<PlatformKPIs> {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/tenant/colleges/kpis', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data as PlatformKPIs;
      }
    } catch (e) {
      console.error(e);
    }
    
    // Fallback if endpoint fails
    return {
      totalColleges: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalCollegeAdmins: 0,
      storageUsedTB: 0,
      storageTotalTB: 0,
      aiRequestsToday: 0,
      monthlyRevenue: 0,
      platformUptime: 0
    };
  },
  
  async getRecentActivities(): Promise<Activity[]> {
    return [];
  }
};
