"use client";

import { useState } from "react";

export default function AccountPage() {
  const [tab, setTab] = useState<"login" | "register">("login");

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: "600px" }}>
        <div className="section-header">
          <h1 className="section-title">My Account</h1>
          <p className="section-subtitle">Sign in to manage your orders and wishlist</p>
        </div>
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", justifyContent: "center" }}>
          <button className={`btn ${tab === "login" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("login")}>
            Login
          </button>
          <button className={`btn ${tab === "register" ? "btn-primary" : "btn-outline"}`} onClick={() => setTab("register")}>
            Register
          </button>
        </div>
        <div style={{ padding: "32px", border: "1px solid var(--color-gray-200)", borderRadius: "var(--radius-lg)" }}>
          {tab === "login" ? (
            <form style={{ display: "grid", gap: "16px" }}>
              <input placeholder="Email" type="email" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
              <input placeholder="Password" type="password" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
              <button type="submit" className="btn btn-primary">
                Sign In
              </button>
              <p style={{ textAlign: "center", color: "var(--color-gray-600)" }}>Demo account — authentication not implemented</p>
            </form>
          ) : (
            <form style={{ display: "grid", gap: "16px" }}>
              <input placeholder="Full Name" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
              <input placeholder="Email" type="email" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
              <input placeholder="Password" type="password" style={{ padding: "12px 14px", border: "1px solid var(--color-gray-300)", borderRadius: "var(--radius-md)" }} />
              <button type="submit" className="btn btn-primary">
                Create Account
              </button>
              <p style={{ textAlign: "center", color: "var(--color-gray-600)" }}>Demo account — authentication not implemented</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
