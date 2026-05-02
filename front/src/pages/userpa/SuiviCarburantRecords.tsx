import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuiviCarburantData } from './OperationForm'; // Adjust path if needed

const SuiviCarburantRecords: React.FC = () => {
  const [suiviData, setSuiviData] = useState<SuiviCarburantData[]>([]);
  const [suiviCount, setSuiviCount] = useState<number>(0);
  const [lastEditDate, setLastEditDate] = useState<string | null>(null);
  const [showTotal, setShowTotal] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Zyd loading state
  const [error, setError] = useState<string | null>(null); // Zyd error state
  const navigate = useNavigate();

  useEffect(() => {
    const adminStatus = localStorage.getItem('is_admin') === 'true';
    setIsAdmin(adminStatus);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to access this page.');
      navigate('/login');
      return;
    }

    fetchSuiviCarburantData(token);
  }, [navigate]);

  const fetchSuiviCarburantData = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/get_suivi_carburant/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) return fetchSuiviCarburantData(newToken);
        }
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json() as SuiviCarburantData[];
      console.log('Fetched data:', data); // Zyd log bch n-chuf l-data
      setSuiviData(data);
      setSuiviCount(data.length);
      if (data.length > 0) {
        const sortedData = data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLastEditDate(sortedData[0].date);
      } else {
        setLastEditDate(null);
      }
    } catch (error) {
      console.error('Error fetching suivi carburant data:', error);
      setError((error as Error).message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      alert('No refresh token found. Please log in again.');
      navigate('/login');
      return null;
    }
    try {
      const response = await fetch('http://localhost:8000/api/token/refresh/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.access);
        return data.access;
      } else {
        alert('Token refresh failed: ' + JSON.stringify(data));
        navigate('/login');
        return null;
      }
    } catch (error) {
      alert('Error refreshing token: ' + error);
      navigate('/login');
      return null;
    }
  };

  const deleteSuiviCarburant = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/suivi_carburant/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchSuiviCarburantData(token);
        alert('Suivi Carburant deleted successfully!');
      } else if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) await deleteSuiviCarburant(id);
      } else {
        throw new Error('Failed to delete suivi carburant');
      }
    } catch (error) {
      console.error('Error deleting suivi carburant:', error);
      alert('Error deleting suivi carburant: ' + (error as Error).message);
    }
  };

  if (loading) return <div className="text-center text-lg">Loading...</div>;
  if (error) return <div className="text-center text-lg text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen w-screen bg-blue-300 flex flex-col items-center justify-between py-8">
      <div className="flex flex-col items-center w-full">
        <h2 className="text-2xl font-bold mb-4">Registre des Suivi Carburant Records</h2>
        <p className="text-lg mb-2">Total Suivi Carburant: {suiviCount}</p>
        <p className="text-lg mb-4">Last Edit: {lastEditDate || 'N/A'}</p>
        <button
          onClick={() => setShowTotal(!showTotal)}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 mb-4"
        >
          {showTotal ? 'Hide Total' : 'Show Total'}
        </button>
        {showTotal && (
          <div className="total-section bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-semibold">Total Suivi Carburant</h3>
            <p>Total: {suiviCount}</p>
          </div>
        )}
        {suiviData.length > 0 ? (
          <table className="w-full max-w-4xl bg-white rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Véhicule</th>
                <th className="py-2 px-4 border-b">Prix</th>
                <th className="py-2 px-4 border-b">Service</th>
                <th className="py-2 px-4 border-b">Pompiste</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {suiviData.map((suivi) => (
                <tr key={suivi.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{suivi.id}</td>
                  <td className="py-2 px-4 border-b">{suivi.date}</td>
                  <td className="py-2 px-4 border-b">{suivi.vehicule}</td>
                  <td className="py-2 px-4 border-b">{suivi.prix}</td>
                  <td className="py-2 px-4 border-b">{suivi.service}</td>
                  <td className="py-2 px-4 border-b">{suivi.pompiste || 'N/A'}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => deleteSuiviCarburant(suivi.id)}
                      className="bg-red-500 text-white font-semibold py-1 px-2 rounded-lg hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-lg">No suivi carburant records found.</p>
        )}
        {isAdmin && (
          <div className="mt-4">
            <button
              onClick={() => navigate('/suivi-carburant-data')}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300"
            >
              View Suivi Carburant Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuiviCarburantRecords;