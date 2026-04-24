import { Star, Quote } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const testimonials = [
  {
    quote:
      "AcademiX transformed our NAAC preparation. What used to take weeks now takes minutes — with full audit trails and verified data.",
    name: "Dr. Priya Sharma",
    role: "IQAC Coordinator, Presidency University",
    avatar: "PS",
    rating: 5,
  },
  {
    quote:
      "The AI verification is remarkable. Students love the instant feedback, and we love not having to manually verify thousands of certificates.",
    name: "Prof. Rajesh Kumar",
    role: "Dean of Student Affairs",
    avatar: "RK",
    rating: 5,
  },
  {
    quote:
      "My digital portfolio helped me land an internship at Microsoft. Recruiters could see all my verified achievements in one link.",
    name: "Ananya Patel",
    role: "B.Tech CSE, Class of 2025",
    avatar: "AP",
    rating: 5,
  },
];

const Testimonials = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-4">
            <Quote className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Testimonials</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Trusted by{" "}
            <span className="text-gradient">Educators & Students</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            See what our users have to say about their experience with AcademiX.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => {
            const Card = () => {
              const { ref, isVisible } = useScrollReveal();
              return (
                <div
                  ref={ref}
                  className={`relative group transition-all duration-700 ${
                    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                  }`}
                  style={{ transitionDelay: `${index * 150}ms` }}
                >
                  <div className="relative p-8 rounded-2xl bg-card border border-border hover:border-accent/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    {/* Quote mark */}
                    <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Quote className="h-12 w-12 text-accent" />
                    </div>

                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>

                    <p className="text-base text-foreground/80 leading-relaxed mb-6 relative z-10">
                      "{t.quote}"
                    </p>

                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <div className="h-10 w-10 rounded-full gradient-accent flex items-center justify-center text-sm font-bold text-accent-foreground">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.role}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            };
            return <Card key={t.name} />;
          })}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
