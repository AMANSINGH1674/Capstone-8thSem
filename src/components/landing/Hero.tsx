import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, BarChart3, Brain, Sparkles, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal, useCounter } from "@/hooks/useScrollReveal";

const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();

  const verificationTime = useCounter(10, 1500, statsVisible);
  const autoRate = useCounter(85, 1800, statsVisible);
  const portals = useCounter(3, 800, statsVisible);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Animated orbs with mouse parallax */}
      <div
        className="absolute top-[15%] right-[10%] w-[420px] h-[420px] rounded-full bg-accent/10 blur-[100px] animate-pulse-slow"
        style={{
          transform: `translate(${mousePos.x * 0.5}px, ${mousePos.y * 0.5}px)`,
          transition: "transform 0.3s ease-out",
        }}
      />
      <div
        className="absolute bottom-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[80px] animate-pulse-slow"
        style={{
          animationDelay: "2s",
          transform: `translate(${mousePos.x * -0.3}px, ${mousePos.y * -0.3}px)`,
          transition: "transform 0.3s ease-out",
        }}
      />
      <div
        className="absolute top-[60%] right-[40%] w-[200px] h-[200px] rounded-full bg-blue-500/8 blur-[60px] animate-pulse-slow"
        style={{
          animationDelay: "4s",
          transform: `translate(${mousePos.x * 0.2}px, ${mousePos.y * -0.4}px)`,
          transition: "transform 0.3s ease-out",
        }}
      />

      {/* Floating geometric shapes */}
      <div className="absolute top-[20%] left-[15%] w-4 h-4 border-2 border-accent/30 rotate-45 animate-float" />
      <div className="absolute top-[40%] right-[20%] w-3 h-3 bg-accent/20 rounded-full animate-float" style={{ animationDelay: "1s" }} />
      <div className="absolute bottom-[30%] left-[25%] w-5 h-5 border-2 border-violet-400/20 rounded-full animate-float" style={{ animationDelay: "3s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left — copy */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/25 mb-6 animate-fade-in">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide uppercase">
                AI-Powered Verification
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-primary-foreground leading-[1.1] mb-6 animate-slide-up">
              Student Achievements,{" "}
              <span className="text-gradient relative">
                Verified & Portfolio-Ready
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path
                    d="M2 8C50 2 100 4 150 6C200 8 250 4 298 8"
                    stroke="hsl(168 76% 42%)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="animate-draw-line"
                  />
                </svg>
              </span>
            </h1>

            <p
              className="text-lg text-primary-foreground/70 mb-8 leading-relaxed animate-slide-up"
              style={{ animationDelay: "0.08s" }}
            >
              AcademiX is a centralised digital platform for Higher Education Institutions to
              document, AI-verify, and showcase student co-curricular and extracurricular records —
              with NAAC/NIRF-ready reporting built in.
            </p>

            <div
              className="flex flex-wrap gap-4 mb-10 animate-slide-up"
              style={{ animationDelay: "0.16s" }}
            >
              <Link to="/login">
                <Button variant="hero" size="xl" className="group">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="hero-outline" size="xl">
                  Explore Features
                </Button>
              </a>
            </div>

            <div
              className="flex flex-wrap items-center gap-5 text-primary-foreground/60 text-sm animate-fade-in"
              style={{ animationDelay: "0.24s" }}
            >
              {[
                { icon: Shield, text: "NAAC Compliant" },
                { icon: BarChart3, text: "NIRF Ready" },
                { icon: Brain, text: "Claude AI Verified" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 group/badge">
                  <div className="p-1 rounded-md bg-accent/10 group-hover/badge:bg-accent/20 transition-colors">
                    <Icon className="h-4 w-4 text-accent" />
                  </div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating stats card */}
          <div
            ref={statsRef}
            className="hidden lg:block animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="relative mx-auto max-w-sm">
              <div className="absolute -inset-4 gradient-glow opacity-40 rounded-3xl blur-2xl animate-pulse-slow" />
              <div
                className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 space-y-6 shadow-2xl"
                style={{
                  transform: `perspective(1000px) rotateY(${mousePos.x * -0.05}deg) rotateX(${mousePos.y * 0.05}deg)`,
                  transition: "transform 0.3s ease-out",
                }}
              >
                <div className="text-center mb-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">
                    Platform Stats
                  </p>
                  <p className="text-primary-foreground/50 text-xs">Real-time metrics</p>
                </div>
                {[
                  { value: `${verificationTime}s`, label: "Avg. AI Verification Time", accent: true },
                  { value: `${autoRate}%+`, label: "Auto-Verification Rate", accent: false },
                  { value: "0-100", label: "Engagement Score Index", accent: true },
                  { value: `${portals}`, label: "Role-Based Portals", accent: false },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center justify-between py-3 border-b border-white/[0.06] last:border-0 group/stat hover:bg-white/5 rounded-lg px-2 transition-colors"
                  >
                    <span className="text-sm text-primary-foreground/60">{stat.label}</span>
                    <span
                      className={`text-lg font-bold tabular-nums ${
                        stat.accent ? "text-accent" : "text-primary-foreground"
                      }`}
                    >
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce-slow">
        <span className="text-xs text-primary-foreground/40 uppercase tracking-widest">Scroll</span>
        <ChevronDown className="h-5 w-5 text-primary-foreground/40" />
      </div>
    </section>
  );
};

export default Hero;
