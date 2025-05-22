import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from 'sonner';
import { Provider } from "@/config/Provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";
import { getMetadata } from "@/utils/getMetadata";


export const metadata = getMetadata({
  title: "BondCraft",
  description: "BondCraft is a secure and transparent token launchpad on the Sui blockchain, enabling creators to launch tokens, raise funds via bonding curves, and bootstrap liquidity with Cetus Protocol. Integrated with planned Pyth Network oracles and UNI meme token support, BondCraft empowers DeFi and Degen communities. Built for the Sui Overflow Hackathon.",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="w-full min-h-screen antialiased overflow-x-hidden font-poppins"
      >
        <Provider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </Provider>
      </body>
    </html>
  );
}
