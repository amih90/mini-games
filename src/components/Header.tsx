'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LocaleDropdown } from '@/features/common/LocaleDropdown';

interface HeaderProps {
  variant?: 'default' | 'transparent' | 'solid';
}

export function Header({ variant = 'default' }: HeaderProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '/', label: t('common.home'), icon: '🏠' },
    { href: '/games', label: t('common.games'), icon: '🎮' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled || variant === 'solid'
          ? 'bg-[#1a1a2e]/95 backdrop-blur-xl shadow-2xl'
          : variant === 'transparent'
          ? 'bg-transparent'
          : 'bg-[#1a1a2e]/80 backdrop-blur-md'
      }`}
    >
      {/* Gradient border at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#6cbe45] via-[#ffdd00] to-[#ec4399]" />

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center gap-3 group"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Logo icon with glow */}
              <motion.div
                className="relative"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="absolute inset-0 bg-[#ffdd00] rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="relative w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#ffdd00] to-[#f7941d] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-xl md:text-2xl">🎮</span>
                </div>
              </motion.div>

              {/* Logo text */}
              <div className="hidden sm:block">
                <motion.span
                  className="text-xl md:text-2xl font-black bg-gradient-to-r from-white via-[#ffdd00] to-white bg-clip-text text-transparent bg-[length:200%_100%]"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                >
                  {t('common.appName')}
                </motion.span>
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <motion.div
                  className={`relative px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isActive(link.href)
                      ? 'text-[#1a1a2e]'
                      : 'text-white/80 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Active background */}
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-[#ffdd00] to-[#f7941d] rounded-xl shadow-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Hover background */}
                  {!isActive(link.href) && (
                    <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity" />
                  )}

                  <span className="relative z-10 text-lg">{link.icon}</span>
                  <span className="relative z-10">{link.label}</span>
                </motion.div>
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            {/* Language Dropdown */}
            <LocaleDropdown />

            {/* Mobile menu button */}
            <motion.button
              className="md:hidden w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <motion.div
                animate={isMobileMenuOpen ? 'open' : 'closed'}
                className="w-5 h-4 flex flex-col justify-between"
              >
                <motion.span
                  className="w-full h-0.5 bg-white rounded-full origin-left"
                  variants={{
                    open: { rotate: 45, y: -2 },
                    closed: { rotate: 0, y: 0 },
                  }}
                />
                <motion.span
                  className="w-full h-0.5 bg-white rounded-full"
                  variants={{
                    open: { opacity: 0, x: -10 },
                    closed: { opacity: 1, x: 0 },
                  }}
                />
                <motion.span
                  className="w-full h-0.5 bg-white rounded-full origin-left"
                  variants={{
                    open: { rotate: -45, y: 2 },
                    closed: { rotate: 0, y: 0 },
                  }}
                />
              </motion.div>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#1a1a2e]/98 backdrop-blur-xl border-t border-white/10"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                        isActive(link.href)
                          ? 'bg-gradient-to-r from-[#ffdd00] to-[#f7941d] text-[#1a1a2e]'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.label}</span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
