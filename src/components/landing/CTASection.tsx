import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const CTASection = () => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Animated orbs */}
      <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] rounded-full bg-accent/15 blur-[100px] animate-pulse-slow" />
      <div className="absolute bottom-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-violet-500/10 blur-[80px] animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <div
        ref={ref}
        className={`container mx-auto px-4 relative z-10 transition-all duration-1000 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-6">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Get Started Today</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-primary-foreground mb-6 leading-tight">
            Ready to Transform Your{" "}
            <span className="text-accent">Institution?</span>
          </h2>

          <p className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of Higher Education Institutions already using AcademiX to verify, document,
            and showcase student achievements with AI-powered precision.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button variant="hero" size="xl" className="group text-base px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="hero-outline" size="xl" className="text-base px-8">
              Schedule Demo
            </Button>
          </div>

          <p className="mt-6 text-sm text-primary-foreground/50">
            No credit card required · NAAC & NIRF compliant · Set up in minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
