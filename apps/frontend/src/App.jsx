import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CompensationProvider } from './context/CompensationContext';
import { ProtectedRoute } from './components/templates/ProtectedRoute';
import { DashboardLayout } from './components/templates/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OverviewPage } from './pages/OverviewPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { DistributionPage } from './pages/DistributionPage';
import { EmployeesImportPage } from './pages/EmployeesImportPage';
import { SalaryBandsPage } from './pages/SalaryBandsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <CompensationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard" element={<Navigate to="/dashboard/overview" replace />} />
                <Route path="/dashboard/overview" element={<OverviewPage />} />
                <Route path="/dashboard/simulator" element={<SimulatorPage />} />
                <Route path="/dashboard/distribution" element={<DistributionPage />} />
                <Route path="/employees" element={<EmployeesImportPage />} />
                <Route path="/bands" element={<SalaryBandsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Navigate to="/dashboard/overview" replace />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CompensationProvider>
    </AuthProvider>
  );
}

export default App;
