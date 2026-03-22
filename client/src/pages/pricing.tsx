import { motion } from "framer-motion";
import MarketingLayout from "@/components/MarketingLayout";
import { Link } from "wouter";
import { Check, X, ChevronRight, Trophy, Brain, Box, Palette, Users, Shield, Award, Crosshair } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { delay: i * 0.12, duration: 0.5, ease: "easeOut" as const },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

const tiers = [
  {
    name: "Free",
    price: "$0",
    originalPrice: null as string | null,
    period: "forever",
    badge: null as string | null,
    description: "Get started with your digital trophy room",
    cta: "Get Started",
    highlighted: false,
    features: [
      "3 AI trophy analyses",
      "1 3D trophy model",
      "25 manual trophy entries",
      "Public trophy room",
      "1 room theme",
      "Basic species database",
      "SCI scoring system",
      "3 weapons in safe",
      "Community feed access",
      "Email support",
    ],
  },
  {
    name: "Paid",
    price: "$0",
    originalPrice: "$9.99",
    period: "/month",
    badge: "100% off — Free for first 3 months (Beta Launch)",
    description: "Full access for dedicated hunters",
    cta: "Get Started",
    highlighted: true,
    features: [
      "Unlimited AI analyses",
      "Unlimited 3D models",
      "Unlimited trophy entries",
      "Private trophy rooms",
      "All room themes",
      "Full species database",
      "All scoring systems (SCI, B&C, RW)",
      "Trophy certificates",
      "Unlimited weapons in safe",
      "Leaderboard access",
      "Groups access",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "$0",
    originalPrice: "$19.99",
    period: "/month",
    badge: "100% off — Free for first 3 months (Beta Launch)",
    description: "For outfitters and hunting professionals",
    cta: "Get Started",
    highlighted: false,
    features: [
      "Everything in Paid, plus:",
      "Referral program access",
      "Pro badge & verification",
      "Pro tagging on trophies",
      "Groups creation & management",
      "Dedicated support",
    ],
  },
];

const comparisonFeatures = [
  {
    category: "Trophy Management",
    icon: Trophy,
    features: [
      { name: "Manual trophy entries", free: "25", paid: "Unlimited", pro: "Unlimited" },
      { name: "AI trophy analyses", free: "3", paid: "Unlimited", pro: "Unlimited" },
      { name: "3D trophy models", free: "1", paid: "Unlimited", pro: "Unlimited" },
      { name: "Photo uploads", free: true, paid: true, pro: true },
      { name: "Species database access", free: "Basic", paid: "Full", pro: "Full" },
      { name: "Pro tagging on trophies", free: false, paid: false, pro: true },
    ],
  },
  {
    category: "Trophy Room",
    icon: Palette,
    features: [
      { name: "Public trophy room", free: true, paid: true, pro: true },
      { name: "Private trophy rooms", free: false, paid: true, pro: true },
      { name: "Room themes", free: "1", paid: "All", pro: "All" },
    ],
  },
  {
    category: "Community",
    icon: Users,
    features: [
      { name: "Community feed", free: true, paid: true, pro: true },
      { name: "Trophy applause", free: true, paid: true, pro: true },
      { name: "View community rooms", free: true, paid: true, pro: true },
      { name: "Rate other rooms", free: true, paid: true, pro: true },
      { name: "Leaderboard access", free: false, paid: true, pro: true },
      { name: "Groups access", free: false, paid: true, pro: true },
      { name: "Groups creation & management", free: false, paid: false, pro: true },
      { name: "Referral program", free: false, paid: false, pro: true },
    ],
  },
  {
    category: "Scoring & Certificates",
    icon: Award,
    features: [
      { name: "SCI scoring", free: true, paid: true, pro: true },
      { name: "Boone & Crockett scoring", free: false, paid: true, pro: true },
      { name: "Rowland Ward scoring", free: false, paid: true, pro: true },
      { name: "Trophy certificates", free: false, paid: true, pro: true },
    ],
  },
  {
    category: "Account & Support",
    icon: Shield,
    features: [
      { name: "Weapon safe", free: "3 items", paid: "Unlimited", pro: "Unlimited" },
      { name: "Google / Apple sign-in", free: true, paid: true, pro: true },
      { name: "Guided onboarding", free: true, paid: true, pro: true },
      { name: "Pro badge & verification", free: false, paid: false, pro: true },
      { name: "Email support", free: true, paid: true, pro: true },
      { name: "Priority support", free: false, paid: true, pro: true },
      { name: "Dedicated support", free: false, paid: false, pro: true },
    ],
  },
];

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <div className="w-6 h-6 rounded-full bg-[#b87333]/15 flex items-center justify-center">
        <Check className="h-3.5 w-3.5 text-[#b87333]" />
      </div>
    ) : (
      <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
        <X className="h-3.5 w-3.5 text-white/15" />
      </div>
    );
  }
  return <span className="text-sm font-medium text-white/80">{value}</span>;
}

export default function PricingPage() {
  return (
    <MarketingLayout>
      <section className="py-24 px-4 sm:px-6" data-testid="section-pricing-hero">
        <div className="max-w-5xl mx-auto text-center">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3"
          >
            Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-serif font-bold mb-4"
            data-testid="text-pricing-title"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/60 text-lg max-w-2xl mx-auto mb-4"
          >
            Start free and upgrade as your collection grows. No credit card required.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/20 bg-green-500/10"
          >
            <span className="text-green-400 text-sm font-medium">Beta Launch — All paid features are free for the first 3 months</span>
          </motion.div>
        </div>
      </section>

      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, i) => (
            <motion.div
              key={tier.name}
              initial="hidden"
              animate="visible"
              variants={scaleIn}
              custom={i + 1}
              className={`relative p-8 rounded-xl border flex flex-col ${
                tier.highlighted
                  ? "border-[#b87333]/40 bg-[#b87333]/5 shadow-lg shadow-[#b87333]/5"
                  : "border-white/5 bg-white/[0.02]"
              }`}
              data-testid={`card-tier-${tier.name.toLowerCase()}`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#b87333] text-white text-xs font-semibold rounded-full uppercase tracking-wider">
                  Most Popular
                </div>
              )}
              <h3 className="font-serif text-2xl font-semibold mb-1">{tier.name}</h3>
              <p className="text-white/50 text-sm mb-6">{tier.description}</p>
              <div className="mb-2">
                {tier.originalPrice && (
                  <span className="text-xl font-serif text-white/30 line-through mr-2">{tier.originalPrice}</span>
                )}
                <span className="text-4xl font-serif font-bold">{tier.price}</span>
                <span className="text-white/40 text-sm ml-1">{tier.period}</span>
              </div>
              {tier.badge && (
                <div className="mb-6 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <span className="text-green-400 text-xs font-medium">{tier.badge}</span>
                </div>
              )}
              {!tier.badge && <div className="mb-6" />}

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                    <Check className="h-4 w-4 text-[#b87333] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/login?mode=signup">
                <span
                  className={`block text-center py-3 rounded-lg font-medium transition-colors cursor-pointer ${
                    tier.highlighted
                      ? "bg-[#b87333] hover:bg-[#a0622d] text-white"
                      : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                  }`}
                  data-testid={`button-tier-${tier.name.toLowerCase()}`}
                >
                  {tier.cta}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 bg-[#0d0d0d]" data-testid="section-comparison-table">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeIn} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Compare Plans
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-2xl sm:text-3xl font-serif font-bold mb-4" data-testid="text-comparison-heading">
              Feature Comparison
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/50 max-w-xl mx-auto">
              See what's included in each plan.
            </motion.p>
          </motion.div>

          <div className="hidden md:block rounded-xl border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-white/[0.03]">
              <div className="p-5 border-b border-r border-white/10 flex items-center">
                <span className="text-sm font-semibold text-white/40 uppercase tracking-wider">Feature</span>
              </div>
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-5 border-b border-r last:border-r-0 border-white/10 text-center ${
                    tier.highlighted ? "bg-[#b87333]/5" : ""
                  }`}
                >
                  <span className={`font-serif font-bold text-lg ${tier.highlighted ? "text-[#b87333]" : "text-white"}`}>
                    {tier.name}
                  </span>
                  <div className="mt-0.5">
                    {tier.originalPrice && (
                      <span className="text-xs text-white/30 line-through mr-1">{tier.originalPrice}{tier.period !== "forever" ? tier.period : ""}</span>
                    )}
                    <span className="text-xs text-white/40">{tier.price}{tier.period !== "forever" ? tier.period : ""}</span>
                  </div>
                </div>
              ))}
            </div>

            {comparisonFeatures.map((section) => (
              <div key={section.category}>
                <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-[#b87333]/[0.03]">
                  <div className="p-4 border-b border-r border-white/10 col-span-4 flex items-center gap-2.5">
                    <section.icon className="h-4 w-4 text-[#b87333]" />
                    <span className="text-sm font-semibold text-[#b87333] uppercase tracking-wider">{section.category}</span>
                  </div>
                </div>
                {section.features.map((feature, fi) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-[1fr_1fr_1fr_1fr] ${fi % 2 === 0 ? "bg-white/[0.01]" : "bg-transparent"}`}
                  >
                    <div className="p-4 border-b border-r border-white/5 flex items-center">
                      <span className="text-sm text-white/70">{feature.name}</span>
                    </div>
                    <div className={`p-4 border-b border-r border-white/5 flex items-center justify-center`}>
                      <FeatureValue value={feature.free} />
                    </div>
                    <div className={`p-4 border-b border-r border-white/5 flex items-center justify-center ${tiers[1].highlighted ? "bg-[#b87333]/[0.03]" : ""}`}>
                      <FeatureValue value={feature.paid} />
                    </div>
                    <div className="p-4 border-b border-white/5 flex items-center justify-center">
                      <FeatureValue value={feature.pro} />
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div className="grid grid-cols-[1fr_1fr_1fr_1fr] bg-white/[0.02]">
              <div className="p-5 border-r border-white/10" />
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-5 border-r last:border-r-0 border-white/10 flex justify-center ${
                    tier.highlighted ? "bg-[#b87333]/5" : ""
                  }`}
                >
                  <Link href="/login?mode=signup">
                    <span
                      className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        tier.highlighted
                          ? "bg-[#b87333] hover:bg-[#a0622d] text-white"
                          : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                      }`}
                      data-testid={`button-table-${tier.name.toLowerCase()}`}
                    >
                      {tier.cta}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-6">
            {comparisonFeatures.map((section) => (
              <motion.div
                key={section.category}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={fadeUp}
                custom={0}
                className="rounded-xl border border-white/10 overflow-hidden"
              >
                <div className="p-4 bg-[#b87333]/[0.05] flex items-center gap-2.5 border-b border-white/10">
                  <section.icon className="h-4 w-4 text-[#b87333]" />
                  <span className="text-sm font-semibold text-[#b87333] uppercase tracking-wider">{section.category}</span>
                </div>
                {section.features.map((feature, fi) => (
                  <div key={feature.name} className={`p-4 border-b border-white/5 ${fi % 2 === 0 ? "bg-white/[0.01]" : ""}`}>
                    <p className="text-sm text-white/80 font-medium mb-3">{feature.name}</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-white/30 block mb-1 uppercase tracking-wider">Free</span>
                        <div className="flex justify-center"><FeatureValue value={feature.free} /></div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[#b87333]/[0.05] border border-[#b87333]/10">
                        <span className="text-[10px] text-[#b87333] block mb-1 uppercase tracking-wider">Paid</span>
                        <div className="flex justify-center"><FeatureValue value={feature.paid} /></div>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-white/[0.02]">
                        <span className="text-[10px] text-white/30 block mb-1 uppercase tracking-wider">Pro</span>
                        <div className="flex justify-center"><FeatureValue value={feature.pro} /></div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4">Ready to Try It?</h2>
        <p className="text-white/60 max-w-xl mx-auto mb-8">
          Create a free account and explore every feature during the beta — no credit card required.
        </p>
        <Link href="/login?mode=signup">
          <span
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#b87333] hover:bg-[#a0622d] text-white font-medium rounded-lg transition-colors cursor-pointer"
            data-testid="button-pricing-bottom-cta"
          >
            Get Started Free <ChevronRight className="h-4 w-4" />
          </span>
        </Link>
      </section>
    </MarketingLayout>
  );
}
