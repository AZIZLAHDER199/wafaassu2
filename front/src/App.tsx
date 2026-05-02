import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import './index.css';
import Chatbot from './components/chatbot/Chatbot';
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
import Welcome from './pages/userpa/Welcome';

const HIDE_CHAT_ON = ['/', '/login', '/logout'];

function ChatbotGlobal() {
  const { pathname } = useLocation();
  if (HIDE_CHAT_ON.includes(pathname)) return null;
  return <Chatbot />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
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

      <ChatbotGlobal />
    </Router>
  );
}

export default App;
