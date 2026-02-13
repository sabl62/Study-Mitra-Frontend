import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import api from "../services/api.js";
import "./ChatRoom.css";

const ChatRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notes, setNotes] = useState([]);
  const [showNotes, setShowNotes] = useState(false);
  const [notesError, setNotesError] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const notesCountRef = useRef(0);

  // Get current user info to check for creator status
  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;
  // Check if current user is the session creator
  const isCreator =
    session?.creator === currentUser?.id ||
    session?.creator?.id === currentUser?.id;

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior });
      });
    }
  }, []);

  useEffect(() => {
    notesCountRef.current = notes.length;
  }, [notes]);

  // Initial Data Fetch
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        const [sessionRes, notesRes] = await Promise.all([
          api.get(`/sessions/${sessionId}/`),
          api.get(`/sessions/${sessionId}/notes/`),
        ]);

        if (isMounted) {
          setSession(sessionRes.data);
          const initialNotes = Array.isArray(notesRes.data)
            ? notesRes.data
            : notesRes.data.results || [];
          setNotes(initialNotes);
        }
      } catch (err) {
        // Silent fail
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();
    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Firestore Real-time Listener
  useEffect(() => {
    if (!session?.firestore_chat_id) return;

    const messagesRef = collection(
      db,
      "studySessions",
      session.firestore_chat_id,
      "messages",
    );
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMessages(docs);
        scrollToBottom();
      },
      (err) => {
        // Handle error
      },
    );

    return () => unsubscribe();
  }, [session?.firestore_chat_id, scrollToBottom]);

  // Handle leaving the session (either via button or navigation)
  const handleLeaveSession = useCallback(
    async (shouldNavigate = true) => {
      try {
        await api.post(`/sessions/${sessionId}/leave/`);
        if (shouldNavigate) navigate("/");
      } catch (err) {
        console.error("Error leaving session:", err);
        if (shouldNavigate) navigate("/");
      }
    },
    [sessionId, navigate],
  );

  // Cleanup/Leave on Unmount or Page Close
  useEffect(() => {
    const notifyLeave = () => {
      const url = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/sessions/${sessionId}/leave/`;
      // Use sendBeacon for more reliable delivery during page close
      navigator.sendBeacon(url);
    };

    window.addEventListener("beforeunload", notifyLeave);

    return () => {
      window.removeEventListener("beforeunload", notifyLeave);
      // Call leave when component unmounts (e.g., navigating to other sections of the site)
      handleLeaveSession(false);
    };
  }, [sessionId, handleLeaveSession]);

  const fetchNotes = async () => {
    try {
      const response = await api.get(`/sessions/${sessionId}/notes/`);
      const notesData = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setNotes(notesData);
      setNotesError(null);
      return notesData;
    } catch (err) {
      setNotesError("Failed to load notes");
      return [];
    }
  };

  const startPollingNotes = useCallback(() => {
    if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);

    let pollCount = 0;
    const maxPolls = 20;

    const poll = async () => {
      pollCount++;
      const currentNotes = await fetchNotes();

      if (currentNotes.length > notesCountRef.current) {
        setIsGenerating(false);
        setShowNotes(true);
        clearTimeout(pollingTimerRef.current);
        return;
      }

      if (pollCount >= maxPolls) {
        setIsGenerating(false);
        setNotesError("Generation timed out. Check back in a moment.");
        return;
      }

      pollingTimerRef.current = setTimeout(poll, 2000);
    };

    poll();
  }, [sessionId]);

  useEffect(() => {
    return () => {
      if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);
    };
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const messageContent = newMessage.trim();

    if (isSending || !messageContent || !session?.firestore_chat_id) return;

    setIsSending(true);
    setNewMessage("");

    try {
      const messagesRef = collection(
        db,
        "studySessions",
        session.firestore_chat_id,
        "messages",
      );

      await addDoc(messagesRef, {
        text: messageContent,
        senderId: currentUser?.id || "guest",
        senderName: currentUser?.username || "Anonymous",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      setNewMessage(messageContent);
      setNotesError("Message failed to send.");
    } finally {
      setIsSending(false);
      scrollToBottom();
    }
  };

  const handleGenerateNotes = async () => {
    if (messages.length === 0 || isGenerating) return;

    setIsGenerating(true);
    setNotesError(null);

    try {
      const messagesData = messages.map((msg) => ({
        text: msg.text,
        senderName: msg.senderName,
        senderId: msg.senderId,
        timestamp: msg.timestamp?.toDate?.() || new Date(),
      }));

      const response = await api.post(
        `/sessions/${sessionId}/generate_notes/`,
        {
          messages: messagesData,
        },
      );

      if (response.status === 202) {
        startPollingNotes();
      } else {
        await fetchNotes();
        setIsGenerating(false);
        setShowNotes(true);
      }
    } catch (err) {
      setNotesError(
        err.response?.data?.error || "AI Service temporarily unavailable.",
      );
      setIsGenerating(false);
    }
  };

  const handleEndSession = async () => {
    if (
      !window.confirm(
        "Are you sure you want to end this session? This will end it for all participants.",
      )
    )
      return;

    try {
      await api.post(`/sessions/${sessionId}/end_session/`);
      navigate("/");
    } catch (err) {
      setNotesError("Could not end session. Please try again.");
    }
  };

  const toggleNotesPanel = () => setShowNotes((prev) => !prev);

  if (loading) return <div className="loading">Loading session...</div>;
  if (!session) return <div className="error">Session not found</div>;

  return (
    <div className={`chat-container ${showNotes ? "notes-open" : ""}`}>
      {/* Minimalist Header - Just Session Title */}
      <header className="chat-header">
        <div className="session-info">
          <h2>{session.post?.title || session.topic || "Study Session"}</h2>
          <span className="status-badge">● Live</span>
        </div>
      </header>

      {notesError && (
        <div className="error-alert">
          {notesError}
          <button onClick={() => setNotesError(null)} className="error-close">
            ×
          </button>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="chat-main-content">
        <main className="messages-log">
          {messages.length === 0 ? (
            <div className="messages-empty">
              <div className="messages-empty-icon">💬</div>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="message-item">
                <div className="message-bubble">
                  <span className="sender-name">{msg.senderName}</span>
                  <p className="message-text">{msg.text}</p>
                  <span className="message-time">
                    {msg.timestamp?.toDate?.()?.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }) || "Sending..."}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} style={{ height: "1px" }} />
        </main>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            autoFocus
          />
          <button type="submit" disabled={!newMessage.trim() || isSending}>
            {isSending ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* Floating Action Bar at Bottom */}
      <div className="floating-actions">
        <button
          onClick={toggleNotesPanel}
          className={`action-btn notes-toggle ${showNotes ? "active" : ""}`}
        >
          <span className="action-btn-icon">{showNotes ? "✕" : "📝"}</span>
          <span className="action-btn-text">
            {showNotes ? "Hide Notes" : `Notes (${notes.length})`}
          </span>
        </button>

        <button
          onClick={handleGenerateNotes}
          disabled={isGenerating || messages.length === 0}
          className="action-btn generate"
        >
          <span className="action-btn-icon">{isGenerating ? "⏳" : "🤖"}</span>
          <span className="action-btn-text">
            {isGenerating ? "Processing..." : "Generate Notes"}
          </span>
        </button>

        {isCreator ? (
          <button onClick={handleEndSession} className="action-btn leave">
            <span className="action-btn-icon">🛑</span>
            <span className="action-btn-text">End Session</span>
          </button>
        ) : (
          <button
            onClick={() => handleLeaveSession(true)}
            className="action-btn leave"
          >
            <span className="action-btn-icon">🚪</span>
            <span className="action-btn-text">Leave</span>
          </button>
        )}
      </div>

      {/* Notes Panel */}
      <aside className={`notes-panel ${showNotes ? "active" : ""}`}>
        <div className="notes-panel-header">
          <h3>📚 Study Notes</h3>
          <div className="notes-panel-actions">
            <button
              onClick={fetchNotes}
              className="notes-refresh-btn"
              disabled={isGenerating}
              title="Refresh notes"
            >
              🔄
            </button>
            <button
              onClick={toggleNotesPanel}
              className="notes-close-btn"
              title="Close notes"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="notes-panel-content">
          {notes.length === 0 ? (
            <div className="notes-empty">
              <div className="notes-empty-icon">📝</div>
              <p>Click "Generate Notes" to summarize this chat.</p>
            </div>
          ) : (
            [...notes].reverse().map((note, index) => (
              <article key={note.id || index} className="note-card">
                <div className="note-timestamp">
                  {new Date(note.created_at).toLocaleString()}
                </div>

                {note.content && (
                  <section className="note-section">
                    <h4 className="note-section-title">📄 Summary</h4>
                    <div className="note-section-content">
                      <p>{note.content}</p>
                    </div>
                  </section>
                )}

                {note.key_concepts?.length > 0 && (
                  <section className="note-section">
                    <h4 className="note-section-title">💡 Key Concepts</h4>
                    <div className="note-section-content">
                      <ul>
                        {note.key_concepts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {note.definitions?.length > 0 && (
                  <section className="note-section">
                    <h4 className="note-section-title">📖 Definitions</h4>
                    <div className="note-section-content">
                      <ul>
                        {note.definitions.map((def, i) => (
                          <li key={i}>
                            <strong className="note-definition-term">
                              {def.term || def}:
                            </strong>{" "}
                            {def.definition || def}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}

                {note.study_tips?.length > 0 && (
                  <section className="note-section">
                    <h4 className="note-section-title">✨ Study Tips</h4>
                    <div className="note-section-content">
                      <ul>
                        {note.study_tips.map((t, i) => (
                          <li key={i}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  </section>
                )}
              </article>
            ))
          )}
        </div>
      </aside>
    </div>
  );
};

export default ChatRoom;
