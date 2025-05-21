/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";

interface LaunchParams {
  totalSupply: number;
  fundingTokens: number;
  creatorTokens: number;
  liquidityTokens: number;
  platformTokens: number;
  fundingGoal: number;
  k: number;
  decimals: number;
}

interface LaunchState {
  phase: number;
  tokensSold: number;
}

interface TokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  logoUrl?: string;
}

export interface LaunchpadDetails {
  id: string;
  creator: string;
  fundingBalance: number;
  metadataId: string;
  params: LaunchParams;
  platformAdmin: string;
  state: LaunchState;
  vestingStartEpoch: number;
  metadata: TokenMetadata;
  currentPrice: number;
  progress: number; // Funding progress as percentage
  phaseStr: "open" | "closed" | "bootstrapped";
}

const calculateBondingCurvePrice = (
  tokensSold: number,
  decimals: number,
  k: number
): number => {
  // Contract always uses 9 decimals for price calculation
  return k * (tokensSold / Math.pow(10, decimals));
};

const useGetLaunchpadDetails = (launchpadId: string | undefined) => {
  const suiClient = useSuiClient();

  const getLaunchpadDetail = useCallback(
    async (id: string): Promise<LaunchpadDetails | null> => {
      try {
        // Fetch the launchpad object data
        const launchpadObject = await suiClient.getObject({
          id,
          options: {
            showContent: true,
            showDisplay: true,
          },
        });

        if (!launchpadObject.data) {
          console.error(`Launchpad object not found: ${id}`);
          return null;
        }

        // Extract data from launchpad object content
        const content = launchpadObject.data?.content;
        if (!content || content.dataType !== "moveObject") {
          console.error(`Invalid content for launchpad: ${id}`);
          return null;
        }

        const fields = content.fields as any;

        // Extract nested fields correctly - matching contract field names
        const params = fields.params?.fields || {};
        const state = fields.state?.fields || {};
        const metadataId = fields.metadata_id;
        const creator = fields.creator;
        const platformAdmin = fields.platform_admin;
        const fundingBalance = Number(fields.funding_balance || 0);
        const vestingStartEpoch = Number(fields.vesting_start_epoch || 0);

        // Default metadata values
        let metadata: TokenMetadata = {
          name: "Unknown Token",
          symbol: "???",
        };

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
              metadata = {
                name: metadataFields.name || metadata.name,
                symbol: metadataFields.symbol || metadata.symbol,
                description: metadataFields.description,
                logoUrl: metadataFields.logo_url || metadataFields.logoUrl,
              };
            }
          } catch (metadataError) {
            console.warn(
              `Error fetching metadata for ${id}, using type info as fallback`,
              metadataError
            );

            // Extract token type from launchpad type as fallback
            if (content.type) {
              try {
                // Format is typically: ...<0x...::namespace::TokenName>
                const typeMatches = content.type.match(/<.*::(.*)::(.*)>/);
                if (typeMatches && typeMatches.length >= 3) {
                  metadata.symbol = typeMatches[2]; // Use token name from type
                  // For debugging
                  console.log(
                    `Extracted fallback symbol from type: ${metadata.symbol}`
                  );
                }
              } catch (e) {
                console.warn("Failed to extract symbol from type:", e);
              }
            }
          }
        }

        // Convert all values to numbers - be explicit about field names from contract
        const k = Number(params.k || 0);
        const decimals = Number(params.decimals || 9);
        const tokensSold = Number(state.tokens_sold || 0);
        const fundingGoal = Number(params.funding_goal || 0);
        const fundingTokens = Number(params.funding_tokens || 0);
        const totalSupply = Number(params.total_supply || 0);
        const creatorTokens = Number(params.creator_tokens || 0);
        const liquidityTokens = Number(params.liquidity_tokens || 0);
        const platformTokens = Number(params.platform_tokens || 0);
        const phase = Number(state.phase || 0);

        // Calculate current price using bonding curve formula
        const currentPrice = calculateBondingCurvePrice(
          tokensSold,
          decimals,
          k
        );

        // Calculate funding progress (percentage)
        const progress =
          fundingTokens > 0 ? (tokensSold / fundingTokens) * 100 : 0;

        // Convert phase number to string type - match contract constants
        // PHASE_OPEN = 0, PHASE_CLOSED = 1, PHASE_LIQUIDITY_BOOTSTRAPPED = 2
        let phaseStr: "open" | "closed" | "bootstrapped";
        switch (phase) {
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

        return {
          id,
          creator,
          fundingBalance,
          metadataId,
          platformAdmin,
          vestingStartEpoch,
          params: {
            totalSupply,
            decimals,
            fundingGoal,
            fundingTokens,
            k,
            liquidityTokens,
            creatorTokens,
            platformTokens,
          },
          state: {
            phase,
            tokensSold,
          },
          metadata,
          currentPrice,
          progress,
          phaseStr,
        };
      } catch (error) {
        console.error(`Error fetching launchpad details for ${id}:`, error);
        return null;
      }
    },
    [suiClient]
  );

  const {
    data: launchpad,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["launchpad", launchpadId],
    queryFn: async () => {
      if (!launchpadId) {
        return null;
      }

      try {
        const details = await getLaunchpadDetail(launchpadId);
        if (!details) {
          toast.error(`Failed to fetch launchpad: ${launchpadId}`);
          return null;
        }
        return details;
      } catch (err) {
        console.error(`Error fetching launchpad ${launchpadId}:`, err);
        toast.error(`Failed to fetch launchpad: ${launchpadId}`);
        throw err;
      }
    },
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    enabled: !!suiClient && !!launchpadId,
  });

  useEffect(() => {
    if (launchpadId) {
      refetch();
    }
  }, [launchpadId, refetch]);

  return {
    launchpad,
    isLoading,
    isError,
    error,
    refetch,
  };
};

export default useGetLaunchpadDetails;
