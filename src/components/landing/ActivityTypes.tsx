import {
  Award,
  BookOpen,
  Trophy,
  Heart,
  Briefcase,
  Users,
  GraduationCap,
  Mic,
} from "lucide-react";
import { useScrollReveal, useCounter } from "@/hooks/useScrollReveal";

const ActivityTypes = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: gridRef, isVisible: gridVisible } = useScrollReveal();
  const { ref: cardRef, isVisible: cardVisible } = useScrollReveal();

  const completeness = useCounter(92, 1500, cardVisible);

  const activities = [
    { icon: BookOpen, label: "Conferences & Workshops", count: "12K+" },
    { icon: Award, label: "Certifications", count: "45K+" },
    { icon: Users, label: "Club Activities", count: "8K+" },
    { icon: Trophy, label: "Competitions", count: "15K+" },
    { icon: GraduationCap, label: "Academic Excellence", count: "30K+" },
    { icon: Briefcase, label: "Internships", count: "22K+" },
    { icon: Heart, label: "Community Service", count: "10K+" },
    { icon: Mic, label: "Leadership Roles", count: "6K+" },
  ];

  return (
    <section id="students" className="py-24 bg-background relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)",
        backgroundSize: "48px 48px",
      }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <div
              ref={headerRef}
              className={`transition-all duration-700 ${
                headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
                <span className="text-sm font-medium text-accent">For Students</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Track Every{" "}
                <span className="text-gradient">Achievement</span>{" "}
                That Matters
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                From academic milestones to extracurricular accomplishments, capture your complete
                journey in one verified digital profile. Build a portfolio that tells your whole
                story.
              </p>
            </div>

            {/* Activity Stats */}
            <div ref={gridRef} className="grid grid-cols-2 gap-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.label}
                  className={`flex items-center gap-3 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-all duration-500 group cursor-default hover:-translate-y-0.5 hover:shadow-md ${
                    gridVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  }`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                    <activity.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{activity.label}</div>
                    <div className="text-xs text-muted-foreground">{activity.count} records</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Preview */}
          <div
            ref={cardRef}
            className={`relative transition-all duration-700 delay-200 ${
              cardVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div className="absolute -inset-4 gradient-glow opacity-30 rounded-3xl animate-pulse-slow" />
            <div className="relative bg-card rounded-2xl border border-border shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-500">
              {/* Portfolio Header */}
              <div className="gradient-hero p-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent">
                    <GraduationCap className="h-8 w-8 text-accent-foreground" />
                  </div>
                  <div className="text-primary-foreground">
                    <h3 className="text-xl font-bold">Aman Singh</h3>
                    <p className="text-sm text-primary-foreground/70">B.Tech CSE • 2021-2025</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs text-success">Verified Profile</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio Content */}
              <div className="p-6 space-y-4">
                {[
                  { title: "SIH 2023 Finalist", type: "Competition", verified: true },
                  { title: "AWS Cloud Practitioner", type: "Certification", verified: true },
                  { title: "Tech Club President", type: "Leadership", verified: true },
                  { title: "Summer Internship at TCS", type: "Internship", verified: true },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-300 hover:translate-x-1 ${
                      cardVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${400 + i * 100}ms` }}
                  >
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.type}</div>
                    </div>
                    {item.verified && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
                        <Award className="h-3 w-3" />
                        Verified
                      </div>
                    )}
                  </div>
                ))}

                {/* Portfolio Score */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Profile Completeness</span>
                    <span className="text-sm font-bold text-accent tabular-nums">{completeness}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full gradient-accent rounded-full transition-all duration-1500 ease-out"
                      style={{ width: cardVisible ? "92%" : "0%" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActivityTypes;