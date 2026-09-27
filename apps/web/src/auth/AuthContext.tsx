import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppUserDto } from '@elliotJHarding/meals-api';
import * as authApi from '../api/auth';

type AuthState = {
  user: AppUserDto | null;
  loading: boolean;
  login: (googleCredential: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .whoAmI()
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const login = async (googleCredential: string) => {
    const loggedIn = await authApi.login(googleCredential);
    setUser(loggedIn);
  };

  const logout = async () => {
    // Always drop the local user, even if the network call fails — the server
    // session is cleared regardless and the client must not stay "logged in".
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return auth;
}
