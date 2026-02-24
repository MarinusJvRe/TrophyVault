import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import trophyVaultLogo from "@assets/trophy_vault_logo_transparent.png";

interface SplashScreenProps {
  children: React.ReactNode;
}

export default function SplashScreen({ children }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#1a1a1a]"
            data-testid="splash-screen"
          >
            <motion.img
              src={trophyVaultLogo}
              alt="Trophy Vault"
              className="h-56 md:h-72 w-auto mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              data-testid="img-splash-logo"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="flex items-center gap-2"
            >
              <div className="w-6 h-6 border-2 border-[#b87333] border-t-transparent rounded-full animate-spin" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
