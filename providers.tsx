'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@hospigrow/auth';
import { HospigrowApiClient, setApiClient } from '@hospigrow/api-client';

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const issuerOrigin = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER ?? 'http://localhost:8080';
const realm = process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? 'hospigrow';
const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'patient-app';

function ApiBootstrapper({ children }: { children: ReactNode }) {
  const { user, signIn } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setApiClient(
      new HospigrowApiClient({
        baseUrl: apiUrl,
        getAccessToken: () => user?.accessToken ?? null,
        onUnauthorized: signIn,
      }),
    );
    setReady(true);
  }, [user, signIn]);

  if (!ready) return null;
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <AuthProvider
      config={{
        issuerOrigin,
        realm,
        clientId,
        redirectUri: typeof window !== 'undefined' ? window.location.origin + '/' : '',
        postLogoutRedirectUri:
          typeof window !== 'undefined' ? window.location.origin + '/' : '',
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ApiBootstrapper>{children}</ApiBootstrapper>
      </QueryClientProvider>
    </AuthProvider>
  );
}
