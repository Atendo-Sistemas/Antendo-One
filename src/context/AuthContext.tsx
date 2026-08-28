import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, Tenant, Driver, Vehicle, AppNotification, SupportSessionInfo } from '../types';
import { api, setAuthToken, getAuthToken, clearAuthToken } from '../services/api';

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId: string | null;
  driverId?: string;
}

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  driver: Driver | null;
  vehicles: Vehicle[];
  availableDemoAccounts: DemoAccount[];
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  supportSession: SupportSessionInfo | null;
  startSupportSession: (targetUserId: string) => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  startDemoSession: (userId?: string) => Promise<void>;
  endSupportSession: () => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: Partial<User> & { address?: string; city?: string; state?: string; zipCode?: string; password?: string }) => Promise<{ success: boolean; user: User }>;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [availableDemoAccounts, setAvailableDemoAccounts] = useState<DemoAccount[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [supportSession, setSupportSession] = useState<SupportSessionInfo | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setTenant(data.tenant);
      setDriver(data.driver || null);
      setVehicles(data.vehicles || []);
      setAvailableDemoAccounts(data.availableDemoAccounts || []);
      setSupportSession(data.supportSession || null);
    } catch (err: any) {
      if (err?.status === 401) {
        clearAuthToken();
        setUser(null); setTenant(null); setDriver(null); setVehicles([]); setAvailableDemoAccounts([]); setSupportSession(null);
      } else {
        console.error('Error fetching user profile:', err);
      }
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);
    } catch (err) {
      // Silently handle temporary network or server startup fetch errors
    }
  }, []);

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const res = await api.switchDemoUser(userId);
      if (!res?.token) throw new Error('A sessão de demonstração não retornou um token válido.');
      setAuthToken(res.token);
      setUser(res.user);
      setTenant(res.tenant || null);
      setDriver(res.driver || null);
      setVehicles(res.vehicles || []);
      setSupportSession(null);
      await refreshNotifications();
    } catch (err) {
      console.error('Error switching demo user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startDemoSession = async (userId?: string) => {
    setLoading(true);
    try {
      const res = await api.startDemoSession(userId);
      setAuthToken(res.token);
      setUser(res.user);
      setTenant(res.tenant || null);
      setDriver(res.driver || null);
      setVehicles(res.vehicles || []);
      setAvailableDemoAccounts([]);
      setSupportSession(null);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const startSupportSession = async (targetUserId: string) => {
    setLoading(true);
    try {
      const res = await api.startSupportSession(targetUserId);
      setAuthToken(res.token);
      setUser(res.user);
      setTenant(res.tenant || null);
      setDriver(res.driver || null);
      setVehicles(res.vehicles || []);
      setSupportSession(res.supportSession);
      await refreshNotifications();
    } finally {
      setLoading(false);
    }
  };

  const endSupportSession = async () => {
    setLoading(true);
    try {
      const res = await api.endSupportSession();
      setAuthToken(res.token);
      setUser(res.user);
      setTenant(res.tenant || null);
      setDriver(res.driver || null);
      setVehicles(res.vehicles || []);
      setSupportSession(null);
      await refreshNotifications();
    } catch (err: any) {
      console.error('Erro ao encerrar sessão de suporte:', err);
      if (err?.status === 401 || err?.status === 400) {
        clearAuthToken();
        setUser(null);
        setTenant(null);
        setDriver(null);
        setVehicles([]);
        setSupportSession(null);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications read:', err);
    }
  };

  const logout = useCallback(() => {
    void api.logout().catch(() => undefined);
    setUser(null);
    setTenant(null);
    setDriver(null);
    setVehicles([]);
    setSupportSession(null);
    clearAuthToken();
  }, []);

  const updateUserProfile = async (data: Partial<User> & { address?: string; city?: string; state?: string; zipCode?: string; password?: string }) => {
    const result = await api.updateProfile(data);
    if (result.user) {
      setUser(result.user);
      if (result.driver) {
        setDriver(result.driver);
      }
    }
    return result;
  };

  useEffect(() => {
    const init = async () => {
      const token = getAuthToken();
      if (token && token !== '') {
        await refreshProfile();
        await refreshNotifications();
      }
      setLoading(false);
    };
    init();

    // Notification polling interval
    const interval = setInterval(() => {
      const token = getAuthToken();
      if (token && token !== '') {
        refreshNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshProfile, refreshNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        driver,
        vehicles,
        availableDemoAccounts,
        notifications,
        unreadCount,
        loading,
        supportSession,
        startSupportSession,
        switchUser,
        startDemoSession,
        endSupportSession,
        logout,
        refreshProfile,
        updateUserProfile,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead
      }}
    >
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
