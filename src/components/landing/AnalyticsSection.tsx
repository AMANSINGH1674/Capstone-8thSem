import {
  BarChart3,
  TrendingUp,
  PieChart,
  Users,
  FileText,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollReveal, useCounter } from "@/hooks/useScrollReveal";

const AnalyticsSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
  const { ref: dashRef, isVisible: dashVisible } = useScrollReveal();

  const students = useCounter(12543, 2000, dashVisible);
  const activities = useCounter(45821, 2000, dashVisible);
  const verified = useCounter(38294, 2000, dashVisible);
  const completion = useCounter(78, 1500, dashVisible);

  return (
    <section id="analytics" className="py-24 bg-muted/30 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[5%] left-[5%] w-[200px] h-[200px] rounded-full bg-accent/5 blur-[60px]" />
      <div className="absolute bottom-[5%] right-[5%] w-[300px] h-[300px] rounded-full bg-violet-500/5 blur-[80px]" />

      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <BarChart3 className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Analytics & Reports</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Data-Driven{" "}
            <span className="text-gradient">Insights</span>{" "}
            for Better Decisions
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful analytics engine that transforms student activity data into actionable insights
            for institutions.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div
          ref={dashRef}
          className={`relative transition-all duration-1000 ${
            dashVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <div className="absolute -inset-4 gradient-glow opacity-20 rounded-3xl blur-xl animate-pulse-slow" />
          <div className="relative bg-card rounded-2xl border border-border shadow-2xl overflow-hidden hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] transition-shadow duration-500">
            {/* Dashboard Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-destructive/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">Analytics Dashboard</span>
              </div>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>

            {/* Dashboard Content */}
            <div className="p-6">
              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { icon: Users, label: "Total Students", value: students.toLocaleString(), change: "+12%" },
                  { icon: FileText, label: "Activities Logged", value: activities.toLocaleString(), change: "+28%" },
                  { icon: TrendingUp, label: "Verified Records", value: verified.toLocaleString(), change: "+18%" },
                  { icon: PieChart, label: "Avg. Completion", value: `${completion}%`, change: "+5%" },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`p-4 rounded-xl bg-muted/50 border border-border hover:border-accent/30 hover:shadow-md transition-all duration-500 ${
                      dashVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                    }`}
                    style={{ transitionDelay: `${300 + index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs font-medium text-success">{stat.change}</span>
                    </div>
                    <div className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Charts Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Activity Distribution */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <h4 className="font-semibold text-foreground mb-4">Activity Distribution</h4>
                  <div className="space-y-3">
                    {[
                      { label: "Certifications", value: 35, color: "bg-accent" },
                      { label: "Competitions", value: 25, color: "bg-info" },
                      { label: "Workshops", value: 20, color: "bg-warning" },
                      { label: "Community Service", value: 15, color: "bg-success" },
                      { label: "Leadership", value: 5, color: "bg-destructive" },
                    ].map((item, i) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium text-foreground">{item.value}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-1500 ease-out`}
                            style={{
                              width: dashVisible ? `${item.value}%` : "0%",
                              transitionDelay: `${600 + i * 100}ms`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Trends */}
                <div className="p-4 rounded-xl bg-muted/30 border border-border">
                  <h4 className="font-semibold text-foreground mb-4">Monthly Activity Trends</h4>
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t gradient-accent transition-all duration-700 ease-out hover:opacity-80 cursor-pointer"
                          style={{
                            height: dashVisible ? `${height}%` : "0%",
                            transitionDelay: `${800 + i * 50}ms`,
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                        </span>
                      </div>
                    ))}
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

export default AnalyticsSection;