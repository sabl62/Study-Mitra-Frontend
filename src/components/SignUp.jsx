import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  UserPlus,
  Mail,
  Lock,
  User,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import "./SignUp.css";

function Signup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "https://study-mitra-backend.onrender.com/api/auth/register/",
        form,
      );
      navigate("/login", {
        state: { message: "Account created! Welcome to the tribe." },
      });
    } catch (err) {
      alert("Signup failed. That username or email might already be taken.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        {/* Left Side: Form Section */}
        <div className="signup-form-section">
          <div className="form-header">
            <h2>Create Account</h2>
            <p>Start your journey with Study Mitra today.</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-grid-form">
            <div className="input-group full-width">
              <label>Username</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  name="username"
                  placeholder="johndoe123"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>First Name</label>
              <div className="input-wrapper">
                <input
                  name="first_name"
                  placeholder="John"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Last Name</label>
              <div className="input-wrapper">
                <input
                  name="last_name"
                  placeholder="Doe"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-group full-width">
              <label>Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="input-group full-width">
              <label>Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? (
                "Creating..."
              ) : (
                <>
                  Create Account <UserPlus size={18} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Log in here</Link>
          </p>
        </div>

        {/* Right Side: Visual Branding */}
        <div className="signup-visual">
          <div className="visual-content">
            <div className="brand-badge">
              <Sparkles size={16} /> <span>Smart Education</span>
            </div>
            <h1>
              Unlock Your <br />
              <span>Full Potential</span>
            </h1>
            <ul className="feature-list">
              <li>
                <CheckCircle size={18} className="check-icon" /> AI Note
                Summarization
              </li>
              <li>
                <CheckCircle size={18} className="check-icon" /> Collaborative
                Study Rooms
              </li>
              <li>
                <CheckCircle size={18} className="check-icon" /> Smart Exam Prep
              </li>
            </ul>
          </div>
          <div className="visual-footer">
            <p className="quote">
              "The best way to predict the future is to create it."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
