import { ProcessFlowAnimation } from "./ProcessFlowAnimation";
import { CheckCircle2 } from "lucide-react";

const featureHighlights = [
  "Автоматизиран анализ на стотици фактори за всеки служител чрез модерни AI модели.",
  "Идентифициране на критични групи служители с висок риск от напускане.",
  "Ясни и разбираеми обяснения на причините за риска чрез SHAP методология.",
  "Възможност за симулиране на промени (заплата, бонуси) и тяхното отражение върху задържането."
];

export function LandingFeatures() {
  return (
    <section id="features" className="relative py-16 md:py-32 bg-transparent overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left Column: Animation */}
          <div className="order-2 lg:order-1">
            <ProcessFlowAnimation />
          </div>

          {/* Right Column: Content */}
          <div className="order-1 lg:order-2 space-y-8">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-brand-accent1 mb-4">
                Как работи
              </p>
              <h2 className="text-balance text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight mb-6 leading-[1.1]">
                Прозрения, базирани на{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-blue-200">
                  вашите данни
                </span>
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Нашият AI анализира историческите данни за служителите, за да предвиди риска от напускане и да предложи конкретни стъпки за запазване на талантите.
              </p>
            </div>

            <ul className="space-y-6">
              {featureHighlights.map((item, index) => (
                <li key={index} className="flex items-start gap-4 group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-accent1/10 flex items-center justify-center border border-brand-accent1/20 group-hover:bg-brand-accent1/20 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-brand-accent1" />
                  </div>
                  <p className="text-white/70 text-sm md:text-base leading-relaxed group-hover:text-white transition-colors pt-1">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
