import { useEffect, useRef, useState } from "react";
import styles from "../styles/voice.module.css";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceTool() {
  const [listening, setListening] = useState(false);

  // IMPORTANT: separate states
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let newFinal = "";
      let newInterim = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          newFinal += transcript + " ";
        } else {
          newInterim += transcript;
        }
      }

      // ✅ Only append FINAL results permanently
      if (newFinal) {
        setFinalText((prev) => prev + newFinal);
      }

      // ✅ Interim text is temporary
      setInterimText(newInterim);
    };

    recognition.onend = () => {
      setListening(false);
      setInterimText("");
    };

    recognition.onerror = () => {
      setListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      setInterimText("");
    } else {
      setFinalText("");
      setInterimText("");
      recognitionRef.current.start();
      setListening(true);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎙️ Voice Notes</h1>
        <p>Speak naturally. Text appears live.</p>
      </header>

      <div className={styles.card}>
        <button
          className={`${styles.micButton} ${
            listening ? styles.listening : ""
          }`}
          onClick={toggleMic}
        >
          {listening ? "⏹ Stop" : "🎤 Start Speaking"}
        </button>

        <div className={styles.status}>
          {listening ? "Listening…" : "Click mic to start"}
        </div>
      </div>

      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <h3>Live Transcript</h3>
          <span className={styles.badge}>Editable</span>
        </div>

        {/* ✅ FINAL + INTERIM combined for display */}
        <textarea
          className={styles.textarea}
          value={finalText + interimText}
          onChange={(e) => setFinalText(e.target.value)}
          placeholder="Your speech will appear here..."
        />
      </div>

      <footer className={styles.footer}>
        Internal tool • Real-time speech-to-text
      </footer>
    </div>
  );
}
