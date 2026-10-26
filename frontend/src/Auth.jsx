import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default function Auth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login";
      const response = await fetch(`${API}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        // Fallback if response isn't JSON
      }

      if (!response.ok) {
        const errorDetail =
          typeof data.detail === "string"
            ? data.detail
            : Array.isArray(data.detail)
            ? data.detail.map((d) => d.msg).join(", ")
            : "Request failed. Details check karo.";
        throw new Error(errorDetail);
      }

      if (isSignup) {
        setIsSignup(false);
        setPassword("");
        setError("Account ban gaya! Ab apne password se login karo.");
      } else {
        onLogin(data.access_token, data);
      }
    } catch (err) {
      if (err.name === "TypeError" && err.message.toLowerCase().includes("fetch")) {
        setError(`Backend server se connection nahi ho pa raha (${API}). Check karo backend chalu hai ya nahi.`);
      } else {
        setError(err.message || "Backend se connect nahi ho pa raha.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <form onSubmit={handleSubmit} style={styles.card}>
        <h1 style={styles.title}>JobTrack</h1>
        <p style={styles.subtitle}>
          {isSignup ? "Create your account" : "Welcome back"}
        </p>

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={isSignup ? 8 : 1}
          required
        />

        {error && <p style={styles.message}>{error}</p>}

        <button style={styles.button} type="submit" disabled={loading}>
          {loading ? "Please wait..." : isSignup ? "Create account" : "Login"}
        </button>

        <p style={styles.switchText}>
          {isSignup ? "Already have an account?" : "New to JobTrack?"}{" "}
          <button
            type="button"
            style={styles.link}
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
            }}
          >
            {isSignup ? "Login" : "Sign up"}
          </button>
        </p>
      </form>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    background: "#f3f6fc",
    fontFamily: "Arial, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    boxSizing: "border-box",
    padding: "32px",
    background: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(20, 40, 80, 0.08)",
  },
  title: { color: "#315bea", margin: "0 0 8px", fontSize: "30px" },
  subtitle: { color: "#64748b", marginBottom: "28px" },
  label: { display: "block", marginBottom: "8px", fontWeight: "600" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px",
    marginBottom: "20px",
    border: "1px solid #d6deeb",
    borderRadius: "8px",
    fontSize: "15px",
  },
  button: {
    width: "100%",
    padding: "13px",
    background: "#315bea",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "bold",
    cursor: "pointer",
  },
  message: { color: "#c62828", fontSize: "14px", overflowWrap: "anywhere" },
  switchText: { textAlign: "center", marginTop: "22px", color: "#64748b" },
  link: {
    background: "none",
    border: "none",
    color: "#315bea",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
