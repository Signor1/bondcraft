/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  PACKAGE_ID,
  USDC_TESTNET_METADATA_ID,
  USDC_TYPE,
} from "@/constant/Modules";
import type { SuiSignAndExecuteTransactionOutput } from "@mysten/wallet-standard";
import { getFullnodeUrl } from "@mysten/sui/client";
import { SuiClientErrorDecoder } from "suiclient-error-decoder";
import { bondCraftErrorCodes } from "@/utils/bondCraftErrorCodes";

// Cetus Protocol Constants
const CETUS_CONSTANTS = {
  // GlobalConfig object ID
  GLOBAL_CONFIG:
    "0x9774e359588ead122af1c7e7f64e14ade261cfeecdb5d0eb4a5b3b4c8ab8bd3e",
  // Pools object ID
  POOLS: "0x50eb61dd5928cec5ea04711a2e9b72e5237e79e9fbcd2ce3d5469dc8708e0ee2",
  // Clock object (standard Sui clock)
  CLOCK: "0x6",
  USDC_TYPE,
  USDC_METADATA_ID: USDC_TESTNET_METADATA_ID,
} as const;

const useBootstrapLiquidity = () => {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  // Create SUI client for fetching complete transaction data
  const suiClient = useMemo(
    () =>
      new SuiClient({
        url: getFullnodeUrl("testnet"), // Use the appropriate network URL
      }),
    []
  );

  // Error code mappings from your Move contract
  const errorDecoder = useMemo(
    () =>
      new SuiClientErrorDecoder({
        customErrorCodes: bondCraftErrorCodes,
      }),
    []
  );

  // Helper function to wait for transaction to be confirmed
  const waitForTransaction = useCallback(
    async (digest: string) => {
      try {
        // Wait for transaction to be processed
        await suiClient.waitForTransaction({ digest });

        // Fetch transaction details with all relevant data
        const txBlock = await suiClient.getTransactionBlock({
          digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showInput: true,
            showEvents: true,
            showBalanceChanges: true,
          },
        });

        if (txBlock.effects?.status.status !== "success") {
          // Throw the raw Move abort error string
          throw new Error(txBlock.effects?.status.error);
        }

        return txBlock;
      } catch (error) {
        console.error("Error waiting for transaction:", error);
        throw error;
      }
    },
    [suiClient]
  );

  return useCallback(
    async ({
      launchpadId,
      tokenMetadataId,
      typeOfCoin,
    }: {
      launchpadId: string;
      tokenMetadataId: string;
      typeOfCoin: string;
    }) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

      if (!tokenMetadataId) {
        toast.error("Token metadata ID is required");
        return;
      }

      // Loading toast for user feedback
      const loadingToast = toast.loading("Preparing to bootstrap liquidity...");

      try {
        // Build transaction
        const txb = new Transaction();

        toast.loading("Building bootstrap transaction...", {
          id: loadingToast,
        });

        // Call buy_tokens on the launchpad module
        txb.moveCall({
          target: `${PACKAGE_ID}::launchpad::bootstrap_liquidity`,
          arguments: [
            txb.object(launchpadId), // launchpad: &mut Launchpad<T>
            txb.object(CETUS_CONSTANTS.GLOBAL_CONFIG), // cetus_config: &GlobalConfig
            txb.object(CETUS_CONSTANTS.POOLS), // pools: &mut Pools
            txb.object(tokenMetadataId), // metadata_t: &CoinMetadata<T>
            txb.object(CETUS_CONSTANTS.USDC_METADATA_ID), // metadata_usdc: &CoinMetadata<USDC>
            txb.object(CETUS_CONSTANTS.CLOCK), // clock: &Clock
          ],
          typeArguments: [typeOfCoin],
        });

        // Set gas budget
        txb.setGasBudget(3000000000); // 3 SUI

        toast.loading("Signing and executing transaction...", {
          id: loadingToast,
        });

        // Sign and execute the transaction
        const result: SuiSignAndExecuteTransactionOutput =
          await signAndExecuteTransaction({
            transaction: txb,
            account,
            chain: "sui:testnet",
          });

        // Wait for transaction to be confirmed
        toast.loading("Confirming transaction...", { id: loadingToast });

        const txBlock = await waitForTransaction(result.digest);
        const status = txBlock.effects?.status?.status;

        if (status !== "success") {
          const error = txBlock.effects?.status?.error || "Transaction failed";
          throw new Error(error);
        }

        // Parse events for detailed success information
        const events = txBlock.events || [];
        const liquidityEvent = events.find(
          (e) =>
            e.type.includes("LiquidityBootstrappedEvent") ||
            e.type.includes("PoolCreatedEvent")
        );

        let successDetails = "";

        if (liquidityEvent) {
          const eventData = liquidityEvent.parsedJson as any;
          if (eventData?.final_price) {
            successDetails = ` | Final Price: ${eventData.final_price}`;
          }
          if (eventData?.fee_tier) {
            successDetails += ` | Fee Tier: ${eventData.fee_tier}`;
          }
        }

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(
          `🎉 Liquidity successfully bootstrapped to Cetus Protocol${successDetails}`,
          {
            position: "top-right",
            duration: 8000,
          }
        );

        // Invalidate queries to refresh the launchpad data
        queryClient.invalidateQueries({ queryKey: ["launchpads"] });
        queryClient.invalidateQueries({ queryKey: ["launchpad", launchpadId] });
        queryClient.invalidateQueries({ queryKey: ["user-launchpads"] });
      } catch (error: any) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Parse error message
        const decoded = errorDecoder.parseError(error);

        // Show detailed error message to user
        toast.error(`${decoded.message}`, {
          position: "top-right",
          duration: 10000, // Show error longer so user can read it
        });

        console.error("Bootstrap liquidity error:", decoded);
      }
    },
    [
      account,
      signAndExecuteTransaction,
      waitForTransaction,
      queryClient,
      errorDecoder,
    ]
  );
};

export default useBootstrapLiquidity;
