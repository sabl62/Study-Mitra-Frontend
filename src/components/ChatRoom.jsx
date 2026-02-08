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
  const notesCountRef = useRef(0); // Tracks count for polling comparison

  const scrollToBottom = useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      // requestAnimationFrame ensures the DOM has updated before scrolling
      window.requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior });
      });
    }
  }, []);

  // Sync ref with state
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
        // Silent fail for non-critical session fetch
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
        // Handle snapshot error silently
      },
    );

    return () => unsubscribe();
  }, [session?.firestore_chat_id, scrollToBottom]);

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

  // Production-grade Polling (Prevents request stacking)
  const startPollingNotes = useCallback(() => {
    if (pollingTimerRef.current) clearTimeout(pollingTimerRef.current);

    let pollCount = 0;
    const maxPolls = 20; // 40 seconds total

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

  // Clean up timers on unmount
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
    setNewMessage(""); // Optimistic UI: clear immediately

    try {
      const userJson = localStorage.getItem("user");
      const storedUser = userJson ? JSON.parse(userJson) : null;

      const messagesRef = collection(
        db,
        "studySessions",
        session.firestore_chat_id,
        "messages",
      );

      await addDoc(messagesRef, {
        text: messageContent,
        senderId: storedUser?.id || "guest",
        senderName: storedUser?.username || "Anonymous",
        timestamp: serverTimestamp(),
      });
    } catch (err) {
      setNewMessage(messageContent); // Revert on failure
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
    if (!window.confirm("Are you sure you want to end this session?")) return;

    try {
      await api.post(`/sessions/${sessionId}/end_session/`);
      navigate("/dashboard");
    } catch (err) {
      setNotesError("Could not end session. Please try again.");
    }
  };

  const toggleNotesPanel = () => setShowNotes((prev) => !prev);

  if (loading) return <div className="loading">Loading session...</div>;
  if (!session) return <div className="error">Session not found</div>;

  return (
    <div className={`chat-container ${showNotes ? "notes-open" : ""}`}>
      <header className="chat-header">
        <div className="session-info">
          <h2>{session.post?.title || session.topic || "Study Session"}</h2>
          <span className="status-badge">● Live</span>
        </div>
        <div className="header-actions">
          <button
            onClick={toggleNotesPanel}
            className={`notes-btn ${showNotes ? "active" : ""}`}
          >
            📝 {showNotes ? "Hide Notes" : `Notes (${notes.length})`}
          </button>
          <button
            onClick={handleGenerateNotes}
            disabled={isGenerating || messages.length === 0}
            className="notes-btn"
          >
            {isGenerating ? "⏳ Processing..." : "🤖 Generate Notes"}
          </button>
          <button onClick={handleEndSession} className="end-btn">
            End Session
          </button>
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

      <aside className={`notes-panel ${showNotes ? "active" : ""}`}>
        <div className="notes-panel-header">
          <h3>📚 Study Notes</h3>
          <div className="notes-panel-actions">
            <button
              onClick={fetchNotes}
              className="notes-refresh-btn"
              disabled={isGenerating}
            >
              🔄
            </button>
            <button onClick={toggleNotesPanel} className="notes-close-btn">
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
