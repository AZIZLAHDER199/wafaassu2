import React, { useState, useEffect, useCallback } from "react";
import {
  FaUserPlus,
  FaUsers,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaHome,
  FaSignOutAlt,
  FaChartLine,
  FaHistory,
  FaBell,
  FaCog,
  FaSearch,
  FaBars,
  FaFileInvoice,
  FaTruck,
  FaClipboardList,
  FaCalendarAlt, // Added for date pickers
  FaBuilding, // For company/society
  FaHashtag, // For number/reference
  FaEnvelope, // For email
  FaLock, // For password
  FaMapMarkerAlt, // For location
  FaCar, // For vehicle/immatriculation
  FaTags, // For brand/event
  FaRoad, // For destination/perimetre
  FaMoneyBillWave, // For cost/amount
  FaSyncAlt, // For status
  FaRegListAlt, // For description
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Theme Colors - Same as previous, extended for new elements
const getThemeColors = (isDarkMode: boolean) => {
  if (isDarkMode) {
    return {
      primary: "#6B46C1", // Deep Purple
      accent: "#82E2B1", // Light Green/Teal
      primaryDarker: "#553C9A",
      accentDarker: "#6EE7B7",
      alert: "#EF4444", // Red
      success: "#10B981", // Green
      info: "#3B82F6", // Blue
      warning: "#F59E0B", // Orange
      background: "#1F2937", // Darker Gray
      text: "#E5E7EB", // Light Gray
      textMuted: "#9CA3AF", // Muted Gray
      cardBackground: "rgba(55, 65, 81, 0.85)", // Semi-transparent Dark Gray
      cardBorder: "rgba(107, 70, 193, 0.2)", // Light Purple Border
      sidebarBackground: "#1A202C", // Even Darker Gray
      sidebarText: "#D1D5DB", // Lighter Gray
      sidebarActiveBackground: "#6B46C1", // Deep Purple
      sidebarActiveText: "#FFFFFF", // White
      sidebarHoverBg: "rgba(107, 70, 193, 0.3)", // Purple hover
      headerBackground: "#1F2937", // Darker Gray
      headerText: "#E5E7EB", // Light Gray
      buttonFont: "Montserrat, sans-serif",
      secondaryButtonBg: "rgba(107, 70, 193, 0.2)",
      secondaryButtonHoverBg: "rgba(107, 70, 193, 0.4)",
      secondaryButtonText: "#E5E7EB",
      iconDefault: "#9CA3AF",
      chartGrid: "rgba(229, 231, 235, 0.1)",
      chartAxis: "#9CA3AF",
      tooltipBg: "rgba(31, 41, 55, 0.95)",
      tooltipBorder: "#6B46C1",
      inputBackground: "#2D3748", // Dark gray for inputs
      inputBorder: "#4A5568", // Slightly lighter dark gray border
      inputPlaceholder: "#9CA3AF", // Muted gray placeholder
    };
  }
  return {
    primary: "#0D9488", // Teal
    accent: "#F97316", // Orange
    primaryDarker: "#0F766E",
    accentDarker: "#EA580C",
    alert: "#EF4444", // Red
    success: "#22C55E", // Green
    info: "#3B82F6", // Blue
    warning: "#F59E0B", // Orange
    background: "#F8FAFC", // Lightest Gray/Off-White
    text: "#1E293B", // Dark Blue-Gray
    textMuted: "#64748B", // Slate Gray
    cardBackground: "white",
    cardBorder: "#E2E8F0", // Light Gray
    sidebarBackground: "#FFFFFF", // White
    sidebarText: "#475569", // Slate Gray
    sidebarActiveBackground: "#E0F2F7", // Light Cyan
    sidebarActiveText: "#0D9488", // Teal
    sidebarHoverBg: "#F1F5F9", // Lighter gray hover
    headerBackground: "white",
    headerText: "#1E293B", // Dark Blue-Gray
    buttonFont: "Inter, sans-serif",
    secondaryButtonBg: "#E2E8F0",
    secondaryButtonHoverBg: "#CBD5E1",
    secondaryButtonText: "#475569",
    iconDefault: "#64748B",
    chartGrid: "#E2E8F0",
    chartAxis: "#94A3B8",
    tooltipBg: "white",
    tooltipBorder: "#0D9488",
    inputBackground: "#F7FAFC", // Lightest gray for inputs
    inputBorder: "#E2E8F0", // Light gray border
    inputPlaceholder: "#9CA3AF", // Muted gray placeholder
  };
};

// Interfaces (Keep as is)
interface User {
  id: number;
  username: string;
  email: string;
  active: boolean;
}

interface SignupStat {
  month: string;
  signups: number;
}

interface AdminActionLogItem {
  id: number;
  timestamp: string;
  admin_username: string;
  action: string;
  details: string;
  severity: "Low" | "Medium" | "High" | "Critical";
}

export interface InterventionData {
  id: number;
  ref_dossier: string;
  assure: string;
  date_intervention: string;
  user?: { username: string } | null;
  evenement: string;
  status: string;
  immatriculation?: string;
  marque?: string;
  lieu_intervention?: string;
  destination?: string;
  point_attache?: string; // Corrected typo based on image
  cout_prestation_ttc: number;
  tva: number;
}

interface SuiviCarburantData {
  id: number;
  date: string;
  vehicule: string;
  prix: number;
  service: string;
  pompiste: string;
  user?: { username: string } | null;
}

export interface FactureData {
  id: number;
  facture_num: string;
  date: string;
  billing_company: string;
  user?: { username: string } | null;
  ice: string;
  adresse: string;
  reference: string;
  point_attach: string;
  lieu_intervention: string;
  destination: string;
  perimetre: string;
  description: string;
  montant_ht: number;
  tva: number;
  montant_ttc: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [signupData, setSignupData] = useState<SignupStat[]>([]);
  const [adminActionLogs, setAdminActionLogs] = useState<AdminActionLogItem[]>([]);
  const [interventionsData, setInterventionsData] = useState<InterventionData[]>([]);
  const [facturesData, setFacturesData] = useState<FactureData[]>([]);
  const [suiviCarburantData, setSuiviCarburantData] = useState<SuiviCarburantData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    return storedDarkMode ? JSON.parse(storedDarkMode) : false;
  });
  const [deleting, setDeleting] = useState<number | null>(null);
  const [activeHistoryTab, setActiveHistoryTab] = useState<
    "admin_logs" | "factures" | "interventions" | "suivi_carburant"
  >("interventions"); // Set to interventions based on the screenshot
  const [selectedRecord, setSelectedRecord] = useState<InterventionData | FactureData | SuiviCarburantData | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const currentTheme = getThemeColors(darkMode);

  // Set the background color of the body and font family based on the theme
  useEffect(() => {
    document.body.style.backgroundColor = currentTheme.background;
    document.body.style.fontFamily = currentTheme.buttonFont;
    // Persist dark mode preference
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [currentTheme.background, currentTheme.buttonFont, darkMode]);


  const refreshToken = useCallback(async (): Promise<string | null> => {
    const refresh = localStorage.getItem("refresh_token");
    if (!refresh) {
      alert("No refresh token. Please log in.");
      navigate("/login");
      return null;
    }
    try {
      const response = await fetch("http://localhost:8000/api/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.access);
        return data.access;
      } else {
        alert("Token refresh failed: " + JSON.stringify(data));
        navigate("/login");
        return null;
      }
    } catch (error) {
      alert("Error refreshing token: " + error);
      navigate("/login");
      return null;
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedIsAdmin = localStorage.getItem("is_admin");
    setIsAdmin(storedIsAdmin === "true");

    if (!token) {
      setError("No token found. Please log in.");
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (location.pathname === "/admin") {
          const [usersRes, statsRes] = await Promise.all([
            fetch("http://localhost:8000/api/get_users/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch("http://localhost:8000/api/get_signup_stats/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

          if (!usersRes.ok || !statsRes.ok) {
            if (usersRes.status === 401 || statsRes.status === 401) {
              const newToken = await refreshToken();
              if (newToken) return fetchData();
            }
            throw new Error(`Failed to fetch dashboard data: ${usersRes.statusText || statsRes.statusText}`);
          }
          setUsers(await usersRes.json());
          setSignupData(await statsRes.json());
        } else if (location.pathname === "/users" || location.pathname === "/adduser" || location.pathname.startsWith("/edit-user/")) {
          const usersRes = await fetch("http://localhost:8000/api/get_users/", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
          if (!usersRes.ok) {
            if (usersRes.status === 401) {
              const newToken = await refreshToken();
              if (newToken) return fetchData();
            }
            throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
          }
          setUsers(await usersRes.json());
        } else if (location.pathname === "/adminhistory") {
          const [adminLogsRes, facturesRes, interventionsRes, suiviCarburantRes] = await Promise.all([
            fetch("http://localhost:8000/api/admin_history/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch("http://localhost:8000/api/get_factures/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch("http://localhost:8000/api/get_interventions/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
            fetch("http://localhost:8000/api/get_suivi_carburant/", {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }),
          ]);

          if (!adminLogsRes.ok || !facturesRes.ok || !interventionsRes.ok || !suiviCarburantRes.ok) {
            if (adminLogsRes.status === 401 || facturesRes.status === 401 || interventionsRes.status === 401 || suiviCarburantRes.status === 401) {
              const newToken = await refreshToken();
              if (newToken) return fetchData();
            }
            throw new Error(`Failed to fetch history data. Status: ${adminLogsRes.status || facturesRes.status || interventionsRes.status || suiviCarburantRes.status}`);
          }

          const adminLogsData = await adminLogsRes.json();
          const facturesDataRaw = await facturesRes.json();
          const interventionsDataRaw = await interventionsRes.json();
          const suiviCarburantDataRaw = await suiviCarburantRes.json();

          const processedFactures = facturesDataRaw.map((f: any) => ({
            ...f,
            montant_ht: parseFloat(f.montant_ht),
            tva: parseFloat(f.tva),
            montant_ttc: parseFloat(f.montant_ttc),
          }));

          const processedInterventions = interventionsDataRaw.map((i: any) => ({
            ...i,
            cout_prestation_ttc: parseFloat(i.cout_prestation_ttc),
            tva: parseFloat(i.tva),
          }));

          const processedSuiviCarburant = suiviCarburantDataRaw.map((s: any) => ({
            ...s,
            prix: parseFloat(s.prix),
          }));

          setAdminActionLogs(adminLogsData);
          setFacturesData(processedFactures);
          setInterventionsData(processedInterventions);
          setSuiviCarburantData(processedSuiviCarburant);
        }
      } catch (err) {
        console.error("Fetch error details:", err);
        setError((err as Error).message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    const fetchRecordDetail = async (type: string, id: string) => {
      setLoadingDetail(true);
      setErrorDetail(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setErrorDetail("No authentication token found. Please log in.");
          navigate("/login");
          return;
        }

        let url = "";
        switch (type) {
          case "facture":
            url = `http://localhost:8000/api/facture/detail/${id}/`; // Matches backend /api/facture/detail/<int:pk>/
            break;
          case "intervention":
            url = `http://localhost:8000/api/intervention/${id}/`; // Matches backend /api/intervention/<int:pk>/
            break;
          case "suivi_carburant":
            url = `http://localhost:8000/api/suivi_carburant/${id}/`; // Matches backend /api/suivi_carburant/<int:pk>/
            break;
          default:
            throw new Error("Unknown record type");
        }

        console.log("Fetching from:", url, "with token:", token);
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("Response status:", response.status);
        if (!response.ok) {
          if (response.status === 401) {
            const newToken = await refreshToken();
            if (newToken) return fetchRecordDetail(type, id);
          }
          const errorText = await response.text();
          console.log("Response error:", errorText);
          throw new Error(`Failed to fetch ${type} data: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched data:", data);
        setSelectedRecord(data);
      } catch (err) {
        setErrorDetail((err as Error).message || "Unknown error occurred");
      } finally {
        setLoadingDetail(false);
      }
    };

    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (type && id) {
      // Set active history tab based on type when in /operation route
      if (type === "facture") setActiveHistoryTab("factures");
      else if (type === "intervention") setActiveHistoryTab("interventions");
      else if (type === "suivi_carburant") setActiveHistoryTab("suivi_carburant");
      fetchRecordDetail(type, id);
    } else if (type && !id) {
      // For creating a new record
      if (type === "facture") setSelectedRecord({ facture_num: "", date: "", billing_company: "", user: null, ice: "", adresse: "", reference: "", point_attach: "", lieu_intervention: "", destination: "", perimetre: "", description: "", montant_ht: 0, tva: 0, montant_ttc: 0 });
      else if (type === "intervention") setSelectedRecord({ ref_dossier: "", assure: "", date_intervention: "", user: null, evenement: "", status: "", immatriculation: "", marque: "", lieu_intervention: "", destination: "", point_attache: "", cout_prestation_ttc: 0, tva: 0 });
      else if (type === "suivi_carburant") setSelectedRecord({ date: "", vehicule: "", prix: 0, service: "", pompiste: "", user: null });

      // Set active history tab for new record creation
      if (type === "facture") setActiveHistoryTab("factures");
      else if (type === "intervention") setActiveHistoryTab("interventions");
      else if (type === "suivi_carburant") setActiveHistoryTab("suivi_carburant");
    }


    fetchData();
  }, [navigate, location.pathname, location.search, refreshToken]); // Removed currentTheme from dependencies to prevent re-fetching on theme change

  const handleEditUser = (id: number) => navigate(`/edit-user/${id}`);
  const handleEditRecord = (id: number, type: "facture" | "intervention" | "suivi_carburant") => {
    navigate(`/operation?type=${type}&id=${id}`);
  };

  const handleDelete = async (id: number, type: "user" | "admin_log" | "facture" | "intervention" | "suivi_carburant") => {
    const confirmMessage = `Êtes-vous sûr de vouloir supprimer cet élément (ID: ${id}) de type ${type}?`;
    if (!window.confirm(confirmMessage)) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication token missing. Please log in.");
      navigate("/login");
      return;
    }

    setDeleting(id);
    try {
      let url = "";
      switch (type) {
        case "user":
          url = `http://localhost:8000/api/user/${id}/`;
          break;
        case "admin_log":
          url = `http://localhost:8000/api/admin_history/${id}/`;
          break;
        case "facture":
          url = `http://localhost:8000/api/facture/${id}/`;
          break;
        case "intervention":
          url = `http://localhost:8000/api/intervention/${id}/`;
          break;
        case "suivi_carburant":
          url = `http://localhost:8000/api/suivi_carburant/${id}/`;
          break;
        default:
          throw new Error("Unknown data type for deletion");
      }

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 204) {
        alert(`Élément (${type}) supprimé avec succès!`);
        if (type === "user") setUsers((prev) => prev.filter((item) => item.id !== id));
        else if (type === "admin_log") setAdminActionLogs((prev) => prev.filter((item) => item.id !== id));
        else if (type === "facture") setFacturesData((prev) => prev.filter((item) => item.id !== id));
        else if (type === "intervention") setInterventionsData((prev) => prev.filter((item) => item.id !== id));
        else if (type === "suivi_carburant") setSuiviCarburantData((prev) => prev.filter((item) => item.id !== id));
        setSelectedRecord(null); // Clear selected record if deleted
      } else if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) return handleDelete(id, type);
        else throw new Error("Authentification échouée ou session expirée.");
      } else {
        let errorMessage = `Échec de la suppression de ${type}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.detail || errorData.message || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            if (!errorText.toLowerCase().includes("<!doctype html>")) {
              errorMessage = errorText;
            }
          } catch (e2) {
            errorMessage = `Erreur ${response.status}: ${response.statusText}`;
          }
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Échec de la suppression: ${(error as Error).message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleCreateOrUpdateRecord = async () => {
    if (!selectedRecord) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication token missing. Please log in.");
      navigate("/login");
      return;
    }

    try {
      let url = "";
      let method = selectedRecord.id ? "PUT" : "POST";
      let type: "facture" | "intervention" | "suivi_carburant";

      if (isFacture(selectedRecord)) {
        type = "facture";
        url = `http://localhost:8000/api/facture/${selectedRecord.id ? selectedRecord.id + "/" : ""}`;
      } else if (isIntervention(selectedRecord)) {
        type = "intervention";
        url = `http://localhost:8000/api/intervention/${selectedRecord.id ? selectedRecord.id + "/" : ""}`;
      } else if (isSuiviCarburant(selectedRecord)) {
        type = "suivi_carburant";
        url = `http://localhost:8000/api/suivi_carburant/${selectedRecord.id ? selectedRecord.id + "/" : ""}`;
      } else {
        throw new Error("Unknown record type");
      }

      console.log(`Sending ${method} request to: ${url} with data:`, selectedRecord);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(selectedRecord),
      });

      if (response.ok) {
        alert(`Record ${method === "POST" ? "créé" : "mis à jour"} avec succès!`);
        navigate("/adminhistory"); // Navigate back to history after save
      } else if (response.status === 401) {
        const newToken = await refreshToken();
        if (newToken) return handleCreateOrUpdateRecord(); // Retry with new token
        else throw new Error("Authentification échouée ou session expirée.");
      } else {
        const errorData = await response.json();
        console.error("Backend error response:", errorData);
        throw new Error(errorData.error || errorData.detail || "Échec de l'opération");
      }
    } catch (error) {
      alert(`Échec de l'opération: ${(error as Error).message}`);
    }
  };


  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const activeUsersCount = users.filter((u) => u.active).length;
  const totalSignups = signupData.reduce((sum, item) => sum + item.signups, 0);

  // Dynamic Tailwind classes using currentTheme
  const mainContainerClasses = `bg-[${currentTheme.background}] text-[${currentTheme.text}]`;
  const cardClasses = `bg-[${currentTheme.cardBackground}] shadow-xl border border-[${currentTheme.cardBorder}] rounded-lg`;
  const sidebarWrapperClasses = `text-[${currentTheme.sidebarText}] bg-[${currentTheme.sidebarBackground}] transition-all duration-300 ease-in-out flex flex-col h-full shadow-2xl z-30 border-r border-[${currentTheme.cardBorder}]`;
  const sidebarBrandClasses = `py-4 px-4 flex items-center justify-center border-b border-[${currentTheme.cardBorder}]`;
  const navLinkClasses = `flex items-center py-3 px-5 hover:bg-[${currentTheme.sidebarHoverBg}] transition-colors duration-200 text-[15px] font-medium rounded-md`;
  const navLinkActiveClasses = `bg-[${currentTheme.sidebarActiveBackground}] text-[${currentTheme.sidebarActiveText}] font-semibold`;
  const headerClasses = `bg-[${currentTheme.headerBackground}] text-[${currentTheme.headerText}] py-3 px-6 shadow-md sticky top-0 z-20 flex justify-between items-center border-b border-[${currentTheme.cardBorder}]`;
  const buttonClasses = `font-semibold py-2 px-4 rounded-lg text-sm transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50`;
  const buttonPrimaryClasses = `${buttonClasses} bg-[${currentTheme.primary}] hover:bg-[${currentTheme.primaryDarker}] text-white focus:ring-[${currentTheme.primary}]`;
  const iconButtonClasses = `p-2 rounded-lg hover:bg-[${currentTheme.secondaryButtonHoverBg}] transition-colors`;
  const inputClasses = `p-3 rounded-md shadow-sm w-full
    bg-[${currentTheme.inputBackground}]
    border border-[${currentTheme.inputBorder}]
    text-[${currentTheme.text}]
    placeholder-[${currentTheme.inputPlaceholder}]
    focus:ring-2 focus:ring-[${currentTheme.primary}] focus:border-[${currentTheme.primary}]`;


  const navItems = [
    { name: "Dashboard", icon: FaHome, path: "/admin" },
    { name: "Utilisateurs", icon: FaUsers, path: "/users" },
    { name: "Historique", icon: FaHistory, path: "/adminhistory" },
    { name: "Ajouter Utilisateur", icon: FaUserPlus, path: "/adduser" },
  ];
  const pageTitles = {
    "/admin": "Dashboard",
    "/users": "Gestion des Utilisateurs",
    "/adminhistory": "Gestion des Données (Historique)",
    "/adduser": "Ajouter Utilisateur",
    "/operation": "Nouvelle Intervention", // Changed based on screenshot
  };
  const currentPageTitle = pageTitles[location.pathname] || "Admin Panel";

  if (loading) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${mainContainerClasses}`}>
        <div className="text-center">
          <div
            className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[${currentTheme.primary}] mx-auto mb-3`}
          ></div>
          <p className={`text-[${currentTheme.text}] text-lg`}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-screen w-screen flex items-center justify-center ${mainContainerClasses} p-4`}>
        <div className={`${cardClasses} p-8 rounded-lg max-w-md text-center`}>
          <FaInfoCircle className={`mx-auto text-[${currentTheme.alert}] text-4xl mb-4`} />
          <h2 className={`text-xl font-semibold mb-2 text-[${currentTheme.text}]`}>Erreur de chargement</h2>
          <p className={`text-[${currentTheme.textMuted}] mb-5 text-sm`}>{error}</p>
          <button
            onClick={() => navigate(error.includes("token") ? "/login" : location.pathname)}
            className={`${buttonPrimaryClasses} bg-[${currentTheme.alert}] hover:bg-[${currentTheme.alert}D0]`}
          >
            {error.includes("token") ? "Se connecter" : "Réessayer"}
          </button>
        </div>
      </div>
    );
  }

  const mainDivDynamicClasses = `h-screen w-screen flex overflow-hidden ${mainContainerClasses}`;

  return (
    <div className={mainDivDynamicClasses}>
      {/* Sidebar */}
      <aside className={`${sidebarWrapperClasses} ${sidebarOpen ? "w-64" : "w-[72px]"}`}>
        <div className={sidebarBrandClasses}>
          <img
            src="/logo.png"
            alt="Logo"
            className={`h-9 transition-all duration-300 ${sidebarOpen ? "mr-2 w-auto" : "mx-auto w-9"}`}
            onError={(e) => {
              const getCleanHex = (colorString: string) => {
                const hexMatch = colorString.match(/#([0-9A-Fa-f]{6})/);
                return hexMatch ? hexMatch[1] : "6B46C1";
              };
              const placeholderBg = getCleanHex(currentTheme.primary);
              const placeholderText = getCleanHex(currentTheme.sidebarText);
              (e.target as HTMLImageElement).src = `https://placehold.co/120x40/${placeholderBg}/${placeholderText}?text=LOGO&font=montserrat`;
            }}
          />
          {sidebarOpen && (
            <span
              className="font-bold text-lg"
              style={{ fontFamily: currentTheme.buttonFont, color: currentTheme.primary }}
            >
              ADMIN
            </span>
          )}
        </div>
        <nav className="flex-1 mt-6 space-y-2 px-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === "/admin" && location.pathname.startsWith("/admin"));
            return (
              <button
                key={item.name}
                className={`w-full ${navLinkClasses} ${isActive ? navLinkActiveClasses : `text-[${currentTheme.sidebarText}] hover:text-[${currentTheme.sidebarActiveText}]`}`}
                onClick={() => navigate(item.path)}
                title={item.name}
              >
                <item.icon className={`text-xl ${sidebarOpen ? "mr-3" : "mx-auto"}`} />
                {sidebarOpen && <span className="truncate">{item.name === "Historique" ? "Historique" : item.name}</span>}
              </button>
            );
          })}
        </nav>
        <div className={`px-3 py-4 border-t border-[${currentTheme.cardBorder}]`}>
          <button
            onClick={toggleDarkMode}
            className={`w-full ${navLinkClasses} justify-center text-sm`}
          >
            <FaCog className={`text-base ${sidebarOpen ? "mr-2" : "mx-auto"}`} />
            {sidebarOpen && (darkMode ? "Mode Clair" : "Mode Sombre")}
          </button>
        </div>
        <div className={`px-3 py-3 border-t border-[${currentTheme.cardBorder}]`}>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("userRole");
              localStorage.removeItem("is_admin");
              navigate("/logout");
            }}
            title="Déconnexion"
            className={`w-full ${navLinkClasses} justify-center text-sm`}
          >
            <FaSignOutAlt className={`text-base ${sidebarOpen ? "mr-2" : "mx-auto"}`} />
            {sidebarOpen && <span className="truncate">Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-hidden">
        {/* Header */}
        <header className={headerClasses}>
          <div className="flex items-center">
            <button
              onClick={toggleSidebar}
              className={`mr-3 ${iconButtonClasses} text-[${currentTheme.headerText}]`}
            >
              <FaBars className="h-5 w-5" />
            </button>
            <h1 className={`text-xl font-bold text-[${currentTheme.headerText}]`}>{currentPageTitle}</h1>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button className={`${iconButtonClasses} text-[${currentTheme.iconDefault}] hidden sm:inline-flex`}>
              <FaSearch className="h-4 w-4" />
            </button>
            <button className={`${iconButtonClasses} text-[${currentTheme.iconDefault}] relative`}>
              <FaBell className="h-5 w-5" />
              <span className={`absolute top-0 right-0.5 h-2 w-2 rounded-full bg-[${currentTheme.accent}] border border-white`}></span>
            </button>
            {(location.pathname === "/users" || location.pathname === "/adduser") && (
              <button
                onClick={() => navigate("/adduser")}
                className={`${buttonPrimaryClasses} !py-2 !px-4 sm:!px-5`}
              >
                <FaUserPlus className="mr-0 sm:mr-1.5 h-4 w-4" />
                <span className="hidden sm:inline">Ajouter Utilisateur</span>
              </button>
            )}
            {location.pathname === "/adminhistory" && (
              <>
                {activeHistoryTab === "factures" && (
                  <button
                    onClick={() => navigate("/operation?type=facture")}
                    className={`${buttonPrimaryClasses} !py-2 !px-4 sm:!px-5`}
                  >
                    <FaFileInvoice className="mr-0 sm:mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter Facture</span>
                  </button>
                )}
                {activeHistoryTab === "interventions" && (
                  <button
                    onClick={() => navigate("/operation?type=intervention")}
                    className={`${buttonPrimaryClasses} !py-2 !px-4 sm:!px-5`}
                  >
                    <FaClipboardList className="mr-0 sm:mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter Intervention</span>
                  </button>
                )}
                {activeHistoryTab === "suivi_carburant" && (
                  <button
                    onClick={() => navigate("/operation?type=suivi_carburant")}
                    className={`${buttonPrimaryClasses} !py-2 !px-4 sm:!px-5`}
                  >
                    <FaTruck className="mr-0 sm:mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter Carburant</span>
                  </button>
                )}
                {activeHistoryTab === "admin_logs" && (
                  <button
                    onClick={() =>
                      alert("L'ajout de logs admin est automatique via les actions. Ceci est juste une info.")
                    }
                    className={`${buttonPrimaryClasses} !py-2 !px-4 sm:!px-5`}
                  >
                    <FaBell className="mr-0 sm:mr-1.5 h-4 w-4" />
                    <span className="hidden sm:inline">Ajouter Log (Info)</span>
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-8">
          {location.pathname === "/admin" && (
            <>
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
                {[
                  { title: "Utilisateurs Totaux", value: users.length, icon: FaUsers, themeColor: currentTheme.primary },
                  { title: "Utilisateurs Actifs", value: activeUsersCount, icon: FaUsers, themeColor: currentTheme.success },
                  { title: "Total Inscriptions", value: totalSignups, icon: FaChartLine, themeColor: currentTheme.info },
                  { title: "Alertes (Exemple)", value: 3, icon: FaInfoCircle, themeColor: currentTheme.warning },
                ].map((stat) => (
                  <div key={stat.title} className={`${cardClasses} p-6`}>
                    <div className="flex justify-between items-center">
                      <div className={`p-4 rounded-lg text-white bg-[${stat.themeColor}] shadow-lg`}>
                        <stat.icon className="text-2xl" />
                      </div>
                      <div className="text-right ml-4">
                        <p className={`text-sm text-[${currentTheme.textMuted}] uppercase font-medium`}>{stat.title}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-8">
                <div className={`${cardClasses}`}>
                  <div className={`px-6 py-5 rounded-t-lg text-white bg-[${currentTheme.primary}]`}>
                    <h2 className={`text-lg font-semibold`}>Statistiques d'inscription</h2>
                    <p className={`text-sm opacity-90`}>Performance des 6 derniers mois</p>
                  </div>
                  <div className="p-5">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={signupData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }}>
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={currentTheme.accent} stopOpacity={0.6} />
                            <stop offset="95%" stopColor={currentTheme.accent} stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartGrid} vertical={false} />
                        <XAxis dataKey="month" stroke={currentTheme.chartAxis} fontSize={12} tickLine={false} axisLine={{ stroke: currentTheme.chartGrid }} dy={5} />
                        <YAxis stroke={currentTheme.chartAxis} fontSize={12} tickLine={false} axisLine={false} dx={-5} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: currentTheme.tooltipBg,
                            borderColor: currentTheme.tooltipBorder,
                            color: currentTheme.text,
                            borderRadius: "0.5rem",
                            boxShadow: "0 6px 15px rgba(0,0,0,0.15)",
                            padding: "10px 14px",
                            fontSize: "13px",
                            fontFamily: currentTheme.buttonFont,
                          }}
                          itemStyle={{ color: currentTheme.text }}
                          cursor={{ fill: `${currentTheme.accent}1A` }}
                        />
                        <Area
                          type="monotone"
                          dataKey="signups"
                          stroke={currentTheme.accent}
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#chartGradient)"
                          name="Inscriptions"
                          dot={{ stroke: currentTheme.accent, strokeWidth: 2, r: 4, fill: currentTheme.cardBackground }}
                          activeDot={{ r: 7, stroke: currentTheme.cardBackground, strokeWidth: 2.5, fill: currentTheme.accent }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </>
          )}

          {(location.pathname === "/users" || location.pathname === "/admin") && (
            <section className={`${cardClasses} mb-8`}>
              <div className={`px-6 py-5 border-b border-[${currentTheme.cardBorder}]`}>
                <h2 className={`text-lg font-semibold text-[${currentTheme.primary}]`}>Gestion des utilisateurs</h2>
                <p className={`text-sm text-[${currentTheme.textMuted}]`}>Détails des utilisateurs enregistrés</p>
              </div>
              <div className="overflow-x-auto p-3 sm:p-5">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead>
                    <tr className={`border-b border-[${currentTheme.cardBorder}]`}>
                      {["Nom d'utilisateur", "Email", "Statut", "Actions"].map((header) => (
                        <th
                          key={header}
                          className={`py-4 px-4 font-bold text-xs text-[${currentTheme.textMuted}] uppercase tracking-wider ${header === "Actions" ? "text-right" : ""}`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user) => (
                        <tr
                          key={user.id}
                          className={`border-b border-[${currentTheme.cardBorder}]/70 hover:bg-[${currentTheme.sidebarActiveBackground}]/[0.3]`}
                        >
                          <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{user.username}</td>
                          <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{user.email}</td>
                          <td className={`py-3.5 px-4`}>
                            <span
                              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                                user.active
                                  ? `bg-[${currentTheme.success}]/20 text-[${currentTheme.success}]`
                                  : `bg-[${currentTheme.alert}]/20 text-[${currentTheme.alert}]`
                              }`}
                            >
                              {user.active ? "Actif" : "Inactif"}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleEditUser(user.id)}
                              className={`${iconButtonClasses} text-[${currentTheme.info}]`}
                              title="Modifier"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, "user")}
                              disabled={deleting === user.id}
                              className={`${iconButtonClasses} text-[${currentTheme.alert}] ${deleting === user.id ? "opacity-50 cursor-not-allowed" : ""}`}
                              title="Supprimer"
                            >
                              {deleting === user.id ? (
                                <svg
                                  className={`animate-spin h-4 w-4 text-[${currentTheme.alert}]`}
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    className="opacity-25"
                                  ></circle>
                                  <path
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    className="opacity-75"
                                    fill="currentColor"
                                  ></path>
                                </svg>
                              ) : (
                                <FaTrash className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className={`text-center py-10 text-[${currentTheme.textMuted}]`}>
                          <FaUsers className="mx-auto text-4xl mb-3" />
                          <p className="text-sm">Aucun utilisateur à afficher.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {location.pathname === "/adminhistory" && (
            <section className={`${cardClasses} mb-8`}>
              <div className={`px-6 py-5 border-b border-[${currentTheme.cardBorder}]`}>
                <h2 className={`text-lg font-semibold text-[${currentTheme.primary}]`}>Gestion des Données (Historique)</h2>
                <p className={`text-sm text-[${currentTheme.textMuted}]`}>Visualisez et gérez les données opérationnelles et les actions administratives.</p>
              </div>

              <div className={`flex flex-wrap gap-2 p-4 border-b border-[${currentTheme.cardBorder}]`}>
                <button
                  className={`${buttonPrimaryClasses} !py-2 !px-4 ${activeHistoryTab === "factures" ? "" : "opacity-70"} flex items-center`}
                  onClick={() => setActiveHistoryTab("factures")}
                >
                  <FaFileInvoice className="mr-2" /> Factures
                </button>
                <button
                  className={`${buttonPrimaryClasses} !py-2 !px-4 ${activeHistoryTab === "interventions" ? "" : "opacity-70"} flex items-center`}
                  onClick={() => setActiveHistoryTab("interventions")}
                >
                  <FaClipboardList className="mr-2" /> Interventions
                </button>
                <button
                  className={`${buttonPrimaryClasses} !py-2 !px-4 ${activeHistoryTab === "suivi_carburant" ? "" : "opacity-70"} flex items-center`}
                  onClick={() => setActiveHistoryTab("suivi_carburant")}
                >
                  <FaTruck className="mr-2" /> Carburant
                </button>
                <button
                  className={`${buttonPrimaryClasses} !py-2 !px-4 ${activeHistoryTab === "admin_logs" ? "" : "opacity-70"} flex items-center`}
                  onClick={() => setActiveHistoryTab("admin_logs")}
                >
                  <FaHistory className="mr-2" /> Logs Admin
                </button>
              </div>

              <div className="overflow-x-auto p-3 sm:p-5">
                {activeHistoryTab === "factures" && (
                  <>
                    <h3 className={`text-md font-semibold mb-3 text-[${currentTheme.text}]`}>Liste des Factures</h3>
                    <table className="w-full min-w-[1000px] text-left text-sm">
                      <thead>
                        <tr className={`border-b border-[${currentTheme.cardBorder}]`}>
                          {["ID", "Numéro", "Date", "Société", "ICE", "Montant TTC", "Utilisateur", "Actions"].map((header) => (
                            <th
                              key={header}
                              className={`py-4 px-4 font-bold text-xs text-[${currentTheme.textMuted}] uppercase tracking-wider ${header === "Actions" ? "text-right" : ""}`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {facturesData.length > 0 ? (
                          facturesData.map((facture) => (
                            <tr
                              key={facture.id}
                              className={`border-b border-[${currentTheme.cardBorder}]/70 hover:bg-[${currentTheme.sidebarActiveBackground}]/[0.3]`}
                            >
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{facture.id}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{facture.facture_num}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{new Date(facture.date).toLocaleDateString("fr-FR")}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{facture.billing_company}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{facture.ice}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{facture.montant_ttc.toFixed(2)} DH</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{facture.user?.username || "N/A"}</td>
                              <td className="py-2 px-4 text-right space-x-2">
                                <button
                                  onClick={() => handleEditRecord(facture.id, "facture")}
                                  className={`${iconButtonClasses} text-[${currentTheme.info}]`}
                                  title="Modifier"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(facture.id, "facture")}
                                  disabled={deleting === facture.id}
                                  className={`${iconButtonClasses} text-[${currentTheme.alert}] ${deleting === facture.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title="Supprimer"
                                >
                                  {deleting === facture.id ? (
                                    <svg
                                      className={`animate-spin h-4 w-4 text-[${currentTheme.alert}]`}
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="opacity-25"
                                      ></circle>
                                      <path
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        className="opacity-75"
                                        fill="currentColor"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className={`text-center py-10 text-[${currentTheme.textMuted}]`}>Aucune facture à afficher.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}

                {activeHistoryTab === "interventions" && (
                  <>
                    <h3 className={`text-md font-semibold mb-3 text-[${currentTheme.text}]`}>Liste des Interventions</h3>
                    <table className="w-full min-w-[1000px] text-left text-sm">
                      <thead>
                        <tr className={`border-b border-[${currentTheme.cardBorder}]`}>
                          {["ID", "Réf. Dossier", "Assuré", "Date", "Événement", "Statut", "Coût TTC", "Actions"].map((header) => (
                            <th
                              key={header}
                              className={`py-4 px-4 font-bold text-xs text-[${currentTheme.textMuted}] uppercase tracking-wider ${header === "Actions" ? "text-right" : ""}`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {interventionsData.length > 0 ? (
                          interventionsData.map((intervention) => (
                            <tr
                              key={intervention.id}
                              className={`border-b border-[${currentTheme.cardBorder}]/70 hover:bg-[${currentTheme.sidebarActiveBackground}]/[0.3]`}
                            >
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{intervention.id}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{intervention.ref_dossier}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{intervention.assure}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{new Date(intervention.date_intervention).toLocaleDateString("fr-FR")}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{intervention.evenement}</td>
                              <td className={`py-3.5 px-4`}>
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                                    intervention.status === "payé"
                                      ? `bg-[${currentTheme.success}]/20 text-[${currentTheme.success}]`
                                      : intervention.status === "impayé"
                                      ? `bg-[${currentTheme.alert}]/20 text-[${currentTheme.alert}]`
                                      : `bg-[${currentTheme.info}]/20 text-[${currentTheme.info}]`
                                  }`}
                                >
                                  {intervention.status}
                                </span>
                              </td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{intervention.cout_prestation_ttc.toFixed(2)} DH</td>
                              <td className="py-2 px-4 text-right space-x-2">
                                <button
                                  onClick={() => handleEditRecord(intervention.id, "intervention")}
                                  className={`${iconButtonClasses} text-[${currentTheme.info}]`}
                                  title="Modifier"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(intervention.id, "intervention")}
                                  disabled={deleting === intervention.id}
                                  className={`${iconButtonClasses} text-[${currentTheme.alert}] ${deleting === intervention.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title="Supprimer"
                                >
                                  {deleting === intervention.id ? (
                                    <svg
                                      className={`animate-spin h-4 w-4 text-[${currentTheme.alert}]`}
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="opacity-25"
                                      ></circle>
                                      <path
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        className="opacity-75"
                                        fill="currentColor"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className={`text-center py-10 text-[${currentTheme.textMuted}]`}>Aucune intervention à afficher.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}

                {activeHistoryTab === "suivi_carburant" && (
                  <>
                    <h3 className={`text-md font-semibold mb-3 text-[${currentTheme.text}]`}>Liste des Suivis Carburant</h3>
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead>
                        <tr className={`border-b border-[${currentTheme.cardBorder}]`}>
                          {["ID", "Véhicule", "Date", "Prix", "Service", "Pompiste", "Actions"].map((header) => (
                            <th
                              key={header}
                              className={`py-4 px-4 font-bold text-xs text-[${currentTheme.textMuted}] uppercase tracking-wider ${header === "Actions" ? "text-right" : ""}`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {suiviCarburantData.length > 0 ? (
                          suiviCarburantData.map((suivi) => (
                            <tr
                              key={suivi.id}
                              className={`border-b border-[${currentTheme.cardBorder}]/70 hover:bg-[${currentTheme.sidebarActiveBackground}]/[0.3]`}
                            >
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{suivi.id}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{suivi.vehicule}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{new Date(suivi.date).toLocaleDateString("fr-FR")}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{suivi.prix.toFixed(2)} DH</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{suivi.service}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{suivi.pompiste || "N/A"}</td>
                              <td className="py-2 px-4 text-right space-x-2">
                                <button
                                  onClick={() => handleEditRecord(suivi.id, "suivi_carburant")}
                                  className={`${iconButtonClasses} text-[${currentTheme.info}]`}
                                  title="Modifier"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(suivi.id, "suivi_carburant")}
                                  disabled={deleting === suivi.id}
                                  className={`${iconButtonClasses} text-[${currentTheme.alert}] ${deleting === suivi.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title="Supprimer"
                                >
                                  {deleting === suivi.id ? (
                                    <svg
                                      className={`animate-spin h-4 w-4 text-[${currentTheme.alert}]`}
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="opacity-25"
                                      ></circle>
                                      <path
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        className="opacity-75"
                                        fill="currentColor"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className={`text-center py-10 text-[${currentTheme.textMuted}]`}>Aucun suivi carburant à afficher.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}

                {activeHistoryTab === "admin_logs" && (
                  <>
                    <h3 className={`text-md font-semibold mb-3 text-[${currentTheme.text}]`}>Liste des Logs Administratives</h3>
                    <table className="w-full min-w-[900px] text-left text-sm">
                      <thead>
                        <tr className={`border-b border-[${currentTheme.cardBorder}]`}>
                          {["ID", "Date/Heure", "Admin", "Action", "Détails", "Sévérité", "Actions"].map((header) => (
                            <th
                              key={header}
                              className={`py-4 px-4 font-bold text-xs text-[${currentTheme.textMuted}] uppercase tracking-wider ${header === "Actions" ? "text-right" : ""}`}
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {adminActionLogs.length > 0 ? (
                          adminActionLogs.map((log) => (
                            <tr
                              key={log.id}
                              className={`border-b border-[${currentTheme.cardBorder}]/70 hover:bg-[${currentTheme.sidebarActiveBackground}]/[0.3]`}
                            >
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{log.id}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}]`}>{new Date(log.timestamp).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{log.admin_username}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.text}]`}>{log.action}</td>
                              <td className={`py-3.5 px-4 text-[${currentTheme.textMuted}] max-w-[300px] truncate`}>{log.details || "N/A"}</td>
                              <td className={`py-3.5 px-4`}>
                                <span
                                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${
                                    log.severity === "Critical"
                                      ? `bg-[${currentTheme.alert}]/20 text-[${currentTheme.alert}]`
                                      : log.severity === "High"
                                      ? `bg-[${currentTheme.warning}]/20 text-[${currentTheme.warning}]`
                                      : log.severity === "Medium"
                                      ? `bg-[${currentTheme.info}]/20 text-[${currentTheme.info}]`
                                      : `bg-[${currentTheme.success}]/20 text-[${currentTheme.success}]`
                                  }`}
                                >
                                  {log.severity}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-right space-x-2">
                                <button
                                  onClick={() => alert(`Modifier le log ID: ${log.id}`)}
                                  className={`${iconButtonClasses} text-[${currentTheme.info}] opacity-50 cursor-not-allowed`}
                                  title="Logs non modifiables"
                                >
                                  <FaEdit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(log.id, "admin_log")}
                                  disabled={deleting === log.id}
                                  className={`${iconButtonClasses} text-[${currentTheme.alert}] ${deleting === log.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                  title="Supprimer"
                                >
                                  {deleting === log.id ? (
                                    <svg
                                      className={`animate-spin h-4 w-4 text-[${currentTheme.alert}]`}
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                        className="opacity-25"
                                      ></circle>
                                      <path
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        className="opacity-75"
                                        fill="currentColor"
                                      ></path>
                                    </svg>
                                  ) : (
                                    <FaTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className={`text-center py-10 text-[${currentTheme.textMuted}]`}>Aucune action administrative à afficher.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </>
                )}
              </div>
            </section>
          )}

          {location.pathname === "/adduser" && (
            <section className={`${cardClasses} mb-8 p-6`}>
              <h2 className={`text-lg font-semibold text-[${currentTheme.primary}] mb-4`}>Ajouter un Nouvel Utilisateur</h2>
              <p className={`text-sm text-[${currentTheme.textMuted}] mb-6`}>Remplissez le formulaire ci-dessous pour créer un nouveau compte utilisateur.</p>
              <div className="flex flex-col space-y-4">
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  className={inputClasses}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className={inputClasses}
                />
                <input
                  type="password"
                  placeholder="Mot de passe"
                  className={inputClasses}
                />
                <button className={buttonPrimaryClasses + " mt-4"}>Créer Utilisateur</button>
              </div>
            </section>
          )}

          {/* Operation Form (Intervention/Facture/Suivi Carburant) */}
          {location.pathname === "/operation" && (
            <section className={`${cardClasses} mb-8 p-6`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className={`text-2xl font-bold text-[${currentTheme.primary}]`}>
                  {selectedRecord?.id ? `Modifier ${getRecordType(selectedRecord)}` : "Nouvelle Intervention"}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigate(-1)} // Go back
                    className={`${buttonClasses} bg-[${currentTheme.secondaryButtonBg}] text-[${currentTheme.secondaryButtonText}] hover:bg-[${currentTheme.secondaryButtonHoverBg}]`}
                  >
                    Retour
                  </button>
                  <button
                    onClick={() => handleCreateOrUpdateRecord()}
                    className={buttonPrimaryClasses}
                    disabled={loadingDetail} // Disable save while loading detail
                  >
                    Enregistrer
                  </button>
                </div>
              </div>

              {loadingDetail && (
                <div className="text-center py-10">
                  <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[${currentTheme.primary}] mx-auto mb-3`}></div>
                  <p className={`text-[${currentTheme.text}] text-lg`}>Chargement des détails...</p>
                </div>
              )}
              {errorDetail && (
                <div className={`text-center text-[${currentTheme.alert}] mb-4 p-4 rounded-md bg-[${currentTheme.alert}]/10 border border-[${currentTheme.alert}]`}>
                  {errorDetail}
                </div>
              )}

              {selectedRecord && (
                <div className="space-y-6">
                  {isIntervention(selectedRecord) && (
                    <>
                      <h3 className={`text-xl font-semibold mb-4 text-[${currentTheme.text}] flex items-center`}>
                        <FaInfoCircle className="mr-2 text-lg text-[${currentTheme.primary}]" /> Informations générales
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="date_intervention" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Date d'intervention</label>
                          <div className="relative">
                            <input
                              id="date_intervention"
                              type="date"
                              value={selectedRecord.date_intervention || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, date_intervention: e.target.value })}
                              className={inputClasses}
                            />
                            <FaCalendarAlt className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="assure" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Assuré</label>
                          <div className="relative">
                            <input
                              id="assure"
                              type="text"
                              value={selectedRecord.assure || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, assure: e.target.value })}
                              placeholder="Entrez assuré"
                              className={inputClasses}
                            />
                            <FaUserPlus className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="ref_dossier" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Référence Dossier</label>
                          <div className="relative">
                            <input
                              id="ref_dossier"
                              type="text"
                              value={selectedRecord.ref_dossier || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, ref_dossier: e.target.value })}
                              placeholder="Entrez référence dossier"
                              className={inputClasses}
                            />
                            <FaHashtag className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                      </div>

                      <h3 className={`text-xl font-semibold mt-8 mb-4 text-[${currentTheme.text}] flex items-center`}>
                        <FaCar className="mr-2 text-lg text-[${currentTheme.primary}]" /> Client et véhicule
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="immatriculation" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Immatriculation</label>
                          <div className="relative">
                            <input
                              id="immatriculation"
                              type="text"
                              value={selectedRecord.immatriculation || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, immatriculation: e.target.value })}
                              placeholder="Entrez immatriculation"
                              className={inputClasses}
                            />
                            <FaCar className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="marque" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Marque</label>
                          <div className="relative">
                            <input
                              id="marque"
                              type="text"
                              value={selectedRecord.marque || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, marque: e.target.value })}
                              placeholder="Entrez marque"
                              className={inputClasses}
                            />
                            <FaTags className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                      </div>

                      <h3 className={`text-xl font-semibold mt-8 mb-4 text-[${currentTheme.text}] flex items-center`}>
                        <FaMapMarkerAlt className="mr-2 text-lg text-[${currentTheme.primary}]" /> Localisation et Intervention
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="point_attache" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Point d'attache</label>
                          <div className="relative">
                            <input
                              id="point_attache"
                              type="text"
                              value={selectedRecord.point_attache || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, point_attache: e.target.value })}
                              placeholder="Point d'attache"
                              className={inputClasses}
                            />
                            <FaMapMarkerAlt className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="lieu_intervention" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Lieu d'intervention</label>
                          <div className="relative">
                            <input
                              id="lieu_intervention"
                              type="text"
                              value={selectedRecord.lieu_intervention || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, lieu_intervention: e.target.value })}
                              placeholder="Lieu d'intervention"
                              className={inputClasses}
                            />
                            <FaMapMarkerAlt className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="destination" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Destination</label>
                          <div className="relative">
                            <input
                              id="destination"
                              type="text"
                              value={selectedRecord.destination || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, destination: e.target.value })}
                              placeholder="Destination"
                              className={inputClasses}
                            />
                            <FaRoad className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="status" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Statut</label>
                          <div className="relative">
                            <select
                              id="status"
                              value={selectedRecord.status || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, status: e.target.value })}
                              className={inputClasses}
                            >
                              <option value="">Sélectionnez un statut</option>
                              <option value="En cours">En cours</option>
                              <option value="Terminé">Terminé</option>
                              <option value="Annulé">Annulé</option>
                              <option value="payé">payé</option> {/* Added based on your previous code */}
                              <option value="impayé">impayé</option> {/* Added based on your previous code */}
                            </select>
                            <FaSyncAlt className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="evenement" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Événement</label>
                          <div className="relative">
                            <input
                              id="evenement"
                              type="text"
                              value={selectedRecord.evenement || ""}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, evenement: e.target.value })}
                              placeholder="Type d'événement"
                              className={inputClasses}
                            />
                            <FaTags className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}]`} />
                          </div>
                        </div>
                      </div>

                      <h3 className={`text-xl font-semibold mt-8 mb-4 text-[${currentTheme.text}] flex items-center`}>
                        <FaMoneyBillWave className="mr-2 text-lg text-[${currentTheme.primary}]" /> Informations financières
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="cout_prestation_ttc" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Coût Prestation TTC</label>
                          <div className="relative">
                            <input
                              id="cout_prestation_ttc"
                              type="number"
                              step="0.01"
                              value={selectedRecord.cout_prestation_ttc || 0}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, cout_prestation_ttc: parseFloat(e.target.value) || 0 })}
                              placeholder="Coût TTC"
                              className={inputClasses}
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}] text-sm`}>DH</span>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="tva" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>TVA (%)</label>
                          <div className="relative">
                            <input
                              id="tva"
                              type="number"
                              step="0.01"
                              value={selectedRecord.tva || 0}
                              onChange={(e) => setSelectedRecord({ ...selectedRecord, tva: parseFloat(e.target.value) || 0 })}
                              placeholder="TVA"
                              className={inputClasses}
                            />
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[${currentTheme.iconDefault}] text-sm`}>%</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {isFacture(selectedRecord) && (
                    <>
                      <h3 className={`text-xl font-semibold mb-4 text-[${currentTheme.text}] flex items-center`}>
                        <FaInfoCircle className="mr-2 text-lg text-[${currentTheme.primary}]" /> Informations de facture
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="facture_num" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Numéro de facture</label>
                          <input
                            id="facture_num"
                            type="text"
                            value={selectedRecord.facture_num || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, facture_num: e.target.value })}
                            placeholder="Numéro de facture"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="date_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Date</label>
                          <input
                            id="date_facture"
                            type="date"
                            value={selectedRecord.date || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, date: e.target.value })}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="billing_company" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Société de facturation</label>
                          <input
                            id="billing_company"
                            type="text"
                            value={selectedRecord.billing_company || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, billing_company: e.target.value })}
                            placeholder="Société"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="ice" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>ICE</label>
                          <input
                            id="ice"
                            type="text"
                            value={selectedRecord.ice || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, ice: e.target.value })}
                            placeholder="ICE"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="adresse" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Adresse</label>
                          <input
                            id="adresse"
                            type="text"
                            value={selectedRecord.adresse || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, adresse: e.target.value })}
                            placeholder="Adresse"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="reference_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Référence</label>
                          <input
                            id="reference_facture"
                            type="text"
                            value={selectedRecord.reference || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, reference: e.target.value })}
                            placeholder="Référence"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="point_attach_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Point d'attache</label>
                          <input
                            id="point_attach_facture"
                            type="text"
                            value={selectedRecord.point_attach || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, point_attach: e.target.value })}
                            placeholder="Point d'attache"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="lieu_intervention_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Lieu d'intervention</label>
                          <input
                            id="lieu_intervention_facture"
                            type="text"
                            value={selectedRecord.lieu_intervention || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, lieu_intervention: e.target.value })}
                            placeholder="Lieu d'intervention"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="destination_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Destination</label>
                          <input
                            id="destination_facture"
                            type="text"
                            value={selectedRecord.destination || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, destination: e.target.value })}
                            placeholder="Destination"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="perimetre" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Périmètre</label>
                          <input
                            id="perimetre"
                            type="text"
                            value={selectedRecord.perimetre || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, perimetre: e.target.value })}
                            placeholder="Périmètre"
                            className={inputClasses}
                          />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label htmlFor="description" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Description</label>
                          <textarea
                            id="description"
                            value={selectedRecord.description || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, description: e.target.value })}
                            placeholder="Description"
                            rows={3}
                            className={`${inputClasses} resize-y`}
                          ></textarea>
                        </div>
                        <div>
                          <label htmlFor="montant_ht" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Montant HT</label>
                          <input
                            id="montant_ht"
                            type="number"
                            step="0.01"
                            value={selectedRecord.montant_ht || 0}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, montant_ht: parseFloat(e.target.value) || 0 })}
                            placeholder="Montant HT"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="tva_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>TVA (%)</label>
                          <input
                            id="tva_facture"
                            type="number"
                            step="0.01"
                            value={selectedRecord.tva || 0}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, tva: parseFloat(e.target.value) || 0 })}
                            placeholder="TVA"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="montant_ttc_facture" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Montant TTC</label>
                          <input
                            id="montant_ttc_facture"
                            type="number"
                            step="0.01"
                            value={selectedRecord.montant_ttc || 0}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, montant_ttc: parseFloat(e.target.value) || 0 })}
                            placeholder="Montant TTC"
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {isSuiviCarburant(selectedRecord) && (
                    <>
                      <h3 className={`text-xl font-semibold mb-4 text-[${currentTheme.text}] flex items-center`}>
                        <FaTruck className="mr-2 text-lg text-[${currentTheme.primary}]" /> Détails de Suivi Carburant
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="date_suivi_carburant" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Date</label>
                          <input
                            id="date_suivi_carburant"
                            type="date"
                            value={selectedRecord.date || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, date: e.target.value })}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="vehicule_suivi_carburant" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Véhicule</label>
                          <input
                            id="vehicule_suivi_carburant"
                            type="text"
                            value={selectedRecord.vehicule || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, vehicule: e.target.value })}
                            placeholder="Véhicule"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="prix_suivi_carburant" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Prix</label>
                          <input
                            id="prix_suivi_carburant"
                            type="number"
                            step="0.01"
                            value={selectedRecord.prix || 0}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, prix: parseFloat(e.target.value) || 0 })}
                            placeholder="Prix"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="service_suivi_carburant" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Service</label>
                          <input
                            id="service_suivi_carburant"
                            type="text"
                            value={selectedRecord.service || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, service: e.target.value })}
                            placeholder="Service"
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label htmlFor="pompiste_suivi_carburant" className={`block text-sm font-medium text-[${currentTheme.textMuted}] mb-1`}>Pompiste</label>
                          <input
                            id="pompiste_suivi_carburant"
                            type="text"
                            value={selectedRecord.pompiste || ""}
                            onChange={(e) => setSelectedRecord({ ...selectedRecord, pompiste: e.target.value })}
                            placeholder="Pompiste"
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          <footer className={`text-center py-6 mt-8 text-xs text-[${currentTheme.textMuted}] border-t border-[${currentTheme.cardBorder}]`}>
            © {new Date().getFullYear()} Admin Panel. Thème "Professionnel & Énergique".
          </footer>
        </main>
      </div>
    </div>
  );
};

// Type guards (Keep as is)
const isFacture = (record: any): record is FactureData => "facture_num" in record;
const isIntervention = (record: any): record is InterventionData => "ref_dossier" in record;
const isSuiviCarburant = (record: any): record is SuiviCarburantData => "vehicule" in record;

const getRecordType = (record: InterventionData | FactureData | SuiviCarburantData): string => {
  if (isFacture(record)) return "Facture";
  if (isIntervention(record)) return "Intervention";
  if (isSuiviCarburant(record)) return "Suivi Carburant";
  return "Enregistrement";
};

export default AdminDashboard;