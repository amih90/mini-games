import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, getLocaleDirection, type Locale } from '@/i18n/routing';
import { Footer } from '@/components/Footer';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for this locale
  const messages = await getMessages();

  // Determine text direction
  const dir = getLocaleDirection(locale as Locale);

  return (
    <div lang={locale} dir={dir} className="min-h-screen flex flex-col">
      <NextIntlClientProvider messages={messages}>
        <div className="flex-1">
          {children}
        </div>
        <Footer />
      </NextIntlClientProvider>
    </div>
  );
}
