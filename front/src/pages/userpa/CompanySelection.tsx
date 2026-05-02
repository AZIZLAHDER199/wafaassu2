import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './assets/logo.png'; // Main logo for the top
import maiLogo from './assets/maiL.png'; // MAI logo
import imaLogo from './assets/ima.png'; // IMA logo
import rmaLogo from './assets/RMA.png'; // RMA logo

// Map company names to their respective logos
const companyLogos: { [key: string]: string } = {
  MAI: maiLogo,
  IMA: imaLogo,
  RMA: rmaLogo,
};

const CompanySelection: React.FC = () => {
  const navigate = useNavigate();

  const companies: string[] = ['MAI', 'IMA', 'RMA'];

  const handleCompanyClick = (company: string): void => {
    // Navigate to the Facture form with the selected company as a query parameter
    navigate(`/operation?type=facture&company=${company}`);
  };

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-pink-100 to-peach-100 flex flex-col items-center justify-between py-8">
      <div className="flex flex-col items-center">
        <img
          src={logo}
          alt="Tamanar Assistance Remorquage Expert Auto Logo"
          className="w-32 h-32 mb-6 object-contain"
        />
        <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">
          Sélectionnez une Société d'Assistance
        </h1>

        {/* Grid layout for company logos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-lg">
          {companies.map((company) => (
            <div
              key={company}
              className="flex flex-col items-center"
            >
              <button
                onClick={() => handleCompanyClick(company)}
                className="group relative flex justify-center items-center w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <img
                  src={companyLogos[company]}
                  alt={`${company} Logo`}
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </button>
              <span className="mt-2 text-gray-800 font-semibold text-lg tracking-wide uppercase">
                {company}
              </span>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-gray-600 text-sm mt-8">
        Powered by Lahderaziz
      </footer>
    </div>
  );
};

export default CompanySelection;