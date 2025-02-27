"use client";

import * as React from "react";
import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        padding: "2rem",
        textAlign: "center",
        marginTop: "64px",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          color: "#111827",
        }}
      >
        Welcome to Job Search Agent
      </h1>

      <p
        style={{
          fontSize: "1.25rem",
          color: "#4B5563",
          marginBottom: "2.5rem",
          maxWidth: "600px",
        }}
      >
        Your personal assistant for finding the perfect job opportunity.
      </p>

      <div style={{ display: "flex", gap: "1rem" }}>
        <Link
          href="/login"
          style={{
            backgroundColor: "#4F46E5",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            fontWeight: "500",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "opacity 0.2s",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Sign In
        </Link>
        <Link
          href="/register"
          style={{
            backgroundColor: "white",
            color: "#4F46E5",
            border: "1px solid #4F46E5",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            fontWeight: "500",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "opacity 0.2s",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Create Account
        </Link>
      </div>
    </div>
  );
}
