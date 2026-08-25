import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Man Education",
  description: "Education Planner System",
  icons: {
    icon: "/logo.svg",
  },
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
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", figtree.variable)}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const ignoreAttrs = ['bis_skin_checked', 'bis_register'];
                
                // 1. Intercept setAttribute calls
                const origSetAttribute = Element.prototype.setAttribute;
                Element.prototype.setAttribute = function(name, value) {
                  if (ignoreAttrs.includes(name)) return;
                  origSetAttribute.call(this, name, value);
                };

                // 2. Clear any attributes already present or injected during parse
                const cleanup = (el) => {
                  if (!el || el.nodeType !== 1) return;
                  ignoreAttrs.forEach(attr => {
                    if (el.hasAttribute(attr)) el.removeAttribute(attr);
                  });
                  const children = el.querySelectorAll(ignoreAttrs.map(a => '[' + a + ']').join(','));
                  children.forEach(child => {
                    ignoreAttrs.forEach(attr => child.removeAttribute(attr));
                  });
                };

                // 3. Monitor DOM changes and clean up injected attributes immediately
                const observer = new MutationObserver((mutations) => {
                  mutations.forEach((m) => {
                    if (m.type === 'attributes' && ignoreAttrs.includes(m.attributeName)) {
                      m.target.removeAttribute(m.attributeName);
                    }
                    if (m.addedNodes) {
                      m.addedNodes.forEach(node => cleanup(node));
                    }
                  });
                });

                // Start observing as early as possible
                if (document.documentElement) {
                  observer.observe(document.documentElement, {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    attributeFilter: ignoreAttrs
                  });
                }

                // Run an initial cleanup on DOMContentLoaded
                document.addEventListener('DOMContentLoaded', () => cleanup(document.body));
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
