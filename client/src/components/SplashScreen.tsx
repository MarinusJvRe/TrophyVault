import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import splashLogo from "@assets/splash_logo.png";

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
              src={splashLogo}
              alt="Honor The Hunt"
              className="h-32 md:h-44 w-auto mb-4 rounded-2xl"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              data-testid="img-splash-logo"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-[#b87333] text-xl font-serif tracking-widest mb-6"
            >
              Honor the Hunt
            </motion.p>
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
