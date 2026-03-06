'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { FloatingElement } from '@/components/animations';

export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ['start end', 'end end'],
  });

  const waveY = useTransform(scrollYProgress, [0, 1], [100, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  const footerLinks = [
    { label: 'Home', href: '/', emoji: '🏠' },
    { label: 'Games', href: '/games', emoji: '🎮' },
  ];

  const categories = [
    { emoji: '🎨', label: 'Colors', color: 'from-red-500 to-orange-500' },
    { emoji: '🧠', label: 'Memory', color: 'from-purple-500 to-pink-500' },
    { emoji: '🔢', label: 'Math', color: 'from-blue-500 to-cyan-500' },
    { emoji: '⚡', label: 'Reaction', color: 'from-yellow-500 to-amber-500' },
  ];

  return (
    <footer ref={footerRef} className="relative bg-gradient-to-b from-[#1a1a2e] to-[#0d0d17] text-white mt-auto overflow-hidden">
      {/* Animated Wave Separator */}
      <motion.div className="relative h-24 -mt-24" style={{ y: waveY }}>
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full"
        >
          <motion.path
            d="M0,40 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z"
            fill="url(#waveGradient)"
            animate={{
              d: [
                "M0,40 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z",
                "M0,60 C240,20 480,100 720,40 C960,20 1200,100 1440,40 L1440,120 L0,120 Z",
                "M0,40 C240,100 480,20 720,60 C960,100 1200,20 1440,60 L1440,120 L0,120 Z",
              ],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1a1a2e" />
              <stop offset="50%" stopColor="#2d2d4a" />
              <stop offset="100%" stopColor="#1a1a2e" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Floating background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            style={{
              left: `${5 + (i * 7) % 90}%`,
              top: `${10 + (i * 11) % 80}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.1, 0.4, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 4 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>

      <motion.div 
        className="container mx-auto px-4 py-16 relative z-10"
        style={{ opacity }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Section - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span 
                className="text-5xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎮
              </motion.span>
              <span className="text-3xl font-black bg-gradient-to-r from-[#ffdd00] via-[#f7941d] to-[#ec4399] bg-clip-text text-transparent">
                {t('common.appName')}
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Fun and educational games designed for kids. Learn while playing
              with our colorful collection of mini-games!
            </p>
            
            {/* Animated mascots */}
            <div className="flex gap-3">
              {['🦊', '🐱', '🐶', '🐰'].map((mascot, i) => (
                <FloatingElement
                  key={i}
                  className="text-3xl"
                  duration={2 + i * 0.5}
                  delay={i * 0.3}
                  amplitude={8}
                >
                  {mascot}
                </FloatingElement>
              ))}
            </div>
          </motion.div>

          {/* Quick Links - Enhanced */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-gradient-to-r from-[#ffdd00] to-[#f7941d] rounded-full" />
              <span className="text-[#ffdd00]">Quick Links</span>
            </h3>
            <ul className="space-y-4">
              {footerLinks.map((link, index) => (
                <motion.li 
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Link
                    href={link.href}
                    className="group flex items-center gap-3 text-white/70 hover:text-white transition-all duration-300"
                  >
                    <motion.span
                      className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl group-hover:bg-[#ffdd00] group-hover:scale-110 transition-all duration-300"
                      whileHover={{ rotate: 10 }}
                    >
                      {link.emoji}
                    </motion.span>
                    <span className="font-medium group-hover:translate-x-1 transition-transform duration-300">
                      {link.label}
                    </span>
                    <motion.span
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      initial={{ x: -10 }}
                      whileHover={{ x: 0 }}
                    >
                      →
                    </motion.span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Categories - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-1 bg-gradient-to-r from-[#ec4399] to-[#a855f7] rounded-full" />
              <span className="text-[#ffdd00]">Game Categories</span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat, index) => (
                <motion.span
                  key={cat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -3 }}
                  className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${cat.color} rounded-full text-sm font-medium cursor-pointer shadow-lg hover:shadow-xl transition-shadow`}
                >
                  <span className="text-lg">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider with animation */}
        <motion.div 
          className="relative my-12"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 -top-3 w-6 h-6 bg-[#1a1a2e] flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            <span className="text-xl">⭐</span>
          </motion.div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div 
          className="flex flex-col sm:flex-row justify-between items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.7 }}
        >
          {/* Copyright */}
          <p className="text-white/40 text-sm flex items-center gap-2">
            © {currentYear} {t('common.appName')}. Made with 
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ❤️
            </motion.span>
            for kids.
          </p>

          {/* Animated Stars */}
          <div className="flex gap-4">
            {['⭐', '🌟', '✨', '💫', '🎊'].map((star, i) => (
              <motion.span
                key={i}
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                whileHover={{ scale: 1.5 }}
                className="text-2xl cursor-pointer"
              >
                {star}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Fun Characters at Bottom - Enhanced */}
      <div className="relative h-24 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 flex justify-around px-8">
          {['🎨', '🃏', '🎯', '🧩', '🎮', '🧱', '🐤', '🐔'].map((emoji, i) => (
            <motion.span
              key={i}
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 15, opacity: 0.4 }}
              viewport={{ once: true }}
              transition={{ 
                delay: i * 0.08, 
                type: 'spring', 
                stiffness: 150,
                damping: 12
              }}
              whileHover={{ y: 0, opacity: 1, scale: 1.2 }}
              className="text-4xl md:text-5xl cursor-pointer transition-all duration-300"
            >
              {emoji}
            </motion.span>
          ))}
        </div>
        
        {/* Ground gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0d0d17] to-transparent" />
      </div>
    </footer>
  );
}
