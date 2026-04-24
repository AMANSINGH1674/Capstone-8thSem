import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { useScrollReveal, useCounter } from "@/hooks/useScrollReveal";

const InstitutionSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: cardsRef, isVisible: cardsVisible } = useScrollReveal();
  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();

  const timeSaved = useCounter(60, 1500, statsVisible);
  const auditReady = useCounter(100, 1800, statsVisible);

  const benefits = [
    "Automated report generation for NAAC, NIRF, AICTE audits",
    "Real-time analytics dashboard for administrators",
    "Seamless integration with existing LMS and ERP systems",
    "Centralized student data management across departments",
    "Reduced administrative workload by 60%",
    "Complete audit trail for all student activities",
  ];

  const accreditations = [
    { name: "NAAC", description: "National Assessment & Accreditation" },
    { name: "NIRF", description: "National Institutional Ranking" },
    { name: "AICTE", description: "All India Council for Technical Ed." },
  ];

  return (
    <section id="institutions" className="py-24 gradient-hero relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Animated glow orbs */}
      <div className="absolute top-[20%] right-[10%] w-[250px] h-[250px] rounded-full bg-accent/10 blur-[80px] animate-pulse-slow" />
      <div className="absolute bottom-[20%] left-[10%] w-[200px] h-[200px] rounded-full bg-violet-500/10 blur-[60px] animate-pulse-slow" style={{ animationDelay: "2s" }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div
            ref={headerRef}
            className={`transition-all duration-700 ${
              headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 mb-4">
              <Building2 className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">For Institutions</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Streamline{" "}
              <span className="text-accent">Accreditation</span>{" "}
              & Compliance
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Generate accreditation-ready reports instantly. Our platform maps student activities
              directly to NAAC, NIRF, and AICTE parameters, reducing audit preparation time
              dramatically.
            </p>

            {/* Benefits List */}
            <div className="space-y-3 mb-8">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    headerVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"
                  }`}
                  style={{ transitionDelay: `${300 + index * 80}ms` }}
                >
                  <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-primary-foreground/90">{benefit}</span>
                </div>
              ))}
            </div>

            <Button variant="hero" size="lg" className="group">
              Schedule Demo
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Accreditation Cards */}
          <div ref={cardsRef} className="space-y-4">
            {accreditations.map((acc, index) => (
              <div
                key={acc.name}
                className={`bg-card/10 backdrop-blur-sm border border-primary-foreground/10 rounded-xl p-6 hover:bg-card/20 hover:border-primary-foreground/20 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-lg ${
                  cardsVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-foreground mb-1">{acc.name}</h3>
                    <p className="text-primary-foreground/60 text-sm">{acc.description}</p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/20 text-success text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Ready
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-primary-foreground/70">
                    <span>Report Coverage</span>
                    <span>95%</span>
                  </div>
                  <div className="h-2 rounded-full bg-primary-foreground/10 overflow-hidden">
                    <div
                      className="h-full gradient-accent rounded-full transition-all duration-1500 ease-out"
                      style={{ width: cardsVisible ? "95%" : "0%" }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-4 mt-6">
              {[
                { value: `${timeSaved}%`, label: "Time Saved" },
                { value: `${auditReady}%`, label: "Audit Ready" },
                { value: "24/7", label: "Support" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`text-center p-4 rounded-xl bg-card/10 border border-primary-foreground/10 hover:bg-card/20 transition-all duration-500 ${
                    statsVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="text-2xl font-bold text-accent tabular-nums">{stat.value}</div>
                  <div className="text-xs text-primary-foreground/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InstitutionSection;