import {
  Brain,
  BarChart3,
  Shield,
  Globe,
  TrendingUp,
  Copy,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const FeatureCard = ({
  feature,
  index,
}: {
  feature: {
    icon: any;
    title: string;
    description: string;
    color: string;
    bgColor: string;
    tag: string;
  };
  index: number;
}) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`group relative p-6 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${index * 70}ms` }}
    >
      {/* Novel tag */}
      {feature.tag === "Novel Contribution" && (
        <div className="absolute top-4 right-4 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 px-2 py-0.5 text-[10px] font-bold text-violet-700 dark:text-violet-300 uppercase tracking-wide">
          New
        </div>
      )}

      <div
        className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}
      >
        <feature.icon className={`h-6 w-6 ${feature.color}`} />
      </div>

      <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>

      <div className="absolute inset-0 rounded-2xl gradient-glow opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

const Features = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  const features = [
    {
      icon: Brain,
      title: "AI Auto-Verification",
      description:
        "Claude Vision AI analyses every uploaded document in under 10 seconds — checking authenticity, identity match, and category relevance — with a 0–100 confidence score.",
      color: "text-violet-600",
      bgColor: "bg-violet-100 dark:bg-violet-900/30",
      tag: "Novel Contribution",
    },
    {
      icon: TrendingUp,
      title: "Engagement Score Index",
      description:
        "A proprietary 0–100 weighted algorithm grades students on category diversity, verified volume, and participation rate — going beyond GPA to capture holistic development.",
      color: "text-accent",
      bgColor: "bg-accent/10",
      tag: "Novel Contribution",
    },
    {
      icon: BarChart3,
      title: "NAAC / NIRF Ready Reports",
      description:
        "One-click CSV exports formatted for NAAC and NIRF accreditation submissions — department-wise participation, verification rates, and student rankings.",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      tag: "Accreditation",
    },
    {
      icon: AlertTriangle,
      title: "Semantic Duplicate Detection",
      description:
        "Jaccard similarity analysis on record titles + date-proximity detection flags near-duplicate submissions before they enter the system — no manual triage needed.",
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
      tag: "Novel Contribution",
    },
    {
      icon: Copy,
      title: "Verifiable Digital Portfolio",
      description:
        "Each student receives a shareable public portfolio URL displaying only AI-verified records — ready for job applications, scholarships, and graduate admissions.",
      color: "text-emerald-600",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
      tag: "Student Benefit",
    },
    {
      icon: Bell,
      title: "Real-time Notifications",
      description:
        "Automatic in-app notifications triggered by PostgreSQL when verification status changes — students are notified of approvals and rejections without polling.",
      color: "text-rose-600",
      bgColor: "bg-rose-100 dark:bg-rose-900/30",
      tag: "System",
    },
    {
      icon: Shield,
      title: "Role-Based Access Control",
      description:
        "Three distinct portals — Student, Faculty, Administrator — with Row Level Security enforced at the database layer via PostgreSQL RLS policies.",
      color: "text-slate-600",
      bgColor: "bg-slate-100 dark:bg-slate-900/30",
      tag: "Security",
    },
    {
      icon: Globe,
      title: "NAAC · NIRF · AICTE Aligned",
      description:
        "Platform architecture and reporting formats designed specifically for Indian HEI accreditation bodies. Supports SDG 4 (Quality Education) and SDG 9 (Innovation).",
      color: "text-accent",
      bgColor: "bg-accent/10",
      tag: "Compliance",
    },
  ];

  return (
    <section id="features" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[10%] right-[-5%] w-[300px] h-[300px] rounded-full bg-accent/5 blur-[80px]" />
      <div className="absolute bottom-[10%] left-[-5%] w-[250px] h-[250px] rounded-full bg-violet-500/5 blur-[60px]" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <span className="text-sm font-medium text-accent">Platform Features</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Built Beyond{" "}
            <span className="text-gradient">Existing Systems</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            AcademiX introduces three novel technical contributions — AI verification, engagement
            scoring, and semantic duplicate detection — that no prior student activity platform
            provides.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
