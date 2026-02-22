import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AdminLayout from './layouts/AdminLayout';
import { lightTheme, darkTheme } from './styles/theme';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Posts = lazy(() => import('./pages/Posts'));
const Users = lazy(() => import('./pages/Users'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Payments = lazy(() => import('./pages/Payments'));
const Blocked = lazy(() => import('./pages/Blocked'));
const Groups = lazy(() => import('./pages/Groups'));
const Sessions = lazy(() => import('./pages/Sessions'));
const Vip = lazy(() => import('./pages/Vip'));
const Settings = lazy(() => import('./pages/Settings'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider theme={isDark ? darkTheme : lightTheme}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <AdminLayout isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} />
              }
            >
              <Route
                index
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="posts"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Posts />
                  </Suspense>
                }
              />
              <Route
                path="users"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Users />
                  </Suspense>
                }
              />
              <Route
                path="subscriptions"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Subscriptions />
                  </Suspense>
                }
              />
              <Route
                path="payments"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Payments />
                  </Suspense>
                }
              />
              <Route
                path="blocked"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Blocked />
                  </Suspense>
                }
              />
              <Route
                path="groups"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Groups />
                  </Suspense>
                }
              />
              <Route
                path="sessions"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Sessions />
                  </Suspense>
                }
              />
              <Route
                path="vip"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Vip />
                  </Suspense>
                }
              />
              <Route
                path="settings"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <Settings />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
};

export default App;
