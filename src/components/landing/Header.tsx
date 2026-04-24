import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "For Students", href: "#students" },
    { name: "For Institutions", href: "#institutions" },
    { name: "Analytics", href: "#analytics" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass border-b border-border/50 shadow-lg shadow-black/5 py-0"
          : "bg-transparent border-b border-transparent py-1"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent shadow-glow transition-transform duration-300 group-hover:scale-110">
              <GraduationCap className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Academi<span className="text-gradient">X</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative text-sm font-medium text-muted-foreground hover:text-foreground transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:w-0 after:gradient-accent after:rounded-full after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="accent" size="sm">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-80 opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-col gap-4 border-t border-border/50 pt-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-4 border-t border-border/50">
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  Sign In
                </Button>
              </Link>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="accent" size="sm" className="w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;