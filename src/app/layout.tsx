import type { Metadata } from "next";
import {
  Inter,
  Geist,
  Poppins,
  Montserrat,
  DM_Sans,
  Space_Grotesk,
  Playfair_Display,
  Source_Serif_4,
  Geist_Mono,
  JetBrains_Mono,
  Roboto_Mono,
} from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfirmProvider } from "@/components/confirm-dialog";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { CSS_STORAGE_KEY, STYLE_ELEMENT_ID } from "@/lib/theme-config";
import "./globals.css";

// Selectable fonts for the theme customizer. Each exposes a CSS variable that
// the semantic `--font-sans/heading/mono` tokens can be pointed at. Only the
// defaults are preloaded to keep the initial payload small; the rest load on
// demand when a user picks them. The `varName` values here mirror
// SANS_FONTS / MONO_FONTS in lib/theme-config.ts — keep both in sync.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"], display: "swap", preload: false });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", preload: false });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], display: "swap", preload: false });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], display: "swap", preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], display: "swap", preload: false });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], display: "swap", preload: false });
const sourceSerif = Source_Serif_4({ variable: "--font-source-serif", subsets: ["latin"], display: "swap", preload: false });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], display: "swap", preload: false });
const robotoMono = Roboto_Mono({ variable: "--font-roboto-mono", subsets: ["latin"], display: "swap", preload: false });

const fontVariables = [
  inter,
  geist,
  poppins,
  montserrat,
  dmSans,
  spaceGrotesk,
  playfair,
  sourceSerif,
  geistMono,
  jetbrainsMono,
  robotoMono,
]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Static admin dashboard with Postgres connection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontVariables} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          // Set the theme class AND re-inject the saved theme customization
          // before paint to avoid a flash of the wrong theme/colors. Server-
          // rendered, so it runs on first load without React warning about
          // client-rendered inline scripts.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('theme')||'light';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}d.classList.remove('light','dark');d.classList.add(t);d.style.colorScheme=t;var css=localStorage.getItem('${CSS_STORAGE_KEY}');if(css){var s=document.createElement('style');s.id='${STYLE_ELEMENT_ID}';s.textContent=css;document.head.appendChild(s);}}catch(e){}})();`,
          }}
        />
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </body>
    </html>
  );
}
