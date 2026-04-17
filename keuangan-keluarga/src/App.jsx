import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { HouseholdProvider } from './context/HouseholdContext';
import Layout from './components/layout/Layout';
import FloatingActionButton from './components/FloatingActionButton';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import AssetsSavings from './pages/AssetsSavings';
import Debts from './pages/Debts';
import Recurring from './pages/Recurring';
import Settings from './pages/Settings';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="budget" element={<Budget />} />
                <Route path="assets-savings" element={<AssetsSavings />} />
                <Route path="debts" element={<Debts />} />
                <Route path="recurring" element={<Recurring />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
            <FloatingActionButton />
          </BrowserRouter>
        </AppProvider>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;
