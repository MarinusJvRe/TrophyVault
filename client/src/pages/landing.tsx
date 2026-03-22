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
  MapPin,
  Lock,
  MessageCircle,
  Heart,
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
import screenshotCommunity from "../assets/screenshot-community.png";

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

const slideRight = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const features = [
  {
    id: "ai-upload",
    icon: Brain,
    title: "AI-Powered Trophy Upload",
    description:
      "Upload a photo and let our AI identify the species, estimate scores, and classify your trophy automatically.",
  },
  {
    id: "3d-ar",
    icon: Box,
    title: "3D Models & AR Viewer",
    description:
      "Turn your trophies into 3D models you can rotate, zoom, and place on your wall using augmented reality on your phone.",
  },
  {
    id: "themes",
    icon: Palette,
    title: "Virtual Trophy Room Themes",
    description:
      "Display your collection in themed rooms — from a timber lodge to a safari manor or alpine gallery.",
  },
  {
    id: "community",
    icon: Users,
    title: "Community Feed & Groups",
    description:
      "Browse the community feed, applaud other hunters' trophies, join groups, and compare collections on the leaderboard.",
  },
  {
    id: "weapon-safe",
    icon: Shield,
    title: "Weapon Safe",
    description:
      "Catalog your firearms and bows with specifications, serial numbers, and maintenance records.",
  },
  {
    id: "certificates",
    icon: Award,
    title: "Scoring & Certificates",
    description:
      "Track scores across SCI, Boone & Crockett, and Rowland Ward systems. Generate certificates for qualifying trophies.",
  },
  {
    id: "maps",
    icon: MapPin,
    title: "Map & Geo-Tagging",
    description:
      "Pin every hunt on an interactive map with precise harvest locations and see your hunting journey at a glance.",
  },
  {
    id: "privacy",
    icon: Lock,
    title: "Public or Private Rooms",
    description:
      "Open your trophy room for the community or keep it private — you control who sees your collection.",
  },
  {
    id: "feed",
    icon: MessageCircle,
    title: "Trophy Feed & Applause",
    description:
      "Share your latest trophies in a live feed. Other hunters can applaud your achievements and leave reactions.",
  },
  {
    id: "oauth",
    icon: Heart,
    title: "Quick Sign-Up & Onboarding",
    description:
      "Create your account with Google or Apple in seconds. A guided onboarding walks you through setting up your first trophy room.",
  },
];

