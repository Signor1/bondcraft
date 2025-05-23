/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { FACTORY_ID } from "@/constant/Modules";
import { convertFromBaseUnits } from "@/utils/decimals";

interface Launchpad {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  currentPrice: number;
  tokensSold: number;
  fundingTokens: number;
  phase: "open" | "closed" | "bootstrapped";
  creator: string; // Added creator field
  decimals: number;
  k: number;
}

// Bonding curve price calculation function
const calculateBondingCurvePrice = (
  tokensSoldBase: number, // Base units of project token sold (1 token = 1e9 base units)
  k: number // Bonding curve constant from contract
): number => {
  // Constants must match contract's SCALING_FACTOR (1e24)
  const SCALING_FACTOR = 1e24;

  // Price calculation in base USDC units per base project token
  // Matches contract's formula: price = (k * tokens_sold) / SCALING_FACTOR
  const priceBaseUSDC = (k * tokensSoldBase) / SCALING_FACTOR;

  return priceBaseUSDC;
};

const useGetUserCreatedLaunchpads = () => {
  const suiClient = useSuiClient();
  const account = useCurrentAccount();
  const userAddress = account?.address;

  const getLaunchpadDetails = useCallback(
    async (launchpadId: string): Promise<Launchpad | null> => {
      try {
        // Fetch the launchpad object data
        const launchpadObject = await suiClient.getObject({
          id: launchpadId,
          options: {
            showContent: true,
            showDisplay: true,
          },
        });

        if (!launchpadObject.data) {
          console.error(`Launchpad object not found: ${launchpadId}`);
          return null;
        }

        // Extract data from launchpad object content
        const content = launchpadObject.data?.content;
        if (!content || content.dataType !== "moveObject") {
          return null;
        }

        const fields = content.fields as any;

        // Extract creator field
        const creator = fields.creator;

        // Extract nested fields correctly
        const params = fields.params?.fields || {};
        const state = fields.state?.fields || {};
        const metadata_id = fields.metadata_id;

        // Based on your example, metadata_id is a string
        const metadataId = metadata_id;

        if (!metadataId) {
          console.log(`No metadata ID found for launchpad: ${launchpadId}`);
          // Continue with default values instead of returning null
        }

        // Extract values safely with fallbacks
        const funding_tokens = Number(params.funding_tokens || 0);
        const tokens_sold = Number(state.tokens_sold || 0);
        const phase_num = Number(state.phase || 0);
        const k = Number(params.k || 0);
        const decimals = Number(params.decimals || 9);

        const humanReadableFunding = convertFromBaseUnits(
          BigInt(funding_tokens),
          decimals
        );
        const humanReadableSold = convertFromBaseUnits(
          BigInt(tokens_sold),
          decimals
        );

        let name = "Unknown Token";
        let symbol = "???";

        // Only try to fetch metadata if we have a valid ID
        if (metadataId) {
          try {
            const metadataObject = await suiClient.getObject({
              id: metadataId,
              options: {
                showContent: true,
                showDisplay: true,
              },
            });

            if (
              metadataObject.data?.content &&
              metadataObject.data.content.dataType === "moveObject"
            ) {
              const metadataFields = metadataObject.data.content.fields as any;
              name = metadataFields.name || name;
              symbol = metadataFields.symbol || symbol;
            }
          } catch (metadataError) {
            // If metadata fetch fails, use type information for fallback symbol
            console.warn(
              `Error fetching metadata for ${launchpadId}, using type info as fallback`,
              metadataError
            );

            // Extract token type from launchpad type as fallback
            if (content.type) {
              try {
                // Format is typically: ...<0x...::namespace::TokenName>
                const typeMatches = content.type.match(/<.*::(.*)::(.*)>/);
                if (typeMatches && typeMatches.length >= 3) {
                  symbol = typeMatches[2]; // Use token name from type
                  // For debugging
                  console.log(`Extracted fallback symbol from type: ${symbol}`);
                }
              } catch (e) {
                console.warn("Failed to extract symbol from type:", e);
              }
            }
          }
        }

        // Convert phase number to string type
        let phaseStr: "open" | "closed" | "bootstrapped";
        switch (phase_num) {
          case 0:
            phaseStr = "open";
            break;
          case 1:
            phaseStr = "closed";
            break;
          case 2:
            phaseStr = "bootstrapped";
            break;
          default:
            phaseStr = "open"; // Default case
        }

        const priceInUSDCBase = calculateBondingCurvePrice(tokens_sold, k);

        const currentPrice = priceInUSDCBase;

        return {
          id: launchpadId,
          name,
          symbol,
          tokensSold: humanReadableSold,
          fundingTokens: humanReadableFunding,
          currentPrice,
          phase: phaseStr,
          creator, // Include creator address
          decimals,
          k,
        };
      } catch (error) {
        console.error(
          `Error fetching launchpad details for ${launchpadId}:`,
          error
        );
        return null;
      }
    },
    [suiClient]
  );

  // Function to get all launchpad IDs from factory
  const getAllLaunchpadIds = useCallback(async () => {
    try {
      // Get the factory object
      const factoryObject = await suiClient.getObject({
        id: FACTORY_ID,
        options: {
          showContent: true,
        },
      });

      if (
        !factoryObject.data?.content ||
        factoryObject.data.content.dataType !== "moveObject"
      ) {
        throw new Error("Factory object not found or invalid");
      }

      // Extract all_launchpads array from factory
      const factoryFields = factoryObject.data.content.fields as any;
      const allLaunchpads = factoryFields.all_launchpads || [];

      console.log("Launchpad IDs found in factory:", allLaunchpads);

      // allLaunchpads is a plain array of strings based on your example
      return allLaunchpads;
    } catch (error) {
      console.error("Error fetching launchpad IDs:", error);
      throw error;
    }
  }, [suiClient]);

  const {
    data: userCreatedLaunchpads,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["user-launchpads", userAddress],
    queryFn: async () => {
      try {
        // If no user is connected, return empty array
        if (!userAddress) {
          return [];
        }

        // Get all launchpad IDs
        const launchpadIds = await getAllLaunchpadIds();

        if (!launchpadIds.length) {
          return [];
        }

        // Fetch details for each launchpad in parallel
        const launchpadDetailsPromises = launchpadIds.map(getLaunchpadDetails);
        const launchpadDetails = await Promise.all(launchpadDetailsPromises);

        // Filter out any null results
        const validLaunchpads = launchpadDetails.filter(Boolean) as Launchpad[];

        // Filter to only show launchpads created by the connected user
        const userLaunchpads = validLaunchpads.filter(
          (launchpad) => launchpad.creator === userAddress
        );

        console.log(
          `Found ${userLaunchpads.length} launchpads created by user ${userAddress}`
        );

        // Sort by funding progress (descending)
        return userLaunchpads.sort((a, b) => {
          // Avoid division by zero
          const aPercentage =
            a.fundingTokens > 0 ? a.tokensSold / a.fundingTokens : 0;
          const bPercentage =
            b.fundingTokens > 0 ? b.tokensSold / b.fundingTokens : 0;
          return bPercentage - aPercentage;
        });
      } catch (err) {
        console.error("Error fetching user launchpads:", err);
        toast.error("Failed to fetch your launchpads");
        throw err;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    // Only run query when we have both sui client and user address
    enabled: !!suiClient && !!userAddress,
  });

  return {
    userCreatedLaunchpads,
    isLoading,
    isError,
    error,
  };
};

export default useGetUserCreatedLaunchpads;
