import { useState, useEffect, useRef } from "react";

const SUBJECT_AREAS = [
  { id: "contracts", label: "Contracts", icon: "📋" },
  { id: "torts", label: "Torts", icon: "⚖️" },
  { id: "constitutional", label: "Constitutional Law", icon: "🏛️" },
  { id: "criminal", label: "Criminal Law", icon: "🔒" },
  { id: "property", label: "Property", icon: "🏠" },
  { id: "evidence", label: "Evidence", icon: "🔍" },
  { id: "civil_procedure", label: "Civil Procedure", icon: "📁" },
];

const SYSTEM_PROMPT = `You are a bar exam question generator for a U.S. law school. Generate exactly 1 multiple-choice bar exam question in the following JSON format with no extra text, no markdown fences, nothing else:

{
  "question": "A detailed fact pattern followed by a clear question.",
  "choices": {
    "A": "First answer choice",
    "B": "Second answer choice",
    "C": "Third answer choice",
    "D": "Fourth answer choice"
  },
  "correct": "A",
  "rationale": {
    "A": "Explanation of why A is correct or incorrect.",
    "B": "Explanation of why B is correct or incorrect.",
    "C": "Explanation of why C is correct or incorrect.",
    "D": "Explanation of why D is correct or incorrect."
  },
  "rule": "The key legal rule or doctrine tested by this question."
}

Guidelines:
- Write realistic MBE-style questions with detailed fact patterns
- Make all four choices plausible — avoid obviously wrong answers
- Each rationale should be 2-4 sentences explaining the legal reasoning
- The "rule" field should state the black-letter law in 1-2 sentences
- Vary difficulty: some straightforward, some with tricky distinctions`;

