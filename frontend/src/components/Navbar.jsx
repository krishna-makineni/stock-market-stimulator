import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import {
  MdDashboard,
  MdShowChart,
  MdAccountBalanceWallet,
  MdHistory,
  MdLeaderboard,
  MdPieChart,
  MdPerson,
  MdAccountBalance,
  MdSettings,
  MdRestore,
  MdContentCopy,
  MdVisibility,
  MdVisibilityOff,
  MdLogout,
} from "react-icons/md";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: MdDashboard },
  { to: "/market", label: "Market", icon: MdShowChart },
  { to: "/portfolio", label: "Portfolio", icon: MdAccountBalanceWallet },
  { to: "/transactions", label: "History", icon: MdHistory },
  { to: "/leaderboard", label: "Leaderboard", icon: MdLeaderboard },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { connected } = useStock();
  const location = useLocation();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem("showBalance") !== "false");
  const [pulseEnabled, setPulseEnabled] = useState(() => localStorage.getItem("pulseEnabled") !== "false");
  const profileMenuRef = useRef(null);
  const lastVisitedPath = localStorage.getItem("lastVisitedPath");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    const ignoredRoutes = ["/login", "/register"];
    if (!ignoredRoutes.includes(location.pathname)) {
      localStorage.setItem("lastVisitedPath", location.pathname);
    }
  }, [location.pathname]);

  const toggleBalanceVisibility = () => {
    setShowBalance((prev) => {
      const next = !prev;
      localStorage.setItem("showBalance", String(next));
      return next;
    });
  };

  const togglePulseMode = () => {
    setPulseEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("pulseEnabled", String(next));
      return next;
    });
  };

  const copyUsername = async () => {
    if (!user?.username) return;
    try {
      await navigator.clipboard.writeText(user.username);
    } catch {
      // Clipboard might be unavailable in some browsers/context.
    }
  };

  const profileActions = [
    {
      label: "Holdings",
      icon: MdPieChart,
      onClick: () => navigate("/portfolio"),
    },
    {
      label: "My Portfolio",
      icon: MdAccountBalanceWallet,
      onClick: () => navigate("/portfolio"),
    },
    {
      label: "Transaction History",
      icon: MdHistory,
      onClick: () => navigate("/transactions"),
    },
    {
      label: "Leaderboard",
      icon: MdLeaderboard,
      onClick: () => navigate("/leaderboard"),
    },
    {
      label: "Market Watch",
      icon: MdShowChart,
      onClick: () => navigate("/market"),
    },
  ];

  return (
    <nav className="glass border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-neon-green flex items-center justify-center">
            <MdShowChart className="text-dark-900 text-base" />
          </div>
          <span className="font-display font-bold text-white tracking-tight">
            Stock<span className="neon-text">Sim</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                location.pathname === to
                  ? "bg-neon-green/10 text-neon-green"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="text-base" />
              {label}
            </Link>
          ))}
        </div>

        {/* Right: Balance + Status + Logout */}
        <div className="flex items-center gap-3">
          {/* Live indicator */}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                connected ? `bg-neon-green ${pulseEnabled ? "animate-pulse" : ""}` : "bg-red-500"
              }`}
            />
            <span className="text-xs text-slate-500 font-mono hidden sm:block">
              {connected ? "LIVE" : "OFF"}
            </span>
          </div>

          {/* Balance */}
          {user && (
            <div className="hidden sm:block">
              <span className="text-xs text-slate-500 font-mono">BALANCE</span>
              <p className="text-sm font-mono font-semibold neon-text leading-none">
                {showBalance
                  ? `₹${user.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                  : "₹••••••"}
              </p>
            </div>
          )}

          {/* User + Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileOpen((prev) => !prev)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-dark-900 font-bold text-xs hover:brightness-110 transition-all"
              title="Open profile menu"
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 glass border border-slate-700 rounded-xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <div className="flex items-center gap-2">
                    <MdPerson className="text-neon-green text-lg" />
                    <p className="text-sm text-white font-semibold truncate">{user?.username || "User"}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <MdAccountBalance className="text-neon-blue text-base" />
                    <p className="text-xs text-slate-300">
                      Balance:{" "}
                      {showBalance
                        ? `₹${user?.balance?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        : "₹••••••"}
                    </p>
                  </div>
                </div>

                <div className="px-2 py-2 border-b border-slate-800 mb-1 flex items-center gap-2">
                  <button
                    onClick={toggleBalanceVisibility}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                  >
                    {showBalance ? <MdVisibilityOff className="text-base" /> : <MdVisibility className="text-base" />}
                    {showBalance ? "Hide Balance" : "Show Balance"}
                  </button>
                  <button
                    onClick={copyUsername}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    title="Copy username"
                  >
                    <MdContentCopy className="text-base" />
                  </button>
                </div>

                {profileActions.map(({ label, icon: Icon, onClick }) => (
                  <button
                    key={label}
                    onClick={() => {
                      onClick();
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <Icon className="text-base" />
                    {label}
                  </button>
                ))}

                <button
                  onClick={() => {
                    if (lastVisitedPath) navigate(lastVisitedPath);
                    setIsProfileOpen(false);
                  }}
                  disabled={!lastVisitedPath}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <MdRestore className="text-base" />
                  Go to Last Page
                </button>

                <button
                  onClick={() => {
                    navigate("/dashboard");
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <MdSettings className="text-base" />
                  Quick Dashboard
                </button>
                <button
                  onClick={togglePulseMode}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${pulseEnabled ? "bg-neon-green animate-pulse" : "bg-slate-500"}`}
                  />
                  {pulseEnabled ? "Disable Pulse Mode" : "Enable Pulse Mode"}
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-neon-red hover:bg-red-900/20 rounded transition-all"
              title="Logout"
            >
              <MdLogout className="text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex border-t border-slate-800">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-2 text-xs transition-all ${
              location.pathname === to
                ? "text-neon-green"
                : "text-slate-500 hover:text-white"
            }`}
          >
            <Icon className="text-lg mb-0.5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
