import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-group">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="icon">📚</span>
          <span className="label">Study Along</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="icon">👤</span>
          <span className="label">Profile</span>
        </NavLink>

        <NavLink
          to="/exams"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="icon">📝</span>
          <span className="label">Exam Preparation</span>
        </NavLink>

        <NavLink
          to="/challenges"
          className={({ isActive }) =>
            isActive ? "nav-item active" : "nav-item"
          }
        >
          <span className="icon">🎯</span>
          <span className="label">Micro Challenges</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
