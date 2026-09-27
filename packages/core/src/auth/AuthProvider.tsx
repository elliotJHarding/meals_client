import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { AppUserDto } from '@elliotJHarding/meals-api';
import type { AuthAdapters } from './adapters';
import { AuthOrchestrator } from './orchestrator';

/**
 * The auth context shape consumed by views. Identical to the web AuthState
 * (apps/web/src/auth/AuthContext.tsx:5-10) so existing views — LoginPage,
 * RequireAuth — compile unchanged against the moved provider.
 */
export interface AuthState {
  user: AppUserDto | null;
  loading: boolean;
  login: (googleCredential: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * Re-resolve the current user from the server (whoAmI) and update state,
   * WITHOUT posting /auth/login. For platforms whose sign-in already established
   * the session out-of-band: native runs the authCode-bearing /auth/login inside
   * its credential provider (one POST, storing the bearer pair), then calls this
   * to sync the user — avoiding a second, redundant /auth/login. Web does not need
   * it (its sign-in widget calls login() directly).
   */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export interface AuthProviderProps {
  /**
   * Platform adapters: token storage and the API client config. The provider
   * builds an {@link AuthOrchestrator} from them. React, not the orchestrator,
   * owns the React-only concerns here (state, the mount effect); everything
   * platform-specific is behind the adapters.
   */
  adapters: AuthAdapters;
  children: ReactNode;
}

/**
 * Framework-React, platform-agnostic auth provider.
 *
 * This is the React shell from AuthContext.tsx with its direct `../api/auth`
 * import replaced by an injected {@link AuthOrchestrator}. It deliberately does
 * NOT import react-dom, @react-oauth/google, react-router, or any browser global
 * — sign-in widget, navigation and the session-storage decision all live behind
 * the adapters / in the platform view layer.
 *
 * Behaviour preserved from the web source:
 *  - Bootstrap: on mount call whoAmI(), set the user, clear loading in `finally`
 *    (so a failed bootstrap still stops the loading screen). (AuthContext.tsx:18-23)
 *  - login: resolve the user via the orchestrator and set it. (24-28)
 *  - logout: always drop the local user in `finally`, even if the network call
 *    throws — the client must never stay "logged in". (30-38)
 */
export function AuthProvider({ adapters, children }: AuthProviderProps) {
  const [user, setUser] = useState<AppUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  const orchestrator = useMemo(
    () => new AuthOrchestrator(adapters.apiClient, adapters.tokenStorage),
    [adapters.apiClient, adapters.tokenStorage],
  );

  useEffect(() => {
    let active = true;
    orchestrator
      .whoAmI()
      .then((resolved) => {
        if (active) setUser(resolved);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [orchestrator]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: async (googleCredential: string) => {
        const resolved = await orchestrator.login(googleCredential);
        setUser(resolved);
      },
      refreshUser: async () => {
        const resolved = await orchestrator.whoAmI();
        setUser(resolved);
      },
      logout: async () => {
        try {
          await orchestrator.logout();
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading, orchestrator],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Access the auth state. Throws if used outside {@link AuthProvider} — the same
 * must-be-within-provider guard as the web hook (AuthContext.tsx:47-53).
 */
export function useAuth(): AuthState {
  const auth = useContext(AuthContext);
  if (!auth) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return auth;
}
