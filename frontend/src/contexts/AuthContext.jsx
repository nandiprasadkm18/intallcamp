import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const normalizeUser = (u) => {
  if (!u || !u.role) return u;
  let role = u.role.toLowerCase();
  if (role === 'teacher') role = 'Teacher';
  else if (role === 'student') role = 'Student';
  else if (role === 'college admin') role = 'College Admin';
  else if (role === 'super admin') role = 'Super Admin';
  return { ...u, role };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchUserProfile(token);
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchUserProfile = async (authToken) => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(normalizeUser(userData));
      } else {
        logout();
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }
      setToken(data.access_token);
      setUser(normalizeUser(data.user));
      return data.user;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (name, email, password, role, section, department, year, semester) => {
    try {
      // Map frontend roles to backend role strings
      const roleMap = {
        'student': 'Student',
        'teacher': 'Teacher'
      };
      
      const response = await fetch('http://127.0.0.1:8000/api/v1/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          full_name: name, 
          email: email, 
          password: password, 
          role_name: roleMap[role] || 'Student',
          year: role === 'student' ? parseInt(year) : null,
          semester: role === 'student' ? parseInt(semester) : null,
          section: role === 'student' ? section : null,
          department: department ? department.toUpperCase() : null
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }
      
      // Auto login after registration
      return await login(email, password);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
