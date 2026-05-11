import { ClerkProvider } from '@clerk/nextjs';
import type { AppProps } from 'next/app';
import { LanguageProvider } from '../i18n/LanguageContext';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </ClerkProvider>
  );
}