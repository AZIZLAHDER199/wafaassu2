import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FactureData } from './OperationForm'; // Adjust path if needed

const FactureRecords: React.FC = () => {
  const [facturesData, setFacturesData] = useState<FactureData[]>([]);
  const [facturesCount, setFacturesCount] = useState<number>(0);
  const [lastEditDate, setLastEditDate] = useState<string | null>(null);
  const [showTotal, setShowTotal] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
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

    fetchFacturesData(token);
  }, [navigate]);

  const fetchFacturesData = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/get_factures/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) return fetchFacturesData(newToken);
        }
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }

      const data = await response.json() as FactureData[];
      console.log('Fetched factures data:', data);
      setFacturesData(data);
      setFacturesCount(data.length);
      if (data.length > 0) {
        const sortedData = data.sort((a, b) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setLastEditDate(sortedData[0].date);
      } else {
        setLastEditDate(null);
      }
    } catch (error) {
      console.error('Error fetching factures data:', error);
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

  const deleteFacture = async (id: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in again.');
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/facture/${id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchFacturesData(token);
        alert('Facture deleted successfully!');
      } else if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) await deleteFacture(id);
      } else {
        throw new Error('Failed to delete facture');
      }
    } catch (error) {
      console.error('Error deleting facture:', error);
      alert('Error deleting facture: ' + (error as Error).message);
    }
  };

  const exportFactureToPDF = async (facture: FactureData) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in again.');
      navigate('/login');
      return;
    }

    const formData = new FormData();
    formData.append('facture_num', facture.facture_num || 'N/A');
    formData.append('date', facture.date || 'N/A');
    formData.append('destinataire', facture.billing_company || 'N/A');
    formData.append('ice', facture.ice || 'N/A');
    formData.append('adresse', facture.adresse || 'N/A');
    formData.append('reference', facture.reference || 'N/A');
    formData.append('point_attach', facture.point_attach || 'N/A');
    formData.append('lieu_intervention', facture.lieu_intervention || 'N/A');
    formData.append('destination', facture.destination || 'N/A');
    formData.append('perimetre', facture.perimetre || 'N/A');
    formData.append('description', facture.description || 'N/A');
    formData.append('details', facture.details || '');
    formData.append('montant', facture.montant_ttc?.toString() || '0');

    try {
      const response = await fetch('http://localhost:8000/generate_facture_pdf/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Response status:', response.status); // Log bch n-chuf l-status
      if (!response.ok) {
        if (response.status === 401) {
          const newToken = await refreshToken();
          if (newToken) return exportFactureToPDF(facture);
        } else if (response.status === 404) {
          throw new Error('Endpoint /generate_facture_pdf/ not found. Check server configuration.');
        }
        throw new Error(`Failed to generate PDF: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${facture.facture_num || facture.id}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating facture PDF:', error);
      alert('Error generating facture PDF: ' + (error as Error).message);
    }
  };

  const exportToPDF = () => {
    if (facturesData.length === 0) {
      alert('No factures data available to export.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Registre des Factures', 14, 20);

    const columns = [
      'ID', 'Numéro Facture', 'Date', 'Société', 'ICE', 'Adresse', 'Référence', 'Lieu',
      'Destination', 'Périmètre', 'Description', 'Montant HT', 'TVA', 'Montant TTC', 'User',
    ];

    const rows = facturesData.map((facture) => [
      facture.id.toString(),
      facture.facture_num || 'N/A',
      facture.date || 'N/A',
      facture.billing_company || 'N/A',
      facture.ice || 'N/A',
      facture.adresse || 'N/A',
      facture.reference || 'N/A',
      facture.lieu_intervention || 'N/A',
      facture.destination || 'N/A',
      facture.perimetre || 'N/A',
      facture.description || 'N/A',
      facture.montant_ht?.toString() || '0',
      facture.tva?.toString() || '0',
      facture.montant_ttc?.toString() || '0',
      facture.user?.username || 'N/A',
    ]);

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 10 }, 1: { cellWidth: 20 }, 2: { cellWidth: 15 }, 3: { cellWidth: 20 },
        4: { cellWidth: 15 }, 5: { cellWidth: 20 }, 6: { cellWidth: 15 }, 7: { cellWidth: 20 },
        8: { cellWidth: 20 }, 9: { cellWidth: 15 }, 10: { cellWidth: 25 }, 11: { cellWidth: 15 },
        12: { cellWidth: 15 }, 13: { cellWidth: 15 }, 14: { cellWidth: 15 },
      },
    });

    doc.save(`factures_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="text-center text-lg">Loading...</div>;
  if (error) return <div className="text-center text-lg text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen w-screen bg-blue-300 flex flex-col items-center justify-between py-8">
      <div className="flex flex-col items-center w-full">
        <h2 className="text-2xl font-bold mb-4">Registre des Factures Records</h2>
        <p className="text-lg mb-2">Total Factures: {facturesCount}</p>
        <p className="text-lg mb-4">Last Edit: {lastEditDate || 'N/A'}</p>
        <button
          onClick={() => setShowTotal(!showTotal)}
          className="bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-600 mb-4"
        >
          {showTotal ? 'Hide Total' : 'Show Total'}
        </button>
        {showTotal && (
          <div className="total-section bg-gray-100 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-semibold">Total Factures</h3>
            <p>Total: {facturesCount}</p>
          </div>
        )}
        {facturesData.length > 0 ? (
          <table className="w-full max-w-4xl bg-white rounded-lg shadow-lg">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b">ID</th>
                <th className="py-2 px-4 border-b">Numéro Facture</th>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Société</th>
                <th className="py-2 px-4 border-b">Référence</th>
                <th className="py-2 px-4 border-b">Lieu</th>
                <th className="py-2 px-4 border-b">Destination</th>
                <th className="py-2 px-4 border-b">Montant TTC</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {facturesData.map((facture) => (
                <tr key={facture.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{facture.id}</td>
                  <td className="py-2 px-4 border-b">{facture.facture_num}</td>
                  <td className="py-2 px-4 border-b">{facture.date}</td>
                  <td className="py-2 px-4 border-b">{facture.billing_company}</td>
                  <td className="py-2 px-4 border-b">{facture.reference}</td>
                  <td className="py-2 px-4 border-b">{facture.lieu_intervention}</td>
                  <td className="py-2 px-4 border-b">{facture.destination}</td>
                  <td className="py-2 px-4 border-b">{facture.montant_ttc}</td>
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => deleteFacture(facture.id)}
                      className="bg-red-500 text-white font-semibold py-1 px-2 rounded-lg hover:bg-red-600 mr-2"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => exportFactureToPDF(facture)}
                      className="bg-green-500 text-white font-semibold py-1 px-2 rounded-lg hover:bg-green-600"
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-lg">No factures found.</p>
        )}
        <div className="mt-4">
          <button
            onClick={exportToPDF}
            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition-all duration-300"
          >
            Export All to PDF
          </button>
        </div>
        {isAdmin && (
          <div className="mt-4">
            <button
              onClick={() => navigate('/facture-data')}
              className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300"
            >
              View Facture Data
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactureRecords;