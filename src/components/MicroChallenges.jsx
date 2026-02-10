import React, { useState, useCallback, useMemo } from "react";
import api from "../services/api";
import ReactMarkdown from "react-markdown";
import "./MicroChallenges.css";

const MicroChallenges = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [activeType, setActiveType] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [previousQuestions, setPreviousQuestions] = useState([]);

  const challengeTypes = useMemo(
    () => [
      { id: "quiz", label: "Knowledge Quiz", icon: "🧠", color: "#38bdf8" },
      { id: "iq", label: "Logic Puzzle", icon: "🧩", color: "#a29bfe" },
      { id: "fact", label: "Mind Blow", icon: "✨", color: "#64ffda" },
    ],
    [],
  );

  const generateChallenge = useCallback(
    async (type) => {
      if (!topic || loading) return;

      setLoading(true);
      setActiveType(type.id);
      setFeedback(null);
      setContent("");

      const prompts = {
        quiz: `Subject: ${topic}. Create a unique, complex multiple-choice question. ${previousQuestions.length > 0 ? `Avoid these topics: ${previousQuestions.join(", ")}. ` : ""}Format: **Question** on first line(s), then options A, B, C, D each on separate lines starting with the letter (e.g., "A. Option text").`,
        iq: `Subject: ${topic}. Create a unique logic puzzle or riddle. ${previousQuestions.length > 0 ? `Avoid these topics: ${previousQuestions.join(", ")}. ` : ""}Format: **Puzzle text** on first line(s), then options A, B, C each on separate lines starting with the letter (e.g., "A. Option text").`,
        fact: `Subject: ${topic}. Share one fascinating, mind-blowing fact with a **Bold Title** and a 2-3 sentence explanation. Make it unique and interesting.`,
      };

      try {
        const res = await api.post("/exam-prep/solve/", {
          question: prompts[type.id],
        });

        const newContent = res.data.answer || res.data.content;
        setContent(newContent);

        // Track question to avoid repetition (store first 50 chars as identifier)
        if (type.id !== "fact") {
          setPreviousQuestions((prev) => {
            const identifier = newContent.substring(0, 50);
            const updated = [...prev, identifier];
            // Keep only last 5 questions to avoid memory bloat
            return updated.slice(-5);
          });
        }
      } catch (e) {
        setContent("⚠️ Neural link failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [topic, loading, previousQuestions],
  );

  const verifyAnswer = useCallback(
    async (choice) => {
      if (loading) return;

      setLoading(true);
      try {
        const res = await api.post("/exam-prep/solve/", {
          question: `
              You are an answer validator.

              Return your response in EXACTLY this format:

              VERDICT: CORRECT or INCORRECT

              CORRECT ANSWER: [The correct option letter, e.g., A] with a short and sweet explanation (1-2 sentences).

              EXPLANATION:
              - Line 1 explanation
              - Line 2 explanation
              - Line 3 explanation (if needed)

              Rules:
              - Each point MUST be on a new line
              - Use short sentences
              - Max 4 lines
              -Include bold texts where relevant
              
              Rules:
              - Decide the correct option first.
              - Do NOT change your verdict later.
              - Do NOT include both words CORRECT and INCORRECT anywhere.
              - Do NOT explain your reasoning process.
              - Only explain the final result.

              Question and options:
              ${content}

              User selected option: ${choice}
            `,
        });
        setFeedback(res.data.answer || res.data.content);
      } catch (e) {
        setFeedback("⚠️ Unable to verify answer. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [content, loading],
  );

  // Optimized text extraction with memoization
  const parsedContent = useMemo(() => {
    if (!content) return { question: "", options: {} };

    // Extract question (everything before first option)
    const optionPattern = /\n\s*\*?\*?[A-D][\.\):\s]/;
    const match = content.search(optionPattern);
    const question =
      match !== -1 ? content.substring(0, match).trim() : content;

    // Extract all options
    const options = {};
    const letters =
      activeType === "quiz" ? ["A", "B", "C", "D"] : ["A", "B", "C"];

    letters.forEach((letter) => {
      const regex = new RegExp(
        `\\n\\s*\\*?\\*?${letter}[\\.\\):\\s]\\*?\\*?\\s*(.+?)(?=\\n\\s*\\*?\\*?[A-D][\\.\\):\\s]|$)`,
        "s",
      );
      const optionMatch = content.match(regex);

      if (optionMatch && optionMatch[1]) {
        let text = optionMatch[1]
          .trim()
          .replace(/\*\*/g, "")
          .replace(/\n/g, " ")
          .trim();

        options[letter] = {
          full: text,
          short: text.length > 80 ? text.substring(0, 80) + "..." : text,
        };
      } else {
        options[letter] = {
          full: `Option ${letter}`,
          short: `Option ${letter}`,
        };
      }
    });

    return { question, options };
  }, [content, activeType]);

  const currentChallengeType = useMemo(
    () => challengeTypes.find((t) => t.id === activeType),
    [activeType, challengeTypes],
  );

const isCorrectAnswer = useMemo(() => {
  if (!feedback) return null;
  return feedback.startsWith("VERDICT: CORRECT");
}, [feedback]);

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
              disabled={loading}
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
              aria-label={`Generate ${t.label}`}
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
                  {"ANALYZING...".split("").map((char, i) => (
                    <span
                      key={i}
                      className={char === "." ? "loader-dot" : "loader-letter"}
                      style={{ animationDelay: `${i * 0.1}s` }}
                    >
                      {char}
                    </span>
                  ))}
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
                          background: currentChallengeType?.color,
                        }}
                      >
                        {currentChallengeType?.icon}
                      </span>
                      <span className="challenge-type">
                        {currentChallengeType?.label}
                      </span>
                    </div>
                    <div className="question-block">
                      <ReactMarkdown>{parsedContent.question}</ReactMarkdown>
                    </div>
                  </div>

                  {activeType !== "fact" && (
                    <div className="options-section">
                      <h3 className="options-title">Select Your Answer</h3>
                      <div className="options-grid">
                        {Object.entries(parsedContent.options).map(
                          ([letter, optionData], idx) => {
                            const hasMoreText =
                              optionData.short !== optionData.full;

                            return (
                              <button
                                key={letter}
                                className="option-card"
                                onClick={() => verifyAnswer(letter)}
                                style={{ animationDelay: `${idx * 0.1}s` }}
                                aria-label={`Select option ${letter}`}
                              >
                                <div className="option-letter">{letter}</div>
                                <div className="option-label">
                                  <span className="option-text">
                                    {optionData.short}
                                  </span>
                                  {hasMoreText && (
                                    <span className="option-more-indicator">
                                      hover for full text
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
                          },
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="feedback-layout">
                  <div className="verdict-section">
                    <div
                      className={`verdict-ribbon ${isCorrectAnswer ? "verdict-success" : "verdict-error"}`}
                    >
                      <span className="verdict-icon">
                        {isCorrectAnswer ? "✓" : "✗"}
                      </span>
                      <span className="verdict-text">
                        {isCorrectAnswer ? "CORRECT" : "INCORRECT"}
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
                      onClick={() => generateChallenge(currentChallengeType)}
                      disabled={loading}
                      aria-label="Generate next challenge"
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
