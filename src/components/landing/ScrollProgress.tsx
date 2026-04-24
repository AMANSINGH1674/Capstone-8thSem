import { useScrollProgress } from "@/hooks/useScrollReveal";

const ScrollProgress = () => {
  const progress = useScrollProgress();

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none">
      <div
        className="h-full gradient-accent origin-left transition-none"
        style={{
          transform: `scaleX(${progress})`,
          boxShadow: "0 0 12px hsl(168 76% 42% / 0.6)",
        }}
      />
    </div>
  );
};

export default ScrollProgress;
