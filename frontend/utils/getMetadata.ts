import type { Metadata } from "next";

const isProduction = process.env.NODE_ENV === "production";
const baseUrl = isProduction
  ? "https://bondcraft.vercel.app/"
  : `http://localhost:${process.env.PORT || 3000}`;

const titleTemplate = "%s | Decentralized Token Launchpad on Sui";

/**
 * Generates metadata for a given page.
 *
 * @param {Object} options
 * @param {string} options.title Page title
 * @param {string} options.description Page description
 * @param {string} [options.imageRelativePath="/thumbnail.png"] Relative path to the image for the page
 * @returns {Metadata} The generated metadata
 */
export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.png",
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
}): Metadata => {
  const imageUrl = `${baseUrl}${imageRelativePath}`;

  return {
    generator: "BondCraft Team",
    applicationName: "BondCraft",
    referrer: "origin-when-cross-origin",
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
    creator: "BondCraft Team",
    publisher: "SignorDev",
    metadataBase: new URL(baseUrl),
    manifest: `${baseUrl}/manifest.json`,
    alternates: {
      canonical: baseUrl,
    },
    robots: {
      index: false,
      follow: true,
      nocache: true,
      googleBot: {
        index: true,
        follow: false,
        noimageindex: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    title: {
      default: title,
      template: titleTemplate,
    },
    description: description,
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description:
        "Create and fund tokens with BondCraft's decentralized launchpad on Sui. Features bonding curve pricing, Cetus liquidity pools, and upcoming Pyth/UNI integrations for DeFi and meme token launches.",
      images: [
        {
          url: imageUrl,
          alt: "BondCraft - Launch Tokens on Sui",
        },
      ],
      type: "website",
      siteName: "BondCraft",
      locale: "en_US",
      url: "https://bondcraft.vercel.app/",
    },
    twitter: {
      card: "summary_large_image", // Ensures Twitter uses a large image for the preview
      title: {
        default: title,
        template: titleTemplate,
      },
      description:
        "Launch tokens with BondCraft on Sui! Secure funding, Cetus pools, and Pyth/UNI integrations for DeFi and Degen projects. #Sui #BondCraft #Hackathon",
      creator: "@BondCraftSui",
      images: [
        {
          url: imageUrl,
          alt: "BondCraft - Launch Tokens on Sui",
        },
      ],
    },
    icons: {
      icon: [
        {
          url: `/favicon-32x32.png`, // Standard favicon for browsers
          sizes: "32x32",
          type: "image/png",
        },
        {
          url: `/favicon-16x16.png`, // Smaller favicon for some contexts
          sizes: "16x16",
          type: "image/png",
        },
        {
          url: `/android-chrome-192x192.png`, // Icon for mobile devices and apps
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: `/android-chrome-512x512.png`, // High-resolution icon for apps/PWAs
          sizes: "512x512",
          type: "image/png",
        },
      ],
      apple: [
        {
          url: `/apple-touch-icon.png`, // Apple touch icon for iOS devices
          sizes: "180x180",
          type: "image/png",
        },
      ],
      shortcut: [
        {
          url: `/favicon.ico`, // ICO format for legacy browsers
          sizes: "48x48",
          type: "image/x-icon",
        },
      ],
      other: [
        {
          url: `/android-chrome-192x192.png`, // Manifest icon for web app manifest
          sizes: "192x192",
          type: "image/png",
        },
        {
          url: `/android-chrome-512x512.png`, // Larger manifest icon
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
  };
};
