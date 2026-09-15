import React, { useState } from "react";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("skilltwin_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authView, setAuthView] = useState(false);

  function handleLogout() {
    localStorage.removeItem("skilltwin_token");
    localStorage.removeItem("skilltwin_user");
    setUser(null);
    setAuthView(false);
  }

  if (user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

  if (authView) {
    return (
      <Auth
        onAuthSuccess={(loggedUser) => {
          setUser(loggedUser);
          setAuthView(false);
        }}
        onBack={() => setAuthView(false)}
      />
    );
  }

  return <Landing onGetStarted={() => setAuthView(true)} />;
}
