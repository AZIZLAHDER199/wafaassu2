import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import './index.css';
import CompanySelection from './pages/userpa/CompanySelection';
import FactureRecords from './pages/userpa/FactureRecords';
import GenerateFacturePage from './pages/userpa/GenerateFacturePage';
import HomePage from './pages/userpa/Home';
import InvenData from './pages/userpa/InterventionRecords';
import LoginPage from './pages/userpa/Login';
import Logout from './pages/userpa/Logout';
import OperationForm from './pages/userpa/OperationForm';
import Statistics from './pages/userpa/Statistics';
import SuiviCarburantRecords from './pages/userpa/SuiviCarburantRecords';
import UserHistoryPage from './pages/userpa/UserHistoryPage';
import UserRoute from './pages/userpa/UserRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/home" element={<UserRoute><HomePage /></UserRoute>} />
        <Route path="/operation" element={<UserRoute><OperationForm /></UserRoute>} />
        <Route path="/company-selection" element={<UserRoute><CompanySelection /></UserRoute>} />
        <Route path="/intervention-records-data" element={<UserRoute><InvenData /></UserRoute>} />
        <Route path="/suivi-carburant-records" element={<UserRoute><SuiviCarburantRecords /></UserRoute>} />
        <Route path="/facture-records" element={<UserRoute><FactureRecords /></UserRoute>} />
        <Route path="/generate-facture/:id" element={<UserRoute><GenerateFacturePage /></UserRoute>} />
        <Route path="/userhistory" element={<UserRoute><UserHistoryPage /></UserRoute>} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/logout" element={<Logout />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
