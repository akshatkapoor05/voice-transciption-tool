import { useState } from "react";
import VoiceTool from "../components/VoiceTool";

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  const unlock = (code: string) => {
    if (code === "internal123") {
      setUnlocked(true);
    } else {
      setError(true);
    }
  };

  if (!unlocked) {
    return (
      <div style={styles.gate}>
        <div style={styles.card}>
          <h2>🔒 Internal Access</h2>
          <p>Enter access code</p>
          <input
            type="password"
            placeholder="Access code"
            onChange={() => setError(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") unlock((e.target as HTMLInputElement).value);
            }}
            style={styles.input}
          />
          <button
            style={styles.button}
            onClick={() => {
              const input = document.querySelector("input") as HTMLInputElement;
              unlock(input.value);
            }}
          >
            Unlock
          </button>
          {error && <p style={{ color: "#f87171" }}>Wrong code</p>}
        </div>
      </div>
    );
  }

  return <VoiceTool />;
}

const styles = {
  gate: {
    minHeight: "100vh",
    background: "#020617",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e5e7eb",
  },
  card: {
    background: "#020617",
    padding: "32px",
    borderRadius: "16px",
    width: "320px",
    textAlign: "center" as const,
    border: "1px solid #334155",
  },
  input: {
    width: "100%",
    padding: "10px",
    margin: "12px 0",
    borderRadius: "8px",
    border: "1px solid #334155",
    background: "#020617",
    color: "white",
  },
  button: {
    width: "100%",
    padding: "10px",
    borderRadius: "8px",
    background: "#6366f1",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
};
