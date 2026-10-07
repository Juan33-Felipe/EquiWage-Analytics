import React, { useState } from 'react';
import { DashboardLayout } from './components/templates/DashboardLayout';
import { DashboardPage } from './pages/DashboardPage';
import { OverviewPage } from './pages/OverviewPage';
import { SimulatorPage } from './pages/SimulatorPage';

function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'overview' && <OverviewPage />}
      {activeTab === 'simulator' && <SimulatorPage />}
      {activeTab === 'distribution' && <DashboardPage />}
    </DashboardLayout>
  );
}

export default App;
