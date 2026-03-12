import { motion } from "framer-motion";
import MarketingLayout from "@/components/MarketingLayout";
import { Link } from "wouter";
import {
  Brain,
  Box,
  Palette,
  Users,
  Shield,
  Award,
  Smartphone,
  Monitor,
  Trophy,
  ChevronRight,
  Check,
  Crosshair,
  Star,
  MapPin,
  Lock,
} from "lucide-react";

import themeLodge from "../assets/theme-lodge.png";
import themeManor from "../assets/theme-manor.png";
import themeMinimal from "../assets/theme-minimal.png";
import screenshotDashboard from "../assets/screenshot-dashboard.png";
import screenshotTrophyRoom from "../assets/screenshot-trophyroom.png";
import screenshotTrophyDetail from "../assets/screenshot-trophydetail.png";
import screenshotTimeline from "../assets/screenshot-timeline.png";
import screenshotMap from "../assets/screenshot-map.png";
import screenshot3D from "../assets/screenshot-3d.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" as const },
  }),
};

const features = [
  {
    id: "ai-upload",
    icon: Brain,
    title: "AI-Powered Trophy Upload",
    description:
      "Effortlessly upload a photo and let our AI instantly identify species, estimate scores, and classify your trophy — no manual guesswork.",
  },
  {
    id: "3d-ar",
    icon: Box,
    title: "3D Models & AR",
    description:
      "Transform your trophies into stunning 3D models. View them in augmented reality and share immersive experiences.",
  },
  {
    id: "themes",
    icon: Palette,
    title: "Virtual Trophy Room Themes",
    description:
      "Choose from beautifully crafted room themes — from classic lodge to modern gallery — to showcase your collection.",
  },
  {
    id: "community",
    icon: Users,
    title: "Community & Leaderboards",
    description:
      "Connect with fellow hunters. Compare collections, rate trophy rooms, and climb the leaderboards.",
  },
  {
    id: "weapon-safe",
    icon: Shield,
    title: "Weapon Safe",
    description:
      "Digitally catalog your firearms and bows with full specifications, serial numbers, and maintenance logs.",
  },
  {
    id: "certificates",
    icon: Award,
    title: "Certificates & Records",
    description:
      "Generate certificates for qualifying trophies and use them as proof of hunt records. Track scores across SCI, B&C, and Rowland Ward systems.",
  },
  {
    id: "maps",
    icon: MapPin,
    title: "Map Integration & Geo-Tagging",
    description:
      "Pin every hunt on an interactive map. Geo-tag your trophies with precise harvest locations and visualize your hunting journey across the globe.",
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Public or Private Rooms",
    description:
      "Choose to open your trophy room for the community to admire, or keep it private and secure — you're always in control.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Start preserving your legacy",
    features: [
      "3 AI trophy analyses",
      "1 3D trophy model",
      "25 manual trophy entries",
      "Public trophy room",
      "Basic species database",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Paid",
    price: "$9.99",
    period: "/month",
    description: "For the serious hunter",
    features: [
      "Unlimited AI analyses",
      "Unlimited 3D models",
      "Unlimited trophy entries",
      "Private trophy rooms",
      "Leaderboard access",
      "Advanced scoring systems",
      "Priority support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$19.99",
    period: "/month",
    description: "Business & outfitter tools",
    features: [
      "Everything in Paid",
      "Referral program access",
      "Pro badge & verification",
      "Business management tools",
      "Client trophy management",
      "Bulk upload & export",
      "Dedicated support",
    ],
    cta: "Get Started",
    highlighted: false,
  },
];

const showcaseImages = [
  { src: themeLodge, label: "Timber Ridge", description: "Rugged timber, warm stone, mountain air." },
  { src: themeManor, label: "Safari Manor", description: "Thatch, khaki canvas, and luxury leather." },
  { src: themeMinimal, label: "Alpine Gallery", description: "Concrete, glass, and light." },
];

const appScreenshots = [
  { src: screenshotDashboard, label: "Dashboard", description: "Your hunts at a glance" },
  { src: screenshotTrophyRoom, label: "Trophy Room", description: "Browse your collection" },
  { src: screenshotTrophyDetail, label: "Trophy Detail", description: "Every detail captured" },
  { src: screenshotTimeline, label: "Trophy Timeline", description: "Your hunting journey over time" },
  { src: screenshotMap, label: "Trophy Map", description: "Geo-tagged hunt locations" },
  { src: screenshot3D, label: "3D & AR View", description: "Immersive 3D trophy models" },
];

function scrollToFeatureDetails() {
  const el = document.getElementById("feature-details");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function LandingPage() {
  return (
    <MarketingLayout>
      <div className="bg-[#b87333] text-white text-center py-3 px-4" data-testid="banner-coming-soon">
        <p className="text-sm font-medium tracking-wide">
          <span className="font-bold">Coming Soon</span> — Honor The Hunt is launching soon. Be the first to know!
        </p>
      </div>
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src={themeLodge}
            alt="Honor The Hunt"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111]/80 via-[#111]/70 to-[#111]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#b87333]/20 mb-8 font-medium bg-[#b873331a]">
              <Crosshair className="h-3.5 w-3.5 text-[#b87333]" />
              <span className="text-xs text-[#b87333] font-medium tracking-wider uppercase">Your Digital Trophy Room</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold leading-tight mb-6"
            data-testid="text-hero-headline"
          >
            Preserve your Legacy.
            <br />
            <span className="text-[#b87333] italic font-light">Honor the Hunt.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 font-light leading-relaxed"
            data-testid="text-hero-subheadline"
          >
            Take your trophies home in your pocket and share it with fellow hunters. AI-powered trophy identification, 3D models, and a stunning virtual trophy room — all in one app.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/login?mode=signup">
              <span
                className="px-8 py-3.5 bg-[#b87333] hover:bg-[#a0622d] text-white font-medium rounded-lg text-base transition-colors flex items-center gap-2 shadow-lg shadow-[#b87333]/20 cursor-pointer"
                data-testid="button-hero-cta"
              >
                Get Started Free <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
            <Link href="/pricing">
              <span
                className="px-8 py-3.5 border border-white/20 hover:border-white/40 text-white font-medium rounded-lg text-base transition-colors cursor-pointer"
                data-testid="link-hero-pricing"
              >
                View Pricing
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <a
              href="#"
              className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors"
              data-testid="button-app-store"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white fill-current">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/60 leading-none">Download on the</div>
                <div className="text-sm font-semibold text-white leading-tight">App Store</div>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/20 rounded-xl transition-colors"
              data-testid="button-google-play"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white fill-current">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.4l2.585 1.493a1 1 0 0 1 0 1.4l-2.586 1.493-2.537-2.537 2.537-2.85zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/60 leading-none">Get it on</div>
                <div className="text-sm font-semibold text-white leading-tight">Google Play</div>
              </div>
            </a>
          </motion.div>
        </div>
      </section>
      <section className="py-16 px-4 sm:px-6 bg-[#111]" data-testid="section-features-summary">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-10"
          >
            <motion.p variants={fadeUp} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Everything You Need
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-features-heading">
              Built for Hunters, by Hunters
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3"
          >
            {features.map((feature, i) => (
              <motion.button
                key={feature.id}
                variants={fadeUp}
                custom={i}
                onClick={() => scrollToFeatureDetails()}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors text-left group cursor-pointer"
                data-testid={`link-feature-${feature.id}`}
              >
                <feature.icon className="h-5 w-5 text-[#b87333] shrink-0" />
                <span className="text-sm text-white/80 group-hover:text-white transition-colors" data-testid={`text-feature-title-${feature.id}`}>
                  {feature.title}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-white/20 group-hover:text-[#b87333] ml-auto shrink-0 transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>
      <section className="py-24 px-4 sm:px-6 bg-[#0a0a0a]" data-testid="section-app-preview">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              See It In Action
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-preview-heading">
              Your Trophy Room Awaits
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              Real screenshots from the app. Track your hunts, browse your collection, and explore every detail.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-10 max-w-5xl mx-auto justify-items-center">
            {appScreenshots.map((screen, i) => (
              <motion.div
                key={screen.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={fadeUp}
                custom={i}
                className="relative group"
                data-testid={`card-preview-${i}`}
              >
                <div className="relative w-full max-w-[220px] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden border-2 border-white/10 shadow-2xl shadow-black/50 group-hover:border-[#b87333]/30 transition-all duration-500">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-black rounded-b-xl sm:rounded-b-2xl z-10" />
                  <img
                    src={screen.src}
                    alt={screen.label}
                    className="w-full h-auto"
                    data-testid={`img-preview-${i}`}
                  />
                </div>
                <div className="text-center mt-3">
                  <p className="font-serif font-semibold text-xs sm:text-sm" data-testid={`text-preview-label-${i}`}>{screen.label}</p>
                  <p className="text-white/40 text-[10px] sm:text-xs" data-testid={`text-preview-description-${i}`}>{screen.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section id="feature-details" className="py-24 px-4 sm:px-6 bg-[#111]" data-testid="section-feature-details">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Packed With Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-feature-details-heading">
              Preserve Every Detail of Your Hunt
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              From AI identification to 3D scanning, Honor The Hunt gives you the most advanced tools to document and showcase your achievements.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                custom={i}
                className="group p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#b87333]/20 transition-all duration-300"
                data-testid={`card-feature-detail-${feature.id}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#b87333]/10 flex items-center justify-center mb-3 group-hover:bg-[#b87333]/20 transition-colors">
                  <feature.icon className="h-5 w-5 text-[#b87333]" />
                </div>
                <h3 className="text-sm font-serif font-semibold mb-1.5" data-testid={`text-feature-detail-title-${feature.id}`}>{feature.title}</h3>
                <p className="text-white/50 text-xs leading-relaxed" data-testid={`text-feature-detail-desc-${feature.id}`}>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 px-4 sm:px-6 bg-[#0d0d0d]" data-testid="section-showcase">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Stunning Trophy Rooms
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-showcase-heading">
              Choose Your Perfect Theme
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              Your trophies deserve a world-class showcase. Pick from handcrafted room themes that bring your collection to life.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcaseImages.map((img, i) => (
              <motion.div
                key={img.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                custom={i}
                className="group relative overflow-hidden rounded-xl border border-white/5"
                data-testid={`card-showcase-${i}`}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.label}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-serif font-semibold text-lg">{img.label}</h3>
                  <p className="text-white/60 text-sm">{img.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 px-4 sm:px-6 bg-[#111]" data-testid="section-cross-device">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#b87333]/10 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-[#b87333]" />
              </div>
              <div className="text-3xl text-white/20 font-light">+</div>
              <div className="w-16 h-16 rounded-2xl bg-[#b87333]/10 flex items-center justify-center">
                <Monitor className="h-8 w-8 text-[#b87333]" />
              </div>
            </motion.div>

            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-crossdevice-heading">
              Works on Your Phone and Your Computer
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg mb-8">
              Capture trophies in the field on your phone, then explore your full collection on desktop. Your data syncs seamlessly across all your devices.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/40">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b87333]" /> Mobile-optimized camera</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b87333]" /> Desktop trophy management</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b87333]" /> Real-time sync</span>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <section className="py-24 px-4 sm:px-6 bg-[#0d0d0d]" data-testid="section-social-proof">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            className="text-center"
          >
            <motion.div variants={fadeUp} custom={0} className="flex items-center justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 text-[#b87333] fill-[#b87333]" />
              ))}
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-6" data-testid="text-socialproof-heading">
              Join 2,500+ Hunters Preserving Their Legacy
            </motion.h2>
            <motion.div variants={fadeUp} custom={2} className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-12">
              <div className="text-center">
                <p className="text-4xl font-serif font-bold text-[#b87333]" data-testid="text-stat-trophies">15,000+</p>
                <p className="text-white/50 text-sm mt-1">Trophies Documented</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-serif font-bold text-[#b87333]" data-testid="text-stat-species">350+</p>
                <p className="text-white/50 text-sm mt-1">Species Identified</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-serif font-bold text-[#b87333]" data-testid="text-stat-countries">45+</p>
                <p className="text-white/50 text-sm mt-1">Countries Represented</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <section className="py-24 px-4 sm:px-6 bg-[#111]" data-testid="section-pricing-summary">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Simple Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-pricing-heading">
              Start Free, Upgrade When Ready
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              No credit card required. Begin documenting your hunts today and upgrade as your collection grows.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                custom={i}
                className={`relative p-6 rounded-xl border ${
                  tier.highlighted
                    ? "border-[#b87333]/40 bg-[#b87333]/5"
                    : "border-white/5 bg-white/[0.02]"
                }`}
                data-testid={`card-pricing-${tier.name.toLowerCase()}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#b87333] text-white text-xs font-semibold rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <h3 className="font-serif text-xl font-semibold mb-1">{tier.name}</h3>
                <p className="text-white/50 text-sm mb-4">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-3xl font-serif font-bold">{tier.price}</span>
                  <span className="text-white/40 text-sm ml-1">{tier.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <Check className="h-4 w-4 text-[#b87333] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login?mode=signup">
                  <span
                    className={`block text-center py-2.5 rounded-lg font-medium text-sm transition-colors cursor-pointer ${
                      tier.highlighted
                        ? "bg-[#b87333] hover:bg-[#a0622d] text-white"
                        : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                    data-testid={`button-pricing-${tier.name.toLowerCase()}`}
                  >
                    {tier.cta}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <span className="text-[#b87333] hover:text-[#d4935f] text-sm font-medium cursor-pointer flex items-center justify-center gap-1" data-testid="link-full-pricing">
                View full pricing comparison <ChevronRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
      <section className="py-24 px-4 sm:px-6 bg-[#0d0d0d]" data-testid="section-final-cta">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#b87333]/10 mb-6">
              <Trophy className="h-8 w-8 text-[#b87333]" />
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-finalcta-heading">
              Ready to Preserve Your Legacy?
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of hunters who trust Honor The Hunt to document, protect, and share their greatest achievements.
            </motion.p>
            <motion.div variants={fadeUp} custom={3}>
              <Link href="/login?mode=signup">
                <span
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#b87333] hover:bg-[#a0622d] text-white font-medium rounded-lg text-base transition-colors shadow-lg shadow-[#b87333]/20 cursor-pointer"
                  data-testid="button-final-cta"
                >
                  Get Started Free <ChevronRight className="h-4 w-4" />
                </span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </MarketingLayout>
  );
}
