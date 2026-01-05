import { useEffect, useRef, useState } from "react";
import styles from "@/styles/voice.module.css";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceTool() {
  const recognitionRef = useRef<any>(null);

  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Create SpeechRecognition ONCE
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    // Desktop vs Mobile behavior
    recognition.continuous = !isMobile;
    recognition.interimResults = !isMobile;

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalChunk += transcript + " ";
        } else if (!isMobile) {
          interimChunk += transcript;
        }
      }

      if (finalChunk) {
        setFinalText((prev) => prev + finalChunk);
      }

      if (!isMobile) {
        setInterimText(interimChunk);
      }
    };

    // IMPORTANT: Mobile restart logic
    recognition.onend = () => {
      if (listening && isMobile) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
  }, [isMobile, listening]);

  const startMic = () => {
    setFinalText("");
    setInterimText("");
    recognitionRef.current.start();
    setListening(true);
  };

  const stopMic = () => {
    recognitionRef.current.stop();
    setListening(false);
    setInterimText("");
  };

  const copyText = () => {
    navigator.clipboard.writeText(finalText);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>🎙️ Voice Notes</h1>
        <p>Speak naturally. Text appears live.</p>
      </header>

      <div className={styles.card}>
        {!listening ? (
          <button className={styles.micButton} onClick={startMic}>
            🎤 Start speaking
          </button>
        ) : (
          <button
            className={`${styles.micButton} ${styles.listening}`}
            onClick={stopMic}
          >
            ⏹ Stop
          </button>
        )}

        <div className={styles.status}>
          {listening ? "Listening…" : "Click start to speak"}
        </div>
      </div>

      <div className={styles.editor}>
        <div className={styles.editorHeader}>
          <span>Transcript</span>
          <button onClick={copyText}>Copy</button>
        </div>

        <textarea
          className={styles.textarea}
          value={finalText + interimText}
          onChange={(e) => setFinalText(e.target.value)}
          placeholder="Your speech will appear here…"
        />
      </div>

      <footer className={styles.footer}>
        Internal tool • Real-time speech-to-text
      </footer>
    </div>
  );
}
