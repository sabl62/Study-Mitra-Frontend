import React, { useState, useCallback } from "react";
import api from "../services/api";
import ReactMarkdown from "react-markdown";
import "./MicroChallenges.css";

const MicroChallenges = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const challengeTypes = [
    { id: "quiz", label: "Knowledge Quiz", icon: "🧠", color: "#38bdf8" },
    { id: "iq", label: "Logic Puzzle", icon: "🧩", color: "#a29bfe" },
    { id: "fact", label: "Mind Blow", icon: "✨", color: "#64ffda" },
  ];

  const generateChallenge = useCallback(
    async (type) => {
      if (!topic) return;
      setLoading(true);
      setActiveType(type.id);
      setFeedback(null);
      setContent("");

      const prompts = {
        quiz: `Subject: ${topic}. Create a complex MCQ. Format: **Question** on first line(s), then options A, B, C, D each on separate lines starting with the letter.`,
        iq: `Subject: ${topic}. Create a logic puzzle. Format: **Puzzle text** on first line(s), then options A, B, C each on separate lines starting with the letter.`,
        fact: `Subject: ${topic}. Give one mind-blowing fact with a **Bold Title** and a 2-sentence explanation.`,
      };

      try {
        const res = await api.post("/exam-prep/solve/", {
          question: prompts[type.id],
        });
        setContent(res.data.answer || res.data.content);
      } catch (e) {
        setContent("Neural link failed.");
      } finally {
        setLoading(false);
      }
    },
    [topic],
  );

  const verifyAnswer = useCallback(
    async (choice) => {
      setLoading(true);
      try {
        const res = await api.post("/exam-prep/solve/", {
          question: `Original Question: ${content}. User chose ${choice}. Explain the answer. Do not repeat the question. Start with CORRECT or INCORRECT.`,
        });
        setFeedback(res.data.answer);
      } finally {
        setLoading(false);
      }
    },
    [content],
  );

  // Extract only the question part (before options A, B, C, D)
  const getQuestionText = (fullContent) => {
    if (!fullContent) return "";

    // Split by common option patterns
    const optionPatterns = [
      /\n\s*[A-D][\.\):\s]/, // Matches "A." or "A)" or "A:"
      /\n\s*\*\*[A-D][\.\):\s]/, // Matches "**A."
    ];

    for (let pattern of optionPatterns) {
      const match = fullContent.search(pattern);
      if (match !== -1) {
        return fullContent.substring(0, match).trim();
      }
    }

    return fullContent; // Return full content if no options found (for fact type)
  };

  // Extract option text for a specific letter (A, B, C, or D)
  const getOptionText = (fullContent, letter) => {
    if (!fullContent)
      return { short: `Option ${letter}`, full: `Option ${letter}` };

    // Pattern to match the option with the given letter
    const optionPattern = new RegExp(
      `\\n\\s*\\*?\\*?${letter}[\\.\\):\\s]\\*?\\*?\\s*(.+?)(?=\\n\\s*\\*?\\*?[A-D][\\.\\):\\s]|$)`,
      "s",
    );

    const match = fullContent.match(optionPattern);
    if (match && match[1]) {
      // Clean up the text - remove extra asterisks and trim
      let optionText = match[1].trim();
      optionText = optionText.replace(/\*\*/g, ""); // Remove markdown bold
      optionText = optionText.replace(/\n/g, " "); // Replace newlines with spaces
      optionText = optionText.trim();

      const fullText = optionText;

      // Create truncated version for display (first 80 characters)
      let shortText = optionText;
      if (optionText.length > 80) {
        shortText = optionText.substring(0, 80) + "...";
      }

      return { short: shortText, full: fullText };
    }

    return { short: `Option ${letter}`, full: `Option ${letter}` };
  };

  return (
    <div className="lab-container">
      <div className="ambient-background">
        <div className="floating-orb orb-1"></div>
        <div className="floating-orb orb-2"></div>
        <div className="floating-orb orb-3"></div>
      </div>

      <div className="main-interface">
        <header className="hero-section">
          <h1 className="logo">
            NEURAL<span>LAB</span>
          </h1>
          <p className="tagline">
            Elevate Your Mind Through Interactive Challenges
          </p>
          <div className="input-container">
            <input
              className="lab-input-field"
              placeholder="Enter your subject to begin the journey..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="input-underline"></div>
          </div>
        </header>

        <nav className="type-nav">
          {challengeTypes.map((t) => (
            <button
              key={t.id}
              className={`nav-pill ${activeType === t.id ? "active" : ""}`}
              onClick={() => generateChallenge(t)}
              style={{ "--accent": t.color }}
              disabled={!topic || loading}
            >
              <span className="pill-icon">{t.icon}</span>
              <span className="pill-text">{t.label}</span>
              <span className="pill-shimmer"></span>
            </button>
          ))}
        </nav>

        <section className="canvas-area">
          {loading ? (
            <div className="loader-container">
              <div className="neural-loader">
                <div className="loader-core">
                  <div className="pulse-ring pulse-ring-1"></div>
                  <div className="pulse-ring pulse-ring-2"></div>
                  <div className="pulse-ring pulse-ring-3"></div>
                  <div className="loader-center"></div>
                </div>
                <p className="loader-text">
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0s" }}
                  >
                    A
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.1s" }}
                  >
                    N
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.2s" }}
                  >
                    A
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.3s" }}
                  >
                    L
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.4s" }}
                  >
                    Y
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.5s" }}
                  >
                    Z
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.6s" }}
                  >
                    I
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.7s" }}
                  >
                    N
                  </span>
                  <span
                    className="loader-letter"
                    style={{ animationDelay: "0.8s" }}
                  >
                    G
                  </span>
                  <span
                    className="loader-dot"
                    style={{ animationDelay: "0.9s" }}
                  >
                    .
                  </span>
                  <span
                    className="loader-dot"
                    style={{ animationDelay: "1.0s" }}
                  >
                    .
                  </span>
                  <span
                    className="loader-dot"
                    style={{ animationDelay: "1.1s" }}
                  >
                    .
                  </span>
                </p>
              </div>
            </div>
          ) : content ? (
            <div className="interaction-card animate-fade-up">
              {!feedback ? (
                <div className="quest-layout">
                  <div className="question-section">
                    <div className="question-header">
                      <span
                        className="challenge-badge"
                        style={{
                          background: challengeTypes.find(
                            (t) => t.id === activeType,
                          )?.color,
                        }}
                      >
                        {challengeTypes.find((t) => t.id === activeType)?.icon}
                      </span>
                      <span className="challenge-type">
                        {challengeTypes.find((t) => t.id === activeType)?.label}
                      </span>
                    </div>
                    <div className="question-block">
                      <ReactMarkdown>{getQuestionText(content)}</ReactMarkdown>
                    </div>
                  </div>

                  {activeType !== "fact" && (
                    <div className="options-section">
                      <h3 className="options-title">Select Your Answer</h3>
                      <div className="options-grid">
                        {["A", "B", "C", activeType === "quiz" ? "D" : null]
                          .filter(Boolean)
                          .map((l, idx) => {
                            const optionData = getOptionText(content, l);
                            const hasMoreText =
                              optionData.short !== optionData.full;

                            return (
                              <button
                                key={l}
                                className="option-card"
                                onClick={() => verifyAnswer(l)}
                                style={{ animationDelay: `${idx * 0.1}s` }}
                              >
                                <div className="option-letter">{l}</div>
                                <div className="option-label">
                                  <span className="option-text">
                                    {optionData.short}
                                  </span>
                                  {hasMoreText && (
                                    <span className="option-more-indicator">
                                      hover for more
                                    </span>
                                  )}
                                </div>
                                <div className="option-arrow">→</div>
                                <div className="option-glow"></div>
                                {hasMoreText && (
                                  <div className="option-tooltip">
                                    {optionData.full}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="feedback-layout">
                  <div className="verdict-section">
                    <div
                      className={`verdict-ribbon ${!feedback.toUpperCase().includes("INCORRECT") ? "success" : "error"}`}
                    >
                      <span className="verdict-icon">
                        {!feedback.toUpperCase().includes("INCORRECT")
                          ? "✓"
                          : "✗"}
                      </span>
                      <span className="verdict-text">
                        {!feedback.toUpperCase().includes("INCORRECT")
                          ? "CORRECT ANSWER"
                          : "INCORRECT ANSWER"}
                      </span>
                    </div>
                  </div>
                  <div className="explanation-section">
                    <h3 className="explanation-title">Explanation</h3>
                    <div className="explanation-content">
                      <ReactMarkdown>{feedback}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="action-buttons">
                    <button
                      className="reset-action"
                      onClick={() =>
                        generateChallenge(
                          challengeTypes.find((t) => t.id === activeType),
                        )
                      }
                    >
                      <span className="button-icon">↻</span>
                      <span>Next Challenge</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <h2 className="empty-title">Ready to Challenge Your Mind?</h2>
              <p className="empty-description">
                Enter a subject above and select a challenge type to begin your
                learning journey
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MicroChallenges;
