import { ClerkProvider } from "@clerk/nextjs";
import type { AppProps } from "next/app";
import { appWithTranslation } from "next-i18next/pages";
import "react-datepicker/dist/react-datepicker.css";
import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClerkProvider {...pageProps}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default appWithTranslation(MyApp);
