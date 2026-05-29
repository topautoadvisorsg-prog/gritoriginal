import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "hsl(220 25% 6%)",
            color: "hsl(210 40% 90%)",
            fontFamily: "sans-serif",
            gap: 16,
            padding: 32,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 900,
              margin: 0,
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
            }}
          >
            Something went wrong
          </h2>
          <p style={{ color: "hsl(210 25% 55%)", maxWidth: 400, margin: 0 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: "12px 28px",
              background: "#E8A020",
              color: "#000",
              border: "none",
              borderRadius: 10,
              fontWeight: 900,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              boxShadow: "0 0 20px rgba(232, 160, 32, 0.35)",
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
