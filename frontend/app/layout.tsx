import type { Metadata } from "next";
import "@/styles/globals.css";
import { Toaster } from 'sonner';
import { Provider } from "@/config/Provider";
import { ThemeProvider } from "@/components/shared/theme-provider";
import Navbar from "@/components/shared/navbar";
import Footer from "@/components/shared/footer";


export const metadata: Metadata = {
  title: "BondCraft | Decentralized Token Launchpad on Sui",
  description:
    "BondCraft is a secure and transparent token launchpad on the Sui blockchain, enabling creators to launch tokens, raise funds via bonding curves, and bootstrap liquidity with Cetus Protocol. Integrated with planned Pyth Network oracles and UNI meme token support, BondCraft empowers DeFi and Degen communities. Built for the Sui Overflow Hackathon.",
  keywords: [
    "BondCraft",
    "Sui",
    "token launchpad",
    "decentralized finance",
    "DeFi",
    "Degen",
    "Cetus Protocol",
    "Pyth Network",
    "Unicoinsui",
    "bonding curve",
    "token sale",
    "blockchain",
    "Sui Overflow Hackathon",
  ],
  openGraph: {
    title: "BondCraft | Launch Tokens on Sui",
    description:
      "Create and fund tokens with BondCraft's decentralized launchpad on Sui. Features bonding curve pricing, Cetus liquidity pools, and upcoming Pyth/UNI integrations for DeFi and meme token launches.",
    url: "https://bondcraft.sui.io", // Replace with your deployed URL
    siteName: "BondCraft",
    images: [
      {
        url: "https://bondcraft.sui.io/og-image.png", // Replace with your OG image URL (e.g., logo or screenshot)
        width: 1200,
        height: 630,
        alt: "BondCraft Token Launchpad",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BondCraft | Decentralized Token Launchpad on Sui",
    description:
      "Launch tokens with BondCraft on Sui! Secure funding, Cetus pools, and Pyth/UNI integrations for DeFi and Degen projects. #Sui #BondCraft #Hackathon",
    images: ["https://bondcraft.sui.io/og-image.png"], // Replace with your Twitter image URL
    creator: "@BondCraftSui", // Replace with your Twitter handle
  },
  icons: {
    icon: "/favicon.ico", // Replace with your favicon path
    apple: "/apple-touch-icon.png", // Replace with your Apple touch icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="w-full min-h-screen antialiased overflow-x-hidden"
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
