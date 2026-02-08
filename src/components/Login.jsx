// src/components/Login.jsx
import React, { useEffect, useState } from "react";
import { authAPI } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, User, Lock, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx"; // Import the hook
import "./login.css";

const Login = () => {
  const { login, isLoggedIn } = useAuth();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/");
    }
  }, [isLoggedIn, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await authAPI.login(formData);
      const token = data?.access || data?.token;

      const user = {
        id: data?.id || data?.user?.id,
        username: data?.username || formData.username,
      };

      if (!token) throw new Error("Authentication failed");

      // Use context to login (Handles localStorage and state sync)
      login(user, token);

      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.detail || "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Side: Visual Branding */}
        <div className="login-visual">
          <div className="visual-content">
            <div className="brand-badge">
              <Sparkles size={16} /> <span>AI-Powered Learning</span>
            </div>
            <h1>
              Your Ultimate <br />
              <span>Study Mitra</span>
            </h1>
            <p>
              Join thousands of students mastering subjects with OCR-powered
              notes and AI insights.
            </p>
          </div>
          <div className="visual-footer">
            <div className="mini-stat">
              <strong>10k+</strong> <span>Users</span>
            </div>
            <div className="mini-stat">
              <strong>50k+</strong> <span>Tasks Solved</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="login-form-section">
          <div className="form-header">
            <div className="mobile-logo">Study Mitra</div>
            <h2>Welcome Back</h2>
            <p>Please enter your details to continue</p>
          </div>

          {error && <div className="error-toast">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Username</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <span className="loader"></span>
              ) : (
                <>
                  Log In <LogIn size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign up for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
