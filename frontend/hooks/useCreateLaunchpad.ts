/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from "react";
import { toast } from "sonner";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/bcs";
import { useQueryClient } from "@tanstack/react-query";
import { PACKAGE_ID, FACTORY_ID } from "@/constant/Modules";
import * as z from "zod";
import { formSchema } from "@/app/create/page";

// Extend formSchema to handle platformAdmin default
type FormValues = z.infer<typeof formSchema>;

const useCreateLaunchpad = () => {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  return useCallback(
    async (values: FormValues) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

      try {
        // Build transaction
        const txb = new Transaction();

        // Serialize strings using bcs
        const tokenNameBytes = bcs
          .string()
          .serialize(values.tokenName)
          .toBytes();
        const tokenSymbolBytes = bcs
          .string()
          .serialize(values.tokenSymbol)
          .toBytes();

        // Call create_launchpad
        txb.moveCall({
          target: `${PACKAGE_ID}::factory::create_launchpad`,
          arguments: [
            txb.object(FACTORY_ID), // Shared LaunchpadFactory
            txb.pure.vector("u8", tokenSymbolBytes),
            txb.pure.vector("u8", tokenNameBytes),
            txb.pure.u8(values.decimals),
            txb.pure.u64(values.totalSupply),
            txb.pure.u64(values.fundingTokens),
            txb.pure.u64(values.creatorTokens),
            txb.pure.u64(values.liquidityTokens),
            txb.pure.u64(values.platformTokens),
            txb.pure.u64(values.fundingGoal),
          ],
          typeArguments: [],
        });

        txb.setGasBudget(1000000000); // Set gas budget

        // Sign and execute transaction
        await signAndExecuteTransaction(
          {
            transaction: txb,
            account,
            chain: "sui:testnet",
          },
          {
            onSuccess: (res) => {
              toast.success(
                `Launchpad created successfully! Digest: ${res.digest}`,
                {
                  position: "top-right",
                }
              );

              // Invalidate launchpad queries
              queryClient.invalidateQueries({ queryKey: ["launchpads"] });
            },
            onError: (error) => {
              toast.error("Transaction failed", {
                position: "top-right",
              });
              console.error("Transaction error:", error);
            },
          }
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message.includes("EInvalidSupply")
              ? "Total allocations must equal total supply"
              : error.message.includes("EInvalidName")
              ? "Token name cannot be empty"
              : error.message.includes("EInvalidSymbol")
              ? "Token symbol cannot be empty"
              : error.message.includes("EInvalidDecimals")
              ? "Decimals must be at least 6"
              : "Failed to create launchpad"
            : "An unexpected error occurred";
        toast.error(errorMessage, {
          position: "top-right",
        });
      }
    },
    [account, signAndExecuteTransaction, queryClient]
  );
};

export default useCreateLaunchpad;
