import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Man Education - Education Planner System"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f11 0%, #13111c 50%, #0d0d16 100%)",
          padding: "80px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Background accent circles */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -150,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: 200,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
          }}
        />

        {/* Grid lines decorative */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            marginBottom: 32,
            boxShadow: "0 0 40px rgba(124,58,237,0.4)",
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>

        {/* App name */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            letterSpacing: "-2px",
            marginBottom: 16,
          }}
        >
          Man Education
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(167,139,250,0.9)",
            fontWeight: 500,
            marginBottom: 48,
          }}
        >
          Education Planner System
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 12 }}>
          {["📋 Task Manager", "📁 File Manager", "📅 Jadwal Kuliah"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 18px",
                borderRadius: 50,
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "rgba(196,181,253,0.9)",
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
