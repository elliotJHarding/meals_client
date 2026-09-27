import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MotionConfig } from 'framer-motion';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, MealsApiProvider, createQueryClient } from '@meals_client/core';
import App from './App';
import { apiClientConfig, authAdapters } from './platform/webPlatform';
import './styles/theme.css';

// One QueryClient for the app lifetime; its defaults (staleTime 0, retry false)
// live in core's createQueryClient so web and native share them.
const queryClient = createQueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <MealsApiProvider config={apiClientConfig}>
          <AuthProvider adapters={authAdapters}>
            <BrowserRouter>
              <MotionConfig reducedMotion="user">
                <App />
              </MotionConfig>
            </BrowserRouter>
          </AuthProvider>
        </MealsApiProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>,
);
