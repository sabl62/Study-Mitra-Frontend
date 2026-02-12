import React, { useState, useEffect, useRef } from "react";
import { profileAPI } from "../services/api";
import api from "../services/api";
import "./Profile.css";

const Profile = ({ username, isOwnProfile = true }) => {

  const [notePrivacy, setNotePrivacy] = useState("public");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingBio, setIsSavingBio] = useState(false);
  const [currentUploadingType, setCurrentUploadingType] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [bio, setBio] = useState({
    qualifications: "",
    interests: "",
    hobbies: "",
  });
  const [userNotes, setUserNotes] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);
  const pollingRef = useRef(null);

  const processMedia = (allMedia) => {
    const mediaArray = allMedia || [];
    const notes = mediaArray.filter(
      (item) => item.category?.toLowerCase() === "note",
    );
    const certs = mediaArray.filter(
      (item) => item.category?.toLowerCase() === "certificate",
    );

    setUserNotes(notes);
    setCertificates(certs);

    if (certs.some((c) => c.title === "Processing...")) {
      startPolling();
    } else {
      stopPolling();
    }
  };

  const startPolling = () => {
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const response = isOwnProfile
          ? await profileAPI.getMe()
          : await profileAPI.getProfile(username);

        const certs = response.data.portfolio_media.filter(
          (item) => item.category?.toLowerCase() === "certificate",
        );

        setCertificates(certs);

        if (!certs.some((c) => c.title === "Processing...")) stopPolling();
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 4000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const fetchProfile = async () => {
    try {
      const response = isOwnProfile
        ? await profileAPI.getMe()
        : await profileAPI.getProfile(username);

      const data = response.data;
      setProfileUser(data);

      // Handle bio from various possible locations in response
      if (data.bio) {
        setBio({
          qualifications: data.bio,
          interests: data.interests || "",
          hobbies: data.hobbies || "",
        });
      }

      processMedia(data.portfolio_media);
    } catch (error) {
      console.error("Failed to fetch profile", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    return () => stopPolling();
  }, [username, isOwnProfile]);

  const handleUpdateBio = async () => {
    if (!isOwnProfile) return;

    setIsSavingBio(true);
    try {
      // POST to /userprofile/me/ to update the profile
      await api.post("/userprofile/me/", { bio: bio.qualifications });

      // Fetch fresh profile data to confirm save
      await fetchProfile();
      console.log("Bio updated successfully");
    } catch (error) {
      console.error("Failed to update bio:", error);
      console.error("Error details:", error.response?.data);
      alert(
        `Failed to update bio: ${error.response?.data?.detail || error.message}`,
      );
    } finally {
      setIsSavingBio(false);
    }
  };

  const openUploadWidget = (category) => {
    if (!isOwnProfile) return;
    if (!window.cloudinary) return alert("Cloudinary script not loaded.");

    setCurrentUploadingType(category);

    window.cloudinary.openUploadWidget(
      {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        sources: ["local", "url", "camera"],
        multiple: false,
        theme: "minimal",
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          handleUploadSuccess(result.info, category);
        } else if (error) {
          setIsAnalyzing(false);
        }
      },
    );
  };

  const handleUploadSuccess = async (uploadInfo, category) => {
    setIsAnalyzing(true);

    const extractedText =
      uploadInfo.info?.ocr?.adv_ocr?.data?.[0]?.fullTextAnnotation?.text ||
      uploadInfo.ocr?.adv_ocr?.data?.[0]?.fullTextAnnotation?.text ||
      "";


    try {
      await profileAPI.uploadMedia({
        fileUrl: uploadInfo.secure_url,
        category: category,
        is_public: notePrivacy === "public",
        aiAnalysisText:
          extractedText || `Document: ${uploadInfo.original_filename}`,
      });

      fetchProfile();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsAnalyzing(false);
      setCurrentUploadingType("");
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="skeleton-profile">
          <div className="skeleton-banner"></div>
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-line w-60"></div>
            <div className="skeleton-line w-40"></div>
          </div>
        </div>
      </div>
    );
  }

  const displayUsername = profileUser?.username || username;
  const allSkills = [...new Set(certificates.flatMap((c) => c.skills || []))];

  return (
    <div className="profile-layout">
      {isAnalyzing && (
        <div className="ai-loader-overlay">
          <div className="ai-loader-content">
            <div className="spinner"></div>
            <p>AI is analyzing your {currentUploadingType}...</p>
          </div>
        </div>
      )}

      {/* Sidebar Navigation
      <aside className="profile-sidebar">
        <div className="sidebar-header">
          <div className="profile-avatar-sidebar">
            {displayUsername?.charAt(0).toUpperCase()}
          </div>
          <h3 className="sidebar-username">{displayUsername}</h3>
          <p className="sidebar-subtitle">
            {isOwnProfile ? "Your Profile" : "Student Profile"}
          </p>
        </div>

        <nav className="sidebar-nav">
          {["about", "notes", "portfolio"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`sidebar-nav-item ${activeTab === tab ? "active" : ""}`}
            >
              <span className="nav-icon">
                {tab === "about" && "👤"}
                {tab === "notes" && "📝"}
                {tab === "portfolio" && "🏆"}
              </span>
              <span className="nav-label">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </span>
            </button>
          ))}
        </nav>
      </aside> */}

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-header-banner">
          <div className="banner-gradient"></div>
          <div className="profile-header-content">
            <div className="profile-avatar-large">
              {displayUsername?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{displayUsername}</h1>
              <p className="profile-status">
                <span className="status-dot"></span>
                {isOwnProfile ? "Active Student" : "Student"}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <section className="tab-content-area">
          <div className="about-section">
            <div className="card-glass">
              <h2 className="section-title">
                {isOwnProfile ? "Update Your Profile" : "About"}
              </h2>

              <div className="input-group">
                <label className="input-label">Qualifications</label>
                <textarea
                  className="bio-textarea"
                  placeholder={
                    isOwnProfile
                      ? "Degrees, Certifications, Achievements..."
                      : "No qualifications added yet"
                  }
                  value={bio.qualifications}
                  onChange={(e) =>
                    setBio({ ...bio, qualifications: e.target.value })
                  }
                  readOnly={!isOwnProfile}
                  rows={6}
                />
              </div>

              {isOwnProfile && (
                <button
                  className="save-btn"
                  onClick={handleUpdateBio}
                  disabled={isSavingBio}
                >
                  {isSavingBio ? (
                    <>
                      <span className="btn-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    "Update Bio"
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="notes-section">
            {isOwnProfile && (
              <div className="card-glass upload-card">
                <div className="upload-header">
                  <h3 className="section-title">Share Your Knowledge</h3>
                  <div className="privacy-toggle-container">
                    <span className="toggle-label">Privacy:</span>
                    <div
                      className={`privacy-toggle ${notePrivacy}`}
                      onClick={() =>
                        setNotePrivacy((prev) =>
                          prev === "public" ? "private" : "public",
                        )
                      }
                    >
                      <div className="toggle-slider"></div>
                      <span className="toggle-text public">Public</span>
                      <span className="toggle-text private">Private</span>
                    </div>
                  </div>
                </div>

                <button
                  className="upload-trigger-btn"
                  onClick={() => openUploadWidget("note")}
                >
                  <span className="btn-icon">📤</span>
                  Upload Notes
                </button>
              </div>
            )}

            <div className="notes-grid">
              {userNotes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <h3>No notes yet</h3>
                  <p>
                    {isOwnProfile
                      ? "Upload your first note to get started"
                      : "This user hasn't shared any notes yet"}
                  </p>
                </div>
              ) : (
                userNotes.map((note) => (
                  <div key={note.id} className="note-card card-glass">
                    <div className="note-header">
                      <h4 className="note-title">{note.title}</h4>
                      <span
                        className={`visibility-badge ${note.is_public ? "public" : "private"}`}
                      >
                        {note.is_public ? "🌐 Public" : "🔒 Private"}
                      </span>
                    </div>
                    <div
                      className="note-preview"
                      onClick={() => setSelectedImage(note.file_url)}
                    >
                      <img src={note.file_url} alt={note.title} />
                    </div>

                    <div className="note-footer">
                      <span className="note-date">
                        {new Date(note.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="portfolio-section">
            <div className="portfolio-header-box card-glass">
              <div className="ai-status">
                <span className="sparkle">✨</span>
                <div className="ai-status-text">
                  <h3 className="ai-title">Portfolio Builder</h3>
                  <div className="skills-summary-container">
                    {allSkills.length > 0 ? (
                      <>
                        <span className="skills-count-badge">
                          {allSkills.length} Skills Identified
                        </span>
                        <div className="skills-flex-wrapper">
                          {allSkills.map((skill, index) => (
                            <span key={index} className="skill-tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="empty-skills-text">
                        Upload certificates to build your skill portfolio
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {isOwnProfile && (
                <button
                  className="upload-trigger-btn primary"
                  onClick={() => openUploadWidget("certificate")}
                >
                  <span className="btn-icon">🏆</span>
                  Add Certificate
                </button>
              )}
            </div>

            <div className="certificates-grid">
              {certificates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🏆</div>
                  <h3>No certificates yet</h3>
                  <p>
                    {isOwnProfile
                      ? "Upload your achievements to showcase your skills"
                      : "This user hasn't added any certificates yet"}
                  </p>
                </div>
              ) : (
                certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className={`cert-card card-glass ${cert.title === "Processing..." ? "is-processing" : ""}`}
                  >
                    <div className="cert-img-container">
                      <img
                        src={cert.file_url}
                        alt={cert.title}
                        onClick={() => setSelectedImage(cert.file_url)}
                      />

                      {cert.title === "Processing..." && (
                        <div className="processing-overlay">
                          <div className="processing-spinner"></div>
                        </div>
                      )}
                    </div>

                    <div className="cert-info">
                      <h4 className="cert-title">{cert.title}</h4>
                      {cert.skills && cert.skills.length > 0 && (
                        <div className="skills-list">
                          {cert.skills.map((skill, idx) => (
                            <span key={idx} className="skill-badge">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
      {selectedImage && (
        <div
          className="image-modal-overlay"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>

            <img src={selectedImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
