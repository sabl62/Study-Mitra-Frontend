import React, { useState } from "react";
import api from "../services/api";
import "./ExamPrep.css";
import ReactMarkdown from "react-markdown";
const ExamPrep = () => {
  const [formData, setFormData] = useState({
    difficulty: "Intermediate",
    gradeLevel: "",
    subject: "",
    topic: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [solvingId, setSolvingId] = useState(null);

  // Modal States
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [isDefining, setIsDefining] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchExamMaterials = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/exam-prep/", formData);
      setResult(response.data);
    } catch (error) {
      console.error("Error fetching materials:", error);
      alert("Failed to generate prep materials.");
    } finally {
      setLoading(false);
    }
  };

  const solveQuestion = async (questionText, index) => {
    setSolvingId(index);
    try {
      const response = await api.post("/exam-prep/solve/", {
        question: questionText,
      });
      const updatedQuestions = [...result.questions];
      updatedQuestions[index].solution = response.data.answer;
      setResult({ ...result, questions: updatedQuestions });
    } catch (error) {
      alert("AI could not solve this at the moment.");
    } finally {
      setSolvingId(null);
    }
  };

  /**
   * Fetches a definition for a specific concept using the solve endpoint
   */
  const handleConceptClick = async (conceptName) => {
    setSelectedConcept({ name: conceptName, definition: null });
    setIsDefining(true);

    try {
      const response = await api.post("/exam-prep/solve/", {
        question: `Explain the concept of "${conceptName}" in the context of ${formData.subject} for a ${formData.gradeLevel} student. Keep it concise but informative.`,
      });
      setSelectedConcept({
        name: conceptName,
        definition: response.data.answer,
      });
    } catch (error) {
      setSelectedConcept({
        name: conceptName,
        definition:
          "Sorry, I couldn't fetch a definition for this concept right now.",
      });
    } finally {
      setIsDefining(false);
    }
  };

  const closeOutcomeModal = () => {
    setSelectedConcept(null);
    setIsDefining(false);
  };

  return (
    <div className="exam-prep-container">
      <header className="prep-header">
        <h1>Exam Preparation Master/ AI mentor</h1>
        <p>Click on Key Concepts to see their definitions.</p>
      </header>

      <form onSubmit={fetchExamMaterials} className="prep-form card-glass">
        <div className="form-grid">
          <div className="input-group">
            <label>Subject</label>
            <input
              name="subject"
              placeholder="e.g. Physics"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="input-group">
            <label>Topic</label>
            <input
              name="topic"
              placeholder="e.g. Thermodynamics"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="input-group">
            <label>Grade Level</label>
            <input
              name="gradeLevel"
              placeholder="e.g. Grade 12"
              required
              onChange={handleInputChange}
            />
          </div>
          <div className="input-group">
            <label>Difficulty</label>
            <select name="difficulty" onChange={handleInputChange}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>
        <div className="input-group">
          <label>Additional Remarks/Questions</label>
          <textarea
            name="remarks"
            className="remarks-box"
            placeholder="Any specific areas you want the AI to focus on?"
            onChange={handleInputChange}
          />
        </div>
        <button type="submit" className="generate-btn" disabled={loading}>
          {loading ? "Generating Study Plan..." : "Generate Prep Material"}
        </button>
      </form>

      {result && (
        <div className="prep-results">
          <section className="concepts-section">
            <h3>🔑 Key Concepts</h3>
            <div className="concepts-grid">
              {result.keyConcepts.map((concept, i) => (
                <div
                  key={i}
                  className="concept-card clickable-card"
                  onClick={() => handleConceptClick(concept)}
                >
                  {concept}
                  <span className="tap-hint">Define</span>
                </div>
              ))}
            </div>
          </section>

          <section className="questions-section">
            <h3>📝 Important Questions</h3>
            {result.questions.map((q, i) => (
              <div key={i} className="question-item card-glass">
                <p className="question-text">
                  <strong>Q{i + 1}:</strong> {q.text}
                </p>
                {q.solution ? (
                  <div className="solution-box">
                    <strong>AI Solution:</strong>
                    <div className="markdown-content">
                      <ReactMarkdown>{q.solution}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <button
                    className="solve-btn"
                    onClick={() => solveQuestion(q.text, i)}
                    disabled={solvingId === i}
                  >
                    {solvingId === i ? "Thinking..." : "Solve with AI"}
                  </button>
                )}
              </div>
            ))}
          </section>
        </div>
      )}

      {/* CONCEPT MODAL */}
      {selectedConcept && (
        <div className="modal-overlay" onClick={closeOutcomeModal}>
          <div
            className="modal-content card-glass"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeOutcomeModal}>
              &times;
            </button>
            <h2 className="modal-title">{selectedConcept.name}</h2>
            <div className="modal-body">
              {isDefining ? (
                <div className="loading-spinner">
                  Consulting the AI tutor...
                </div>
              ) : (
                <div className="markdown-content definition-text">
                  <ReactMarkdown>{selectedConcept.definition}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPrep;
