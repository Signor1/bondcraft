/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { FACTORY_ID } from "@/constant/Modules";

interface Launchpad {
  id: string;
  name: string;
  symbol: string;
  logoUrl?: string;
  currentPrice: number;
  tokensSold: number;
  fundingTokens: number;
  phase: "open" | "closed" | "bootstrapped";
}

// Bonding curve price calculation function
const calculateBondingCurvePrice = (
  tokensSold: number,
  decimals: number,
  k: number
): number => {
  return k * (tokensSold / Math.pow(10, decimals));
};

const useGetAllLaunchpads = () => {
  const suiClient = useSuiClient();

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

        // Extract nested fields correctly
        const params = fields.params?.fields || {};
        const state = fields.state?.fields || {};
        const metadata_id = fields.metadata_id;

        const metadataId = metadata_id;

        // Extract values safely with fallbacks
        const funding_tokens = Number(params.funding_tokens || 0);
        const tokens_sold = Number(state.tokens_sold || 0);
        const phase_num = Number(state.phase || 0);
        const k = Number(params.k || 0);
        const decimals = Number(params.decimals || 9);

        let name = "Unknown Token";
        let symbol = "???";

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

        // Calculate current price using the bonding curve formula
        const currentPrice = calculateBondingCurvePrice(
          tokens_sold,
          decimals,
          k
        );

        return {
          id: launchpadId,
          name,
          symbol,
          tokensSold: tokens_sold,
          fundingTokens: funding_tokens,
          currentPrice,
          phase: phaseStr,
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

      // Extract all_launchpads vector from factory
      const factoryFields = factoryObject.data.content.fields as any;
      const allLaunchpads = factoryFields.all_launchpads || [];

      // Return array of launchpad IDs
      return allLaunchpads;
    } catch (error) {
      console.error("Error fetching launchpad IDs:", error);
      throw error;
    }
  }, [suiClient]);

  const {
    data: launchpads,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["launchpads"],
    queryFn: async () => {
      try {
        // Get all launchpad IDs
        const launchpadIds = await getAllLaunchpadIds();

        if (!launchpadIds.length) {
          return [];
        }

        // Fetch details for each launchpad in parallel
        const launchpadDetailsPromises = launchpadIds.map(getLaunchpadDetails);
        const launchpadDetails = await Promise.all(launchpadDetailsPromises);

        // Filter out any null results and sort by most funded first (default sort)
        const validLaunchpads = launchpadDetails.filter(Boolean) as Launchpad[];

        if (validLaunchpads.length === 0 && launchpadIds.length > 0) {
          console.warn(
            `No valid launchpads were processed despite finding ${launchpadIds.length} IDs`
          );
        }

        return validLaunchpads.sort((a, b) => {
          // Avoid division by zero
          const aPercentage =
            a.fundingTokens > 0 ? a.tokensSold / a.fundingTokens : 0;
          const bPercentage =
            b.fundingTokens > 0 ? b.tokensSold / b.fundingTokens : 0;
          return bPercentage - aPercentage; // Sort by funding progress (descending)
        });
      } catch (err) {
        console.error("Error fetching launchpads:", err);
        toast.error("Failed to fetch launchpads");
        throw err;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: !!suiClient,
  });

  console.log("Launchpads:", launchpads);

  return {
    launchpads,
    isLoading,
    isError,
    error,
  };
};

export default useGetAllLaunchpads;
