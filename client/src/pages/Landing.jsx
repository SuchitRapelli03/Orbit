import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("orbit_token");

    const timer = setTimeout(() => {
      navigate(token ? "/dashboard" : "/login", {
        replace: true,
      });
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070A12] text-white">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4DA3FF]/[0.035] blur-[110px]" />

        <div className="absolute left-[20%] top-[25%] h-1 w-1 rounded-full bg-white/60 shadow-[0_0_12px_rgba(255,255,255,0.5)] animate-pulse" />

        <div
          className="absolute left-[76%] top-[31%] h-1.5 w-1.5 rounded-full bg-[#F6C667]/50"
          style={{
            boxShadow: "0 0 14px rgba(246,198,103,0.35)",
          }}
        />

        <div className="absolute left-[27%] top-[73%] h-1 w-1 rounded-full bg-[#8B7CFF]/60" />

        <div className="absolute left-[82%] top-[76%] h-1 w-1 rounded-full bg-white/30" />

        <div className="absolute left-[11%] top-[47%] h-0.5 w-0.5 rounded-full bg-white/50" />

        <div className="absolute left-[91%] top-[56%] h-0.5 w-0.5 rounded-full bg-[#4DA3FF]/70" />
      </div>

      {/* Main Orbit system */}
      <div className="relative flex h-[360px] w-[360px] items-center justify-center">
        {/* Outer orbital ring */}
        <div
          className="absolute h-[330px] w-[330px] rounded-full border border-[#4DA3FF]/10"
          style={{
            transform: "rotateX(65deg) rotateZ(-15deg)",
          }}
        />

        {/* Outer animated orbit */}
        <div
          className="orbit-ring absolute h-[290px] w-[290px] rounded-full border border-[#8B7CFF]/20"
          style={{
            transform: "rotateX(67deg) rotateZ(22deg)",
          }}
        >
          <span className="orbit-dot orbit-dot-purple" />
        </div>

        {/* Middle orbit */}
        <div
          className="orbit-ring-reverse absolute h-[220px] w-[220px] rounded-full border border-[#4DA3FF]/20"
          style={{
            transform: "rotateX(65deg) rotateZ(-28deg)",
          }}
        >
          <span className="orbit-dot orbit-dot-blue" />
        </div>

        {/* Inner orbit */}
        <div
          className="orbit-ring-slow absolute h-[155px] w-[155px] rounded-full border border-[#F6C667]/15"
          style={{
            transform: "rotateX(68deg) rotateZ(12deg)",
          }}
        >
          <span className="orbit-dot orbit-dot-gold" />
        </div>

        {/* Central glow */}
        <div className="absolute h-32 w-32 rounded-full bg-[#4DA3FF]/[0.06] blur-2xl" />

        {/* Central star */}
        <div className="central-star relative flex h-[74px] w-[74px] items-center justify-center rounded-full border border-white/10 bg-[#0D1220] shadow-[0_0_50px_rgba(77,163,255,0.12)]">
          <div className="absolute h-8 w-8 rounded-full bg-[#8B7CFF]/20 blur-md" />

          <div className="relative h-3.5 w-3.5 rounded-full bg-[#F4F5F7] shadow-[0_0_20px_rgba(244,245,247,0.85)]" />
        </div>

        {/* Orbit wordmark */}
        <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 translate-y-[68px] flex-col items-center">
          <h1 className="orbit-logo text-[38px] font-semibold tracking-[0.18em] text-[#F4F5F7]">
            ORBIT
          </h1>

          <div className="orbit-tagline mt-2 whitespace-nowrap text-[9px] font-medium uppercase tracking-[0.28em] text-[#8B7CFF]/80">
            Where teams move work forward
          </div>
        </div>
      </div>

      {/* Small loading indicator */}
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2">
        <span className="h-1 w-1 rounded-full bg-[#8B7CFF] animate-pulse" />
        <span className="h-1 w-1 rounded-full bg-[#4DA3FF] animate-pulse [animation-delay:150ms]" />
        <span className="h-1 w-1 rounded-full bg-[#F6C667] animate-pulse [animation-delay:300ms]" />
      </div>

      {/* Animation styles */}
      <style>{`
        .central-star {
          opacity: 0;
          transform: scale(0.4);
          animation:
            starAppear 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards,
            starPulse 2s ease-in-out 0.9s infinite;
        }

        .orbit-ring {
          opacity: 0;
          animation:
            ringAppear 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.25s forwards,
            orbitClockwise 7s linear 0.9s infinite;
        }

        .orbit-ring-reverse {
          opacity: 0;
          animation:
            ringAppear 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s forwards,
            orbitCounter 5.5s linear 1s infinite;
        }

        .orbit-ring-slow {
          opacity: 0;
          animation:
            ringAppear 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.55s forwards,
            orbitClockwiseSlow 9s linear 1.1s infinite;
        }

        .orbit-dot {
          position: absolute;
          left: 50%;
          top: -4px;
          display: block;
          height: 7px;
          width: 7px;
          transform: translateX(-50%);
          border-radius: 9999px;
        }

        .orbit-dot-purple {
          background: #8B7CFF;
          box-shadow: 0 0 14px rgba(139,124,255,0.8);
        }

        .orbit-dot-blue {
          background: #4DA3FF;
          box-shadow: 0 0 14px rgba(77,163,255,0.8);
        }

        .orbit-dot-gold {
          background: #F6C667;
          box-shadow: 0 0 14px rgba(246,198,103,0.7);
        }

        .orbit-logo {
          opacity: 0;
          transform: translateY(8px);
          animation:
            logoAppear 0.65s cubic-bezier(0.22, 1, 0.36, 1) 1s forwards,
            logoFade 0.35s ease-in 2.45s forwards;
        }

        .orbit-tagline {
          opacity: 0;
          transform: translateY(5px);
          animation:
            taglineAppear 0.6s cubic-bezier(0.22, 1, 0.36, 1) 1.35s forwards,
            taglineFade 0.3s ease-in 2.5s forwards;
        }

        @keyframes starAppear {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }

          70% {
            opacity: 1;
            transform: scale(1.12);
          }

          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes starPulse {
          0%,
          100% {
            box-shadow: 0 0 50px rgba(77,163,255,0.12);
          }

          50% {
            box-shadow: 0 0 70px rgba(139,124,255,0.2);
          }
        }

        @keyframes ringAppear {
          from {
            opacity: 0;
            transform: scale(0.7);
          }

          to {
            opacity: 1;
          }
        }

        @keyframes orbitClockwise {
          from {
            transform: rotateX(67deg) rotateZ(22deg);
          }

          to {
            transform: rotateX(67deg) rotateZ(382deg);
          }
        }

        @keyframes orbitCounter {
          from {
            transform: rotateX(65deg) rotateZ(-28deg);
          }

          to {
            transform: rotateX(65deg) rotateZ(-388deg);
          }
        }

        @keyframes orbitClockwiseSlow {
          from {
            transform: rotateX(68deg) rotateZ(12deg);
          }

          to {
            transform: rotateX(68deg) rotateZ(372deg);
          }
        }

        @keyframes logoAppear {
          from {
            opacity: 0;
            transform: translateY(8px);
            letter-spacing: 0.32em;
          }

          to {
            opacity: 1;
            transform: translateY(0);
            letter-spacing: 0.18em;
          }
        }

        @keyframes taglineAppear {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes logoFade {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
          }
        }

        @keyframes taglineFade {
          from {
            opacity: 1;
          }

          to {
            opacity: 0;
          }
        }

        @media (max-width: 480px) {
          .orbit-ring {
            height: 250px;
            width: 250px;
          }

          .orbit-ring-reverse {
            height: 190px;
            width: 190px;
          }

          .orbit-ring-slow {
            height: 135px;
            width: 135px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-ring,
          .orbit-ring-reverse,
          .orbit-ring-slow,
          .central-star,
          .orbit-logo,
          .orbit-tagline {
            animation: none;
            opacity: 1;
            transform: none;
          }

          .orbit-logo {
            letter-spacing: 0.18em;
          }
        }
      `}</style>
    </main>
  );
}