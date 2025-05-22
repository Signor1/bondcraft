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
import { PACKAGE_ID, USDC_TYPE } from "@/constant/Modules";
import type { SuiSignAndExecuteTransactionOutput } from "@mysten/wallet-standard";
import { getFullnodeUrl } from "@mysten/sui/client";

// Error code mappings from your Move contract
const MOVE_ERROR_CODES = {
  1: "Invalid token allocation",
  2: "Invalid bonding curve parameters",
  5: "Invalid funding goal",
  6: "Invalid total supply",
  7: "Insufficient payment - you need more USDC for this purchase",
  8: "Invalid phase - launchpad is not currently accepting purchases",
  9: "Unauthorized access",
  10: "Insufficient tokens available for sale",
  11: "Vesting not ready",
  12: "Excessive purchase - amount exceeds maximum allowed per transaction (1M tokens)",
} as const;

const useCloseFunding = () => {
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

  // Helper function to parse Move abort errors
  const parseMoveAbortError = useCallback((error: any): string => {
    // Try different ways to get the error string
    const errorString =
      error?.toString() || error?.message || String(error) || "";

    // Multiple regex patterns to catch different formats
    const patterns = [
      /MoveAbort\([^,]+,\s*(\d+)\)/,
      /MoveAbort\([^)]+\)\s*,\s*(\d+)\)/,
      /}, (\d+)\) in command/,
      /abort_code:\s*(\d+)/,
      /error_code:\s*(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = errorString.match(pattern);
      if (match) {
        const errorCode = parseInt(match[1]);

        const errorMessage =
          MOVE_ERROR_CODES[errorCode as keyof typeof MOVE_ERROR_CODES];

        if (errorMessage) {
          return `Error Code ${errorCode}: ${errorMessage}`;
        } else {
          return `Move Error Code ${errorCode}: Unknown error occurred`;
        }
      }
    }

    // Fallback
    return errorString || "An unexpected error occurred";
  }, []);

  // Helper function to wait for transaction to be confirmed
  const waitForTransaction = useCallback(
    async (digest: string) => {
      try {
        // Wait for transaction to be processed
        await suiClient.waitForTransaction({ digest });

        // Fetch transaction details with all relevant data
        return await suiClient.getTransactionBlock({
          digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
            showInput: true,
            showEvents: true,
          },
        });
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
      typeOfCoin,
    }: {
      launchpadId: string;
      typeOfCoin: string;
    }) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

      // Loading toast for user feedback
      const loadingToast = toast.loading(`Closing funding phase...`);

      try {
        // Build transaction
        const txb = new Transaction();

        // Call close_funding on the launchpad module
        txb.moveCall({
          target: `${PACKAGE_ID}::launchpad::close_funding`,
          arguments: [txb.object(launchpadId)],
          typeArguments: [typeOfCoin],
        });

        // Set gas budget
        txb.setGasBudget(500000000); // 0.5 SUI

        toast.loading(`Processing transaction...`, {
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
        toast.loading("Waiting for transaction confirmation...", {
          id: loadingToast,
        });

        const txBlock = await waitForTransaction(result.digest);

        // Check for success by looking at status in effects
        const status = txBlock.effects?.status?.status;

        if (status !== "success") {
          const error = txBlock.effects?.status?.error || "Unknown error";
          throw new Error(`Transaction failed: ${error}`);
        }

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(`Successfully closed funding for ${launchpadId}!`, {
          position: "top-right",
        });

        // Invalidate queries to refresh the launchpad data
        queryClient.invalidateQueries({ queryKey: ["launchpads"] });
        queryClient.invalidateQueries({ queryKey: ["launchpad"] });
        queryClient.invalidateQueries({ queryKey: ["user-launchpads"] });
      } catch (error: any) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Parse the error
        const errorMessage = parseMoveAbortError(error);

        // Show detailed error message to user
        toast.error(errorMessage, {
          position: "top-right",
          duration: 8000, // Show error longer so user can read it
        });
      }
    },
    [
      account,
      signAndExecuteTransaction,
      waitForTransaction,
      queryClient,
      suiClient,
      parseMoveAbortError,
    ]
  );
};

export default useCloseFunding;