const pricingTiers = [
  {
    name: "Free",
    price: "$0",
    originalPrice: null as string | null,
    period: "forever",
    badge: null as string | null,
    description: "Start documenting your hunts",
    features: [
      "3 AI trophy analyses",
      "1 3D trophy model",
      "25 manual trophy entries",
      "Public trophy room",
      "Basic species database",
      "Community feed access",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Paid",
    price: "$0",
    originalPrice: "$9.99",
    period: "/month",
    badge: "100% off — Free for first 3 months (Beta Launch)",
    description: "For the dedicated hunter",
    features: [
      "Unlimited AI analyses",
      "Unlimited 3D models",
      "Unlimited trophy entries",
      "Private trophy rooms",
      "Leaderboard access",
      "All scoring systems",
      "Groups access",
      "Priority support",
    ],
    cta: "Get Started",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "$0",
    originalPrice: "$19.99",
    period: "/month",
    badge: "100% off — Free for first 3 months (Beta Launch)",
    description: "For outfitters & professionals",
    features: [
      "Everything in Paid",
      "Referral program access",
      "Pro badge & verification",
      "Pro tagging on trophies",
      "Groups creation & management",
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
  { src: screenshot3D, label: "3D & AR View", description: "Rotate, zoom, and place on your wall" },
  { src: screenshotCommunity, label: "Community Feed", description: "Browse and applaud other hunters" },
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
          <span className="font-bold">Beta Launch</span> — Honor The Hunt is in early access. Sign up free and help shape the platform.
        </p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="bg-[#0d0d0d] text-center py-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#b87333]/20 bg-[#b873331a] font-semibold">
          <Crosshair className="h-3.5 w-3.5 text-[#b87333]" />
          <span className="text-xs text-[#b87333] font-medium tracking-wider uppercase">Your Digital Trophy Room</span>
        </div>
      </motion.div>
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" data-testid="section-hero">
        <div className="absolute inset-0">
          <img
            src={themeLodge}
            alt="Honor The Hunt"
            className="w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#111]/70 via-[#111]/50 to-[#111]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center pt-40 pb-20">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="sm:text-5xl md:text-7xl font-serif font-bold mb-6 text-[34px]"
            data-testid="text-hero-headline"
          >
            Preserve your Legacy.
            <br />
            <span className="text-[#b87333] italic font-light">Honor the Hunt.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
            data-testid="text-hero-subheadline"
          >
            Upload a photo, get an AI species ID and score estimate, then view your trophy in 3D — all stored in a virtual trophy room you can share with other hunters.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8"
          >
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-disabled="true"
              className="relative flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl opacity-50 cursor-default select-none pointer-events-auto"
              data-testid="button-app-store"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white fill-current">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/60 leading-none">Download on the</div>
                <div className="text-sm font-semibold text-white leading-tight">App Store</div>
              </div>
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#b87333] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">Coming Soon</span>
            </a>
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              aria-disabled="true"
              className="relative flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-xl opacity-50 cursor-default select-none pointer-events-auto"
              data-testid="button-google-play"
            >
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-white fill-current">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.4l2.585 1.493a1 1 0 0 1 0 1.4l-2.586 1.493-2.537-2.537 2.537-2.85zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
              </svg>
              <div className="text-left">
                <div className="text-[10px] text-white/60 leading-none">Get it on</div>
                <div className="text-sm font-semibold text-white leading-tight">Google Play</div>
              </div>
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#b87333] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">Coming Soon</span>
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
            <motion.p variants={fadeIn} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              What You Get
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
                variants={slideRight}
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
            <motion.p variants={fadeIn} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              See It In Action
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-preview-heading">
              Your Trophy Room Awaits
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              Screenshots from the app. Track hunts, browse your collection, and explore every detail.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-10 max-w-5xl mx-auto justify-items-center">
            {appScreenshots.map((screen, i) => (
              <motion.div
                key={screen.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={scaleIn}
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
            <motion.p variants={fadeIn} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Features
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-feature-details-heading">
              What You Can Do Today
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              AI identification, 3D scanning, community feed, groups, and scoring — everything to document and share your hunts.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={i % 2 === 0 ? fadeUp : scaleIn}
                custom={i % 5}
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
            <motion.p variants={fadeIn} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Trophy Room Themes
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-showcase-heading">
              Choose Your Theme
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              Three handcrafted room themes to display your collection. Pick the one that fits your style.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {showcaseImages.map((img, i) => (
              <motion.div
                key={img.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={scaleIn}
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
            <motion.div variants={scaleIn} custom={0} className="flex items-center justify-center gap-6 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-[#b87333]/10 flex items-center justify-center">
                <Smartphone className="h-8 w-8 text-[#b87333]" />
              </div>
              <div className="text-3xl text-white/20 font-light">+</div>
              <div className="w-16 h-16 rounded-2xl bg-[#b87333]/10 flex items-center justify-center">
                <Monitor className="h-8 w-8 text-[#b87333]" />
              </div>
            </motion.div>

            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-crossdevice-heading">
              Phone and Desktop
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg mb-8">
              Capture trophies in the field on your phone, then manage your full collection on desktop. Your data syncs across devices.
            </motion.p>
            <motion.div variants={slideRight} custom={3} className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/40">
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
            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#b87333]/20 bg-[#b87333]/10 mb-6">
              <Trophy className="h-4 w-4 text-[#b87333]" />
              <span className="text-sm text-[#b87333] font-medium">Early Access — Beta</span>
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-socialproof-heading">
              We're Just Getting Started
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 max-w-xl mx-auto text-lg mb-10">
              Honor The Hunt is in early access. Sign up now to lock in free access to all paid features during the beta period and help us shape the platform.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-6">
              <div className="text-center">
                <p className="text-4xl font-serif font-bold text-[#b87333]" data-testid="text-stat-trophies">10+</p>
                <p className="text-white/50 text-sm mt-1">Features Shipped</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-serif font-bold text-[#b87333]" data-testid="text-stat-species">3</p>
                <p className="text-white/50 text-sm mt-1">Scoring Systems</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-serif font-bold text-[#b87333]" data-testid="text-stat-countries">3</p>
                <p className="text-white/50 text-sm mt-1">Room Themes</p>
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
            <motion.p variants={fadeIn} custom={0} className="text-[#b87333] text-sm font-medium uppercase tracking-wider mb-3">
              Pricing
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-pricing-heading">
              Start Free, Upgrade When Ready
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 max-w-2xl mx-auto text-lg">
              No credit card required. All paid features are free during the beta period.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={scaleIn}
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
                <div className="mb-2">
                  {tier.originalPrice && (
                    <span className="text-lg font-serif text-white/30 line-through mr-2">{tier.originalPrice}</span>
                  )}
                  <span className="text-3xl font-serif font-bold">{tier.price}</span>
                  <span className="text-white/40 text-sm ml-1">{tier.period}</span>
                </div>
                {tier.badge && (
                  <div className="mb-4 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-green-400 text-xs font-medium">{tier.badge}</span>
                  </div>
                )}
                {!tier.badge && <div className="mb-4" />}
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
            <motion.div variants={scaleIn} custom={0} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#b87333]/10 mb-6">
              <Trophy className="h-8 w-8 text-[#b87333]" />
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-serif font-bold mb-4" data-testid="text-finalcta-heading">
              Start Documenting Your Hunts
            </motion.h2>
            <motion.p variants={fadeIn} custom={2} className="text-white/60 text-lg mb-8 max-w-xl mx-auto">
              Create your free account and try every feature during our beta launch — no credit card, no commitment.
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
