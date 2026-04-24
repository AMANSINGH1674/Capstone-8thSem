import {
  Upload,
  Brain,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  Zap,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const VerificationFlow = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: outcomesRef, isVisible: outcomesVisible } = useScrollReveal();

  const steps = [
    {
      icon: Upload,
      step: "01",
      title: "Student Submits",
      description:
        "Student logs activity details — title, category, date, organising institution — and uploads a supporting document (certificate, screenshot, or letter).",
      badge: "Instant",
      badgeColor: "bg-accent/10 text-accent border-accent/20",
    },
    {
      icon: Brain,
      step: "02",
      title: "AI Analyses Document",
      description:
        "Claude Vision AI examines the uploaded document: checks authenticity, matches student name, date, and activity type to the submitted details.",
      badge: "< 10 seconds",
      badgeColor: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-700",
    },
    {
      icon: ShieldCheck,
      step: "03",
      title: "Confidence Routing",
      description:
        "≥ 85% confidence → Auto-Verified instantly. 50–84% → Flagged for faculty spot-check. < 50% → Rejected with AI reasoning.",
      badge: "Automated",
      badgeColor: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
    },
    {
      icon: FileCheck,
      step: "04",
      title: "Added to Portfolio",
      description:
        "Verified records are added to the student's digital portfolio with a tamper-evident verification badge and shareable public link.",
      badge: "Instant",
      badgeColor: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700",
    },
  ];

  const outcomes = [
    {
      icon: ShieldCheck,
      label: "Auto-Verified",
      sub: "AI ≥ 85%",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    },
    {
      icon: AlertTriangle,
      label: "Needs Review",
      sub: "AI 50–84%",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
    },
    {
      icon: XCircle,
      label: "Rejected",
      sub: "AI < 50%",
      color: "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    },
    {
      icon: Zap,
      label: "Manual Override",
      sub: "Faculty action",
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Decorative line */}
      <div className="absolute left-1/2 top-0 w-px h-24 bg-gradient-to-b from-transparent to-border" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Brain className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">AI-Powered Verification Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            From Submission to{" "}
            <span className="text-gradient">Verified Record</span>{" "}
            in Seconds
          </h2>
          <p className="text-lg text-muted-foreground">
            Claude Vision AI analyses each uploaded document for authenticity, category match, and identity
            — eliminating manual workload for faculty while maintaining institutional trust.
          </p>
        </div>

        {/* Flow Steps */}
        <div className="relative mb-12">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-[52px] left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-accent via-violet-500 to-emerald-500 opacity-30" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => {
              const StepCard = () => {
                const { ref, isVisible } = useScrollReveal();
                return (
                  <div
                    ref={ref}
                    className={`relative transition-all duration-600 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    }`}
                    style={{ transitionDelay: `${index * 150}ms` }}
                  >
                    <div className="relative p-6 rounded-2xl border bg-card border-accent/30 shadow-sm hover:shadow-lg hover:border-accent/60 hover:-translate-y-1 transition-all duration-300 group h-full">
                      {/* Step number */}
                      <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-full bg-[#0D1B3A] text-[10px] font-bold text-white tracking-wider">
                        STEP {step.step}
                      </div>

                      {/* Icon */}
                      <div className="inline-flex p-3 rounded-xl bg-accent/10 mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                        <step.icon className="h-6 w-6 text-accent" />
                      </div>

                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                        {step.description}
                      </p>

                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${step.badgeColor}`}
                      >
                        {step.badge}
                      </span>
                    </div>

                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex absolute top-[52px] -right-3 z-10 h-6 w-6 items-center justify-center rounded-full bg-background border border-border shadow-sm">
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              };
              return <StepCard key={step.title} />;
            })}
          </div>
        </div>

        {/* Outcome states */}
        <div
          ref={outcomesRef}
          className={`max-w-2xl mx-auto transition-all duration-700 ${
            outcomesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-center text-sm font-medium text-muted-foreground mb-4">
            Possible AI Outcomes
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {outcomes.map(({ icon: Icon, label, sub, color }, index) => (
              <div
                key={label}
                className={`rounded-xl border p-3 text-center hover:scale-105 transition-all duration-300 ${color} ${
                  outcomesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${200 + index * 80}ms` }}
              >
                <Icon className="h-5 w-5 mx-auto mb-1.5" />
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-[11px] opacity-75 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VerificationFlow;
