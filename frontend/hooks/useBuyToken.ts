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
import { convertToBaseUnits } from "@/utils/decimals";
import { SuiClientErrorDecoder } from "suiclient-error-decoder";
import { bondCraftErrorCodes } from "@/utils/bondCraftErrorCodes";

const useBuyToken = () => {
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

  // Instance of SuiClientErrorDecoder
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
      tokenAmount,
      estimatedCost,
      typeOfCoin,
    }: {
      launchpadId: string;
      tokenAmount: number;
      estimatedCost: string;
      typeOfCoin: string;
    }) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

      if (tokenAmount <= 0 || tokenAmount > 1000000) {
        toast.error("Invalid token amount. Must be between 1 and 1,000,000");
        return;
      }

      // Loading toast for user feedback
      const loadingToast = toast.loading(
        `Buying ${tokenAmount.toLocaleString()} tokens...`
      );

      try {
        // Fetch USDC coin object
        const { data: coins } = await suiClient.getCoins({
          owner: account.address,
          coinType: USDC_TYPE,
        });

        toast.loading(`Fetching USDC coin object...`, {
          id: loadingToast,
        });

        if (!coins || coins.length === 0) {
          throw new Error("No USDC coins found");
        }

        const sortedCoins = coins.sort((a, b) =>
          BigInt(b.balance) > BigInt(a.balance)
            ? 1
            : BigInt(b.balance) < BigInt(a.balance)
            ? -1
            : 0
        );
        const coinWithHighestBalance = sortedCoins[0];
        const usdcCoinObjectId = coinWithHighestBalance.coinObjectId;

        // Build transaction
        const txb = new Transaction();

        // Call buy_tokens on the launchpad module
        txb.moveCall({
          target: `${PACKAGE_ID}::launchpad::buy_tokens`,
          arguments: [
            txb.object(launchpadId), // Launchpad object ID
            txb.object(usdcCoinObjectId), // USDC coin object
            txb.pure.u64(convertToBaseUnits(tokenAmount, 9).toString()), // Amount of tokens to buy
          ],
          typeArguments: [typeOfCoin],
        });

        // Set gas budget
        txb.setGasBudget(500000000); // 0.5 SUI

        // Update loading message
        toast.loading(`Processing payment of ~${estimatedCost} USDC...`, {
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
        toast.success(
          `Successfully purchased ${tokenAmount.toLocaleString()} tokens!`,
          {
            position: "top-right",
          }
        );

        // Invalidate queries to refresh the launchpad data
        queryClient.invalidateQueries({ queryKey: ["launchpads"] });
        queryClient.invalidateQueries({ queryKey: ["launchpad", launchpadId] });
        queryClient.invalidateQueries({ queryKey: ["user-launchpads"] });
      } catch (error: any) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);
        // Show error message to user
        const decoded = errorDecoder.parseError(error);

        // Show detailed error message to user
        toast.error(`${decoded.message}`, {
          position: "top-right",
          duration: 10000, // Show error longer so user can read it
        });
      }
    },
    [
      account,
      signAndExecuteTransaction,
      waitForTransaction,
      queryClient,
      suiClient,
      errorDecoder,
    ]
  );
};

export default useBuyToken;
