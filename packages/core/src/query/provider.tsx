import { createContext, createElement, useContext, useMemo, type ReactNode } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { createMealsApi, type ApiClientConfig, type MealsApiBundle } from './api-client';

/**
 * Shared QueryClient defaults.
 *
 * `staleTime: 0` is deliberate, not incidental: it is what gives the week hook
 * its "render cached instantly, refetch in the background" behaviour for free.
 * `retry: false` keeps the read paths that map errors to a benign empty/null
 * value (receipts, family group, calendar) snappy rather than retrying a known
 * failure three times.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });
}

/**
 * Injects the api-client seam into the hooks. The web app builds an
 * ApiClientConfig from its cookie axios instance and wraps the tree in
 * MealsApiProvider; native builds a bearer config and does the same. The hooks
 * read the resulting SDK bundle through `useMealsApi()` and never import a
 * platform-built axios instance themselves.
 */
const MealsApiContext = createContext<MealsApiBundle | null>(null);

export function MealsApiProvider({
  config,
  children,
}: {
  config: ApiClientConfig;
  children: ReactNode;
}) {
  // Rebuild the SDK bundle only when the injected config identity changes.
  const api = useMemo(() => createMealsApi(config), [config]);
  return createElement(MealsApiContext.Provider, { value: api }, children);
}

export function useMealsApi(): MealsApiBundle {
  const api = useContext(MealsApiContext);
  if (api === null) {
    throw new Error('useMealsApi must be used within a MealsApiProvider');
  }
  return api;
}
