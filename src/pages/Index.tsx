import ScrollProgress from "@/components/landing/ScrollProgress";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import ActivityTypes from "@/components/landing/ActivityTypes";
import VerificationFlow from "@/components/landing/VerificationFlow";
import InstitutionSection from "@/components/landing/InstitutionSection";
import AnalyticsSection from "@/components/landing/AnalyticsSection";
import Testimonials from "@/components/landing/Testimonials";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth overflow-x-hidden">
      <ScrollProgress />
      <Header />
      <main>
        <Hero />
        <Features />
        <ActivityTypes />
        <VerificationFlow />
        <InstitutionSection />
        <AnalyticsSection />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
