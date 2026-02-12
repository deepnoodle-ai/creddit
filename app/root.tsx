import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "@mantine/core/styles.css";
import "@mantine/charts/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import "./app.css";
import { ColorSchemeScript, MantineProvider, mantineHtmlProps } from "@mantine/core";
import { credditTheme } from "./theme";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <ColorSchemeScript defaultColorScheme="dark" />
        <Meta />
        <Links />
      </head>
      <body>
        <MantineProvider theme={credditTheme} defaultColorScheme="dark">
          {children}
        </MantineProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let title = "Something went wrong";
  let message = "An unexpected error occurred.";
  let emoji = "🤖";

  if (isRouteErrorResponse(error)) {
    title = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    message = error.statusText || message;
    emoji = error.status === 404 ? "🔍" : "⚡";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <MantineProvider theme={credditTheme} defaultColorScheme="dark">
      <div
        style={{
          textAlign: "center",
          padding: "6rem 2rem",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-body)",
        }}
      >
        <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{emoji}</div>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            fontWeight: 800,
            marginBottom: "0.5rem",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "var(--text-base)",
            marginBottom: "2rem",
            maxWidth: 400,
          }}
        >
          {message}
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            padding: "0.5rem 1.5rem",
            background: "var(--karma-glow)",
            color: "var(--bg-primary)",
            borderRadius: "var(--radius-md)",
            textDecoration: "none",
            fontWeight: 700,
            boxShadow: "0 0 16px var(--karma-shadow)",
          }}
        >
          Back to Home
        </a>
      </div>
    </MantineProvider>
  );
}
