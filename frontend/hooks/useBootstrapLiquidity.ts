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

// Error code mappings from your Move contracts
const MOVE_ERROR_CODES = {
  // Launchpad errors
  1: "Invalid token allocation",
  2: "Invalid bonding curve parameters",
  5: "Invalid funding goal",
  6: "Invalid total supply",
  7: "Insufficient payment - you need more USDC for this purchase",
  8: "Invalid phase - launchpad must be in CLOSED phase to bootstrap liquidity",
  9: "Unauthorized access - only the creator can bootstrap liquidity",
  10: "Insufficient tokens available for sale",
  11: "Vesting not ready",
  12: "Excessive purchase - amount exceeds maximum allowed per transaction (1M tokens)",

  // Pool creation errors (from your pool.move)
  101: "Invalid tick range for liquidity pool",
  102: "Invalid liquidity amount - must be greater than 0",
  103: "Invalid tick spacing - must be 100, 500, or 3000",
  104: "Tick not aligned with tick spacing",
  105: "Insufficient liquidity - minimum 1000 tokens required for each coin",
  106: "Invalid price for pool creation",

  // Cetus protocol errors (common ones)
  201: "Pool already exists",
  202: "Invalid sqrt price",
  203: "Tick out of bounds",
  204: "Insufficient coin amounts",
  205: "Pool creation failed",
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

  // Helper function to parse Move abort errors
  const parseMoveAbortError = useCallback((error: any): string => {
    // Try different ways to get the error string
    const errorString =
      error?.toString() || error?.message || String(error) || "";

    // Enhanced patterns to catch various error formats
    const patterns = [
      // Standard MoveAbort patterns
      /MoveAbort\([^,]+,\s*(\d+)\)/,
      /MoveAbort\([^)]+\)\s*,\s*(\d+)\)/,
      /}, (\d+)\) in command/,
      /abort_code:\s*(\d+)/,
      /error_code:\s*(\d+)/,

      // Cetus-specific patterns
      /CetusError\((\d+)\)/,
      /PoolCreationError\((\d+)\)/,
      /InsufficientLiquidity\((\d+)\)/,

      // Pool module specific patterns
      /EInvalidTickRange/,
      /EInvalidLiquidity/,
      /EInvalidTickSpacing/,
      /ETickNotAligned/,
      /EInsufficientLiquidity/,
      /EInvalidPrice/,
    ];

    // Check for named errors first
    if (errorString.includes("EInvalidTickRange"))
      return "Error: Invalid tick range for liquidity pool";
    if (errorString.includes("EInvalidLiquidity"))
      return "Error: Invalid liquidity amount";
    if (errorString.includes("EInvalidTickSpacing"))
      return "Error: Invalid tick spacing - must be 100, 500, or 3000";
    if (errorString.includes("ETickNotAligned"))
      return "Error: Tick not aligned with tick spacing";
    if (errorString.includes("EInsufficientLiquidity"))
      return "Error: Insufficient liquidity for pool creation";
    if (errorString.includes("EInvalidPrice"))
      return "Error: Invalid price for pool creation";

    // Check for numeric error codes
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

    // Check for common transaction failures
    if (errorString.includes("InsufficientGas")) {
      return "Insufficient gas for transaction. Please increase gas budget.";
    }
    if (errorString.includes("ObjectNotFound")) {
      return "Required object not found. Please check launchpad ID and metadata IDs.";
    }
    if (errorString.includes("InvalidObjectOwner")) {
      return "Invalid object ownership. Please verify you have the correct permissions.";
    }
    if (errorString.includes("PackageNotFound")) {
      return "Smart contract package not found. Please check package deployment.";
    }

    // Return the original error if we can't parse it
    return (
      errorString ||
      "An unexpected error occurred during liquidity bootstrapping"
    );
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
            showBalanceChanges: true,
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

        // Parse the error
        const errorMessage = parseMoveAbortError(error);

        // Show detailed error message to user
        toast.error(`❌ Failed to bootstrap liquidity: ${errorMessage}`, {
          position: "top-right",
          duration: 8000, // Show error longer so user can read it
        });

        console.error("Bootstrap liquidity error:", {
          error,
          errorMessage,
        });
      }
    },
    [
      account,
      signAndExecuteTransaction,
      waitForTransaction,
      queryClient,
      parseMoveAbortError,
    ]
  );
};

export default useBootstrapLiquidity;
