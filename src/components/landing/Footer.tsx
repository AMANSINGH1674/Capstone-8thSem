import { GraduationCap, Mail, Phone, MapPin, Github, Twitter, Linkedin, ArrowUp } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const Footer = () => {
  const { ref, isVisible } = useScrollReveal();

  const footerLinks = {
    Product: ["Features", "Pricing", "Integrations", "API Docs"],
    Resources: ["Documentation", "Help Center", "Community", "Blog"],
    Company: ["About Us", "Careers", "Contact", "Partners"],
    Legal: ["Privacy Policy", "Terms of Service", "Security", "Compliance"],
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-primary text-primary-foreground relative">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div
        ref={ref}
        className={`container mx-auto px-4 py-16 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent shadow-glow transition-transform duration-300 group-hover:scale-110">
                <GraduationCap className="h-5 w-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">
                Academi<span className="text-accent">X</span>
              </span>
            </a>
            <p className="text-primary-foreground/70 mb-6 max-w-xs">
              Centralized digital platform for comprehensive student activity records in Higher
              Education Institutions.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm">
              <a
                href="mailto:support@academix.edu"
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Mail className="h-4 w-4" />
                support@academix.edu
              </a>
              <a
                href="tel:+911234567890"
                className="flex items-center gap-2 text-primary-foreground/70 hover:text-accent transition-colors"
              >
                <Phone className="h-4 w-4" />
                +91 123 456 7890
              </a>
              <div className="flex items-start gap-2 text-primary-foreground/70">
                <MapPin className="h-4 w-4 mt-0.5" />
                Presidency University, Bangalore
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-primary-foreground mb-4">{title}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-primary-foreground/70 hover:text-accent hover:translate-x-1 transition-all duration-200 inline-block"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-primary-foreground/60">
            © 2025 AcademiX. All rights reserved. | SIH 2025 Project
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/AMANSINGH1674/Centralised-Digital-Platform-for-Comprehensive-student-activity-record-in-HEIs"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-all duration-200 hover:scale-110"
            >
              <Github className="h-5 w-5 text-primary-foreground/70 hover:text-accent" />
            </a>
            <a
              href="#"
              className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-all duration-200 hover:scale-110"
            >
              <Twitter className="h-5 w-5 text-primary-foreground/70 hover:text-accent" />
            </a>
            <a
              href="#"
              className="p-2 rounded-lg hover:bg-primary-foreground/10 transition-all duration-200 hover:scale-110"
            >
              <Linkedin className="h-5 w-5 text-primary-foreground/70 hover:text-accent" />
            </a>
          </div>

          {/* SDG Badges + Back to top */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
              SDG 4
            </div>
            <div className="px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
              SDG 9
            </div>
            <button
              onClick={scrollToTop}
              className="ml-2 p-2 rounded-full bg-accent/20 hover:bg-accent/30 text-accent transition-all duration-200 hover:scale-110"
              aria-label="Back to top"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;