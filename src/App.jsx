import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
} from "react-router-dom";

import MicroChallenges from "./components/MicroChallenges";
import StudyPosts from "./components/StudyPosts";
import ChatRoom from "./components/ChatRoom";
import Login from "./components/Login";
import Signup from "./components/SignUp";
import Sidebar from "./components/SideBar";
import Profile from "./components/Profile";
import ExamPrep from "./components/ExamPrep.jsx";
// Auth Context
import { useAuth, AuthProvider } from "./context/AuthContext.jsx";

// Styles
import "./App.css";
import { useParams } from "react-router-dom";

const ProfileViewWrapper = () => {
  const { username } = useParams(); // Grabs the name from the URL /profile/john
  const { user } = useAuth(); // Grabs logged in user

  // If the URL username is actually ME, treat it as own profile
  const isMe = username === user?.username;

  return <Profile username={username} isOwnProfile={isMe} />;
};
/**
 * A clean ProtectedRoute using the global Auth state
 */
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading)
    return <div className="loading-screen">Loading Study Mitra...</div>;
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

function AppContent() {
  // Pull reactive state directly from Context
  const { user, isLoggedIn, logout } = useAuth();

  return (
    <Router>
      <div className="App">
        {/* NAVBAR - Automatically reacts when isLoggedIn changes */}
        {isLoggedIn && (
          <header className="app-navbar">
            <div className="nav-left">
              <Link to="/" className="logo-link">
                <span className="logo">Study Mitra</span>
              </Link>
            </div>

            <div className="nav-center">
              <span className="welcome-text">
                Welcome,{" "}
                <span className="user-highlight">
                  {user?.username || "Scholar"}
                </span>
              </span>
            </div>

            <div className="nav-right">
              <button
                className="logout-button"
                onClick={logout}
                title="Sign Out"
              >
                Logout
              </button>
            </div>
          </header>
        )}

        <div className={`main-layout ${!isLoggedIn ? "auth-mode" : ""}`}>
          {/* SIDEBAR - Automatically visible on login */}
          {isLoggedIn && <Sidebar />}

          <main className="content-area">
            <Routes>
              {/* --- PUBLIC ROUTES --- */}
              <Route
                path="/login"
                element={!isLoggedIn ? <Login /> : <Navigate to="/" replace />}
              />
              <Route
                path="/signup"
                element={!isLoggedIn ? <Signup /> : <Navigate to="/" replace />}
              />

              {/* --- PROTECTED ROUTES --- */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <StudyPosts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile username={user?.username} isOwnProfile={true} />
                  </ProtectedRoute>
                }
              />

              {/* Others' profiles - The dynamic part */}
              <Route
                path="/profile/:username"
                element={
                  <ProtectedRoute>
                    <ProfileViewWrapper />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/exams"
                element={
                  <ProtectedRoute>
                    <ExamPrep />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/challenges"
                element={
                  <ProtectedRoute>
                    <MicroChallenges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:sessionId"
                element={
                  <ProtectedRoute>
                    <ChatRoom />
                  </ProtectedRoute>
                }
              />

              {/* --- FALLBACK --- */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

// Wrap the app in the AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