export default function BarExamQuestionBank() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [error, setError] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const questionRef = useRef(null);

  const fetchQuestion = async (subject) => {
    setLoading(true);
    setQuestion(null);
    setSelectedAnswer(null);
    setRevealed(false);
    setError(null);
    setAnimateIn(false);

    const subjectLabel = SUBJECT_AREAS.find((s) => s.id === subject)?.label || subject;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Generate a bar exam question for: ${subjectLabel}. Return only valid JSON.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const raw = data.content?.map((b) => b.text || "").join("").trim();
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuestion(parsed);
      setTimeout(() => setAnimateIn(true), 50);
    } catch (err) {
      setError("Failed to generate question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectSelect = (id) => {
    setSelectedSubject(id);
    fetchQuestion(id);
  };

  const handleAnswerSelect = (letter) => {
    if (revealed) return;
    setSelectedAnswer(letter);
  };

  const handleReveal = () => {
    if (!selectedAnswer) return;
    setRevealed(true);
    const isCorrect = selectedAnswer === question.correct;
    setScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const handleNext = () => {
    fetchQuestion(selectedSubject);
  };

  const handleReset = () => {
    setSelectedSubject(null);
    setQuestion(null);
    setSelectedAnswer(null);
    setRevealed(false);
    setScore({ correct: 0, total: 0 });
    setError(null);
  };

  const getChoiceStyle = (letter) => {
    const base = {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "14px 18px",
      marginBottom: "10px",
      border: "2px solid",
      borderRadius: "6px",
      cursor: revealed ? "default" : "pointer",
      transition: "all 0.2s ease",
      fontSize: "15px",
      lineHeight: "1.5",
      fontFamily: "'Libre Baskerville', Georgia, serif",
    };

    if (!revealed) {
      return {
        ...base,
        borderColor: selectedAnswer === letter ? "#1a3a5c" : "#d4c9b0",
        backgroundColor: selectedAnswer === letter ? "#eef2f7" : "#faf8f4",
        color: "#2c2415",
        fontWeight: selectedAnswer === letter ? "600" : "400",
      };
    }

    if (letter === question.correct) {
      return { ...base, borderColor: "#2d6a4f", backgroundColor: "#d8f3dc", color: "#1b4332", fontWeight: "600" };
    }
    if (letter === selectedAnswer && letter !== question.correct) {
      return { ...base, borderColor: "#c1440e", backgroundColor: "#fde8e0", color: "#7b2d14" };
    }
    return { ...base, borderColor: "#d4c9b0", backgroundColor: "#faf8f4", color: "#8a7a6a", opacity: 0.7 };
  };

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#1c1710",
      backgroundImage: "radial-gradient(ellipse at top, #2a2118 0%, #1c1710 60%)",
      fontFamily: "'Libre Baskerville', Georgia, serif",
      color: "#e8dfc8",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .subject-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(212,180,100,0.25) !important; }
        .answer-btn:hover:not([disabled]) { transform: translateX(4px); }
        .fade-in { animation: fadeSlideIn 0.4s ease forwards; }
        @keyframes fadeSlideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .pulse { animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .rationale-item { border-left: 3px solid; padding: 12px 16px; margin-bottom: 10px; border-radius: 0 6px 6px 0; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0d0b08 0%, #1a1510 100%)",
        borderBottom: "1px solid #3d3020",
        padding: "24px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "11px", letterSpacing: "4px", color: "#9a8060", textTransform: "uppercase", marginBottom: "4px" }}>
            Suffolk University Law School
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", fontWeight: "600", color: "#d4b464", letterSpacing: "0.5px" }}>
            Bar Exam Question Bank
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {score.total > 0 && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", color: "#9a8060", letterSpacing: "2px", textTransform: "uppercase" }}>Score</div>
              <div style={{ fontSize: "22px", fontFamily: "'Cormorant Garamond', serif", color: pct >= 70 ? "#7ec8a0" : "#e07a5f", fontWeight: "600" }}>
                {score.correct}/{score.total} <span style={{ fontSize: "14px", color: "#9a8060" }}>({pct}%)</span>
              </div>
            </div>
          )}
          {score.total > 0 && (
            <button onClick={handleReset} style={{
              background: "transparent", border: "1px solid #4a3c28", color: "#9a8060",
              padding: "8px 16px", borderRadius: "4px", cursor: "pointer", fontSize: "12px",
              letterSpacing: "1px", textTransform: "uppercase",
            }}>
              Reset
            </button>
          )}
        </div>
      </div>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Subject selector */}
        {!selectedSubject && (
          <div className="fade-in">
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#c4aa7a", marginBottom: "8px", fontWeight: "300", fontStyle: "italic" }}>
              Select a subject area to begin practice
            </p>
            <p style={{ fontSize: "13px", color: "#6a5a40", marginBottom: "36px", letterSpacing: "0.5px" }}>
              Questions are generated by AI in the style of the Multistate Bar Examination (MBE)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "14px" }}>
              {SUBJECT_AREAS.map((s) => (
                <button key={s.id} className="subject-btn" onClick={() => handleSubjectSelect(s.id)} style={{
                  background: "linear-gradient(135deg, #2a2015 0%, #221c10 100%)",
                  border: "1px solid #4a3c28",
                  color: "#d4b464",
                  padding: "20px 16px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "17px", fontWeight: "600" }}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div className="pulse" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#d4b464", marginBottom: "12px" }}>
              Generating question…
            </div>
            <div style={{ fontSize: "13px", color: "#6a5a40", letterSpacing: "1px" }}>
              {SUBJECT_AREAS.find(s => s.id === selectedSubject)?.icon} {SUBJECT_AREAS.find(s => s.id === selectedSubject)?.label}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: "#2a1010", border: "1px solid #7b2d14", borderRadius: "8px", padding: "20px", color: "#f4a69a" }}>
            {error}
            <button onClick={() => fetchQuestion(selectedSubject)} style={{ marginLeft: "16px", color: "#d4b464", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
              Try again
            </button>
          </div>
        )}

        {/* Question */}
        {question && !loading && (
          <div className={animateIn ? "fade-in" : ""}>
            {/* Subject pill + navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px" }}>{SUBJECT_AREAS.find(s => s.id === selectedSubject)?.icon}</span>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", letterSpacing: "2px",
                  color: "#9a8060", textTransform: "uppercase",
                }}>
                  {SUBJECT_AREAS.find(s => s.id === selectedSubject)?.label}
                </span>
              </div>
              <button onClick={handleReset} style={{
                background: "transparent", border: "none", color: "#6a5a40",
                fontSize: "12px", cursor: "pointer", letterSpacing: "1px", textTransform: "uppercase",
              }}>
                ← Change Subject
              </button>
            </div>

            {/* Rule banner */}
            <div style={{
              background: "linear-gradient(135deg, #1e1a0e 0%, #181410 100%)",
              border: "1px solid #4a3c28",
              borderLeft: "4px solid #d4b464",
              borderRadius: "0 6px 6px 0",
              padding: "12px 18px",
              marginBottom: "28px",
            }}>
              <span style={{ fontSize: "10px", color: "#9a8060", letterSpacing: "2px", textTransform: "uppercase" }}>Rule Tested · </span>
              <span style={{ fontSize: "14px", color: "#c4aa7a", fontStyle: "italic" }}>{question.rule}</span>
            </div>

            {/* Question text */}
            <div style={{
              background: "linear-gradient(135deg, #232016 0%, #1e1b12 100%)",
              border: "1px solid #3d3020",
              borderRadius: "8px",
              padding: "28px",
              marginBottom: "24px",
              lineHeight: "1.8",
              fontSize: "16px",
              color: "#e8dfc8",
            }}>
              {question.question}
            </div>

            {/* Choices */}
            <div style={{ marginBottom: "24px" }}>
              {Object.entries(question.choices).map(([letter, text]) => (
                <button
                  key={letter}
                  className="answer-btn"
                  disabled={revealed}
                  onClick={() => handleAnswerSelect(letter)}
                  style={getChoiceStyle(letter)}
                >
                  <span style={{ fontWeight: "700", marginRight: "12px", fontFamily: "'Cormorant Garamond', serif", fontSize: "17px" }}>
                    {letter}.
                  </span>
                  {text}
                  {revealed && letter === question.correct && (
                    <span style={{ marginLeft: "10px", color: "#2d6a4f" }}>✓</span>
                  )}
                  {revealed && letter === selectedAnswer && letter !== question.correct && (
                    <span style={{ marginLeft: "10px", color: "#c1440e" }}>✗</span>
                  )}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            {!revealed ? (
              <button
                onClick={handleReveal}
                disabled={!selectedAnswer}
                style={{
                  width: "100%",
                  padding: "16px",
                  background: selectedAnswer ? "linear-gradient(135deg, #c4a040 0%, #a8882a 100%)" : "#2a2015",
                  border: "none",
                  borderRadius: "6px",
                  color: selectedAnswer ? "#1c1710" : "#4a3c28",
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  cursor: selectedAnswer ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  fontFamily: "'Cormorant Garamond', serif",
                }}
              >
                {selectedAnswer ? "Reveal Answer & Rationale" : "Select an Answer"}
              </button>
            ) : (
              <>
                {/* Result banner */}
                <div style={{
                  textAlign: "center",
                  padding: "14px",
                  marginBottom: "24px",
                  borderRadius: "6px",
                  background: selectedAnswer === question.correct ? "linear-gradient(135deg, #1a3d2a 0%, #142d1f 100%)" : "linear-gradient(135deg, #3d1a14 0%, #2a100c 100%)",
                  border: `1px solid ${selectedAnswer === question.correct ? "#2d6a4f" : "#c1440e"}`,
                  color: selectedAnswer === question.correct ? "#7ec8a0" : "#f4a69a",
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "18px",
                  fontWeight: "600",
                }}>
                  {selectedAnswer === question.correct
                    ? "✓ Correct — Well reasoned."
                    : `✗ Incorrect — The correct answer is ${question.correct}.`}
                </div>

                {/* Rationale */}
                <div style={{
                  background: "linear-gradient(135deg, #1a1810 0%, #161410 100%)",
                  border: "1px solid #3d3020",
                  borderRadius: "8px",
                  padding: "24px",
                  marginBottom: "20px",
                }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "13px", letterSpacing: "3px", color: "#9a8060", textTransform: "uppercase", marginBottom: "18px" }}>
                    Analysis of Each Answer
                  </div>
                  {Object.entries(question.rationale).map(([letter, text]) => {
                    const isCorrect = letter === question.correct;
                    const isWrong = letter === selectedAnswer && !isCorrect;
                    return (
                      <div key={letter} className="rationale-item" style={{
                        borderColor: isCorrect ? "#2d6a4f" : isWrong ? "#c1440e" : "#3d3020",
                        background: isCorrect ? "rgba(45,106,79,0.1)" : isWrong ? "rgba(193,68,14,0.08)" : "transparent",
                      }}>
                        <div style={{ marginBottom: "4px" }}>
                          <span style={{
                            fontFamily: "'Cormorant Garamond', serif", fontWeight: "700", fontSize: "15px",
                            color: isCorrect ? "#7ec8a0" : isWrong ? "#f4a69a" : "#9a8060",
                            marginRight: "8px",
                          }}>
                            {letter}.
                          </span>
                          {isCorrect && <span style={{ fontSize: "11px", color: "#7ec8a0", letterSpacing: "1px" }}>CORRECT</span>}
                          {isWrong && <span style={{ fontSize: "11px", color: "#f4a69a", letterSpacing: "1px" }}>YOUR ANSWER</span>}
                        </div>
                        <div style={{ fontSize: "14px", color: "#c4b89a", lineHeight: "1.7" }}>{text}</div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={handleNext} style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(135deg, #c4a040 0%, #a8882a 100%)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#1c1710",
                  fontSize: "14px",
                  fontWeight: "700",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "'Cormorant Garamond', serif",
                }}>
                  Next Question →
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
