import React, { useState, useEffect, useCallback, useRef } from "react";
import { studyPostsAPI, authAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./StudyPosts.css";

const INITIAL_POST_STATE = {
  title: "",
  topic: "",
  description: "",
  subject: "",
};

const INITIAL_FILTERS = { subject: "", search: "", topic: "" };

function StudyPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [createError, setCreateError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [newPost, setNewPost] = useState(INITIAL_POST_STATE);

  const navigate = useNavigate();
  const user = authAPI.getCurrentUser();

  // Ref to track the current abort controller for cleanup
  const abortControllerRef = useRef(null);

  const fetchPosts = useCallback(async (currentFilters) => {
    // Cancel any ongoing request before starting a new one
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await studyPostsAPI.getAll(currentFilters, {
        signal: abortControllerRef.current.signal,
      });

      const data = response.data.results || response.data;
      setPosts(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") return;

      setError(
        "Failed to sync with Study Mitra. Please check your connection.",
      );
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // DEBOUNCE LOGIC: Wait for user to stop typing before searching
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPosts(filters);
    }, 400); // 400ms delay

    return () => {
      clearTimeout(handler);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [filters, fetchPosts]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }
  };

  const handleJoinPost = async (postId) => {
    try {
      const response = await studyPostsAPI.join(postId);
      const sessionData = response.data.session || response.data;
      navigate(`/chat/${sessionData.id}`, { state: { session: sessionData } });
    } catch (err) {
      const msg =
        err.response?.data?.error || "This session is no longer available.";
      alert(msg);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const postData = {
        title: newPost.title.trim(),
        topic: newPost.topic.trim(),
        description: newPost.description.trim(),
        subject: newPost.subject.trim(),
      };

      await studyPostsAPI.create(postData);
      setShowCreateModal(false);
      setNewPost(INITIAL_POST_STATE);
      fetchPosts(filters); // Refresh current view
    } catch (err) {
      const backendError = err.response?.data;
      let errorMessage = "Could not create post.";
      if (typeof backendError === "object") {
        errorMessage = Object.entries(backendError)
          .map(
            ([key, val]) =>
              `${key}: ${Array.isArray(val) ? val.join(", ") : val}`,
          )
          .join(" | ");
      } else {
        errorMessage = backendError || err.message;
      }
      setCreateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
    setNewPost(INITIAL_POST_STATE);
  };

  if (loading && posts.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="study-posts-container">
      <header className="header-section">
        <div className="title-group">
          <h1>Study Mitra</h1>
          <p>Collaborate, Learn, and Succeed together.</p>
        </div>

        {user && (
          <button
            className="create-post-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="plus-icon">+</span> Create Post
          </button>
        )}
      </header>

      <div className="filter-bar">
        <div className="input-wrapper search-main">
          <input
            type="text"
            placeholder="Search topics or titles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="modern-input"
          />
        </div>

        <div className="input-wrapper filter-subject">
          <input
            type="text"
            placeholder="Filter by Subject..."
            value={filters.subject}
            onChange={(e) =>
              setFilters({ ...filters, subject: e.target.value })
            }
            className="modern-input"
          />
        </div>
      </div>

      {error && <div className="error-pill banner-error">{error}</div>}

      <main className="posts-list">
        {posts.length === 0 ? (
          <div className="no-posts-state">
            <div className="empty-icon">📚</div>
            <p>No study sessions found for your search.</p>
            <button
              onClick={() => {
                setSearchInput("");
                setFilters(INITIAL_FILTERS);
              }}
              className="text-link"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="post-row-card">
              <div className="user-section">
                <div className="avatar-squircle">
                  {post.user?.username?.charAt(0).toUpperCase() || "?"}
                </div>
                <div className="user-details">
                  <h3>{post.user?.username || "Anonymous"}</h3>
                  <span className="date-label">
                    {new Date(post.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="content-section">
                <div className="tag-row">
                  <span className="subject-tag">{post.subject}</span>
                  {post.topic && (
                    <span className="topic-badge">{post.topic}</span>
                  )}
                </div>
                <h2>{post.title}</h2>
                <p className="description-text">{post.description}</p>
              </div>

              <div className="action-section">
                <div className="status-indicator">
                  {post.active_sessions_count > 0 ? (
                    <span className="live-badge pulse">
                      ● {post.active_sessions_count} Active
                    </span>
                  ) : (
                    <span className="idle-badge">Be the first to join</span>
                  )}
                </div>
                <button
                  className="join-action-btn"
                  onClick={() => handleJoinPost(post.id)}
                >
                  Join Session
                </button>
              </div>
            </article>
          ))
        )}
      </main>

      {showCreateModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Launch a Study Session</h2>
              <button className="close-btn" onClick={handleCloseModal}>
                &times;
              </button>
            </div>

            {createError && (
              <div className="error-pill modal-error">{createError}</div>
            )}

            <form onSubmit={handleCreatePost} className="modern-form">
              <div className="form-group">
                <label>Title</label>
                <input
                  required
                  value={newPost.title}
                  onChange={(e) =>
                    setNewPost({ ...newPost, title: e.target.value })
                  }
                  placeholder="What's your goal?"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    required
                    value={newPost.subject}
                    onChange={(e) =>
                      setNewPost({ ...newPost, subject: e.target.value })
                    }
                    placeholder="e.g. Physics"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label>Topic</label>
                  <input
                    required
                    value={newPost.topic}
                    onChange={(e) =>
                      setNewPost({ ...newPost, topic: e.target.value })
                    }
                    placeholder="e.g. Relativity"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  required
                  value={newPost.description}
                  onChange={(e) =>
                    setNewPost({ ...newPost, description: e.target.value })
                  }
                  placeholder="Provide details for your partners..."
                  rows="3"
                  disabled={isSubmitting}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Posting..." : "Post Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudyPosts;
