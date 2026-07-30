export const analyticsService = {
  async getColleges() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/v1/tenant/colleges', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  async getPlatformGrowth() {
    const colleges = await this.getColleges();
    if (colleges.length === 0) return [];
    
    // Group by month created
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = new Array(12).fill(0);
    
    colleges.forEach((c: any) => {
      if (c.created_at) {
        const date = new Date(c.created_at);
        counts[date.getMonth()]++;
      } else {
        // Fallback if no created_at
        counts[new Date().getMonth()]++;
      }
    });

    let runningTotal = 0;
    const growth = months.map((month, idx) => {
      runningTotal += counts[idx];
      return { name: month, colleges: runningTotal };
    });

    return growth;
  },
  
  async getSubscriptionDistribution() {
    const colleges = await this.getColleges();
    if (colleges.length === 0) return [];
    
    const dist: any = { 'enterprise': 0, 'pro': 0, 'free': 0 };
    colleges.forEach((c: any) => {
      const plan = c.subscription ? c.subscription.toLowerCase() : 'free';
      if (dist[plan] !== undefined) {
        dist[plan]++;
      } else {
        dist['free']++;
      }
    });

    return [
      { name: 'Enterprise', value: dist['enterprise'], color: '#111827' },
      { name: 'Professional', value: dist['pro'], color: '#4f46e5' },
      { name: 'Basic / Free', value: dist['free'], color: '#9ca3af' }
    ].filter(item => item.value > 0);
  },
  
  async getStorageUsage() {
    const colleges = await this.getColleges();
    if (colleges.length === 0) return [];
    
    // Sort by storage_used descending, take top 5
    const sorted = [...colleges].sort((a: any, b: any) => (b.storage_used || 0) - (a.storage_used || 0)).slice(0, 5);
    
    return sorted.map((c: any) => ({
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      storage: c.storage_used || 0
    }));
  },
  
  async getSystemHealth() {
    return [
      { service: 'Database Core', status: 'Healthy', color: 'text-emerald-600' },
      { service: 'Auth Gateway', status: 'Healthy', color: 'text-emerald-600' },
      { service: 'Storage Pipeline', status: 'Healthy', color: 'text-emerald-600' },
      { service: 'AI Agent Subsystem', status: 'Healthy', color: 'text-emerald-600' }
    ];
  }
};
