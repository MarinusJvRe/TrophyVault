import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import trophyVaultLogo from "@assets/honor_hunt_logo_v2.png";

const navLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Contact", href: "/contact" },
];

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#111]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer" data-testid="link-logo-home">
              <img src={trophyVaultLogo} alt="Honor The Hunt" className="h-8 w-auto" data-testid="img-marketing-logo" />
              <span className="text-white/70 font-serif text-sm tracking-wide hidden sm:inline">Honor the Hunt</span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-6" data-testid="nav-marketing-links">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`text-sm font-medium transition-colors cursor-pointer ${
                    location === link.href ? "text-[#b87333]" : "text-white/70 hover:text-white"
                  }`}
                  data-testid={`link-nav-${link.label.toLowerCase()}`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <span
                className="text-sm font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
                data-testid="link-login"
              >
                Log In
              </span>
            </Link>
            <Link href="/login?mode=signup">
              <span
                className="px-4 py-2 bg-[#b87333] hover:bg-[#a0622d] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
                data-testid="link-signup"
              >
                Sign Up
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        {children}
      </main>

      <footer className="bg-[#0a0a0a] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <img src={trophyVaultLogo} alt="Honor The Hunt" className="h-8 w-auto mb-4" data-testid="img-footer-logo" />
              <p className="text-white/50 text-sm max-w-sm leading-relaxed">
                Document your hunts with AI species identification, 3D trophy models, and a virtual trophy room you can share with other hunters.
              </p>
            </div>

            <div>
              <h4 className="font-serif text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/pricing">
                    <span className="text-sm text-white/50 hover:text-[#b87333] transition-colors cursor-pointer" data-testid="link-footer-pricing">Pricing</span>
                  </Link>
                </li>
                <li>
                  <Link href="/contact">
                    <span className="text-sm text-white/50 hover:text-[#b87333] transition-colors cursor-pointer" data-testid="link-footer-contact">Contact</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms">
                    <span className="text-sm text-white/50 hover:text-[#b87333] transition-colors cursor-pointer" data-testid="link-footer-terms">Terms & Conditions</span>
                  </Link>
                </li>
                <li>
                  <Link href="/privacy">
                    <span className="text-sm text-white/50 hover:text-[#b87333] transition-colors cursor-pointer" data-testid="link-footer-privacy">Privacy Policy</span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-white/30" data-testid="text-copyright">
              &copy; {new Date().getFullYear()} Honor The Hunt. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Link href="/terms">
                <span className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer" data-testid="link-footer-bottom-terms">Terms</span>
              </Link>
              <Link href="/privacy">
                <span className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer" data-testid="link-footer-bottom-privacy">Privacy</span>
              </Link>
              <Link href="/contact">
                <span className="text-xs text-white/30 hover:text-white/60 transition-colors cursor-pointer" data-testid="link-footer-bottom-contact">Contact</span>
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
