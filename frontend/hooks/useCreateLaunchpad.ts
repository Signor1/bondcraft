/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/bcs";
import { useQueryClient } from "@tanstack/react-query";
import { PACKAGE_ID, FACTORY_ID } from "@/constant/Modules";
import * as z from "zod";
import type { SuiSignAndExecuteTransactionOutput } from "@mysten/wallet-standard";
import { getFullnodeUrl } from "@mysten/sui/client";
import { normalizeSuiObjectId } from "@mysten/sui/utils";
import { useRouter } from "next/navigation";
import { convertToBaseUnits, convertUSDCToBase } from "@/utils/decimals";
import { formSchema } from "@/utils/schema";

// Extend formSchema to handle platformAdmin default
type FormValues = z.infer<typeof formSchema>;

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

const useCreateLaunchpad = () => {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();

  const router = useRouter();

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
    async (values: FormValues) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

      // Loading toast for user feedback
      const loadingToast = toast.loading("Creating your token...");

      try {
        // First, load the WASM module and bytecode template
        const wasmModule = await import("@mysten/move-bytecode-template");
        await wasmModule.default(
          // Use URL.createObjectURL to handle the wasm import
          new URL(
            "@mysten/move-bytecode-template/move_bytecode_template_bg.wasm",
            import.meta.url
          ).toString()
        );

        // Update loading message
        toast.loading("Fetching coin template...", { id: loadingToast });

        // Fetch the coin template bytecode
        const coinTemplateResponse = await fetch("/coin_template.mv");
        if (!coinTemplateResponse.ok) {
          throw new Error("Failed to fetch coin template bytecode");
        }
        const initialBytecodeBuffer = await coinTemplateResponse.arrayBuffer();
        const initialBytecode = new Uint8Array(initialBytecodeBuffer);

        // Deserialize the bytecode
        wasmModule.deserialize(initialBytecode);

        // Helper function to encode text as UTF-8 bytes
        const encodeText = (text: string) => new TextEncoder().encode(text);

        // Get module name in lowercase - ensure it's converted to 3 characters for better compatibility
        const moduleNameLower = values.tokenSymbol
          .toLowerCase()
          .substring(0, 3);

        // Update loading message
        toast.loading("Customizing your token...", { id: loadingToast });

        // Update module name identifiers
        let updatedBytecode = wasmModule.update_identifiers(initialBytecode, {
          COIN_TEMPLATE: values.tokenSymbol.toUpperCase(),
          coin_template: values.tokenSymbol.toLowerCase(),
        });

        // Update decimal constant
        updatedBytecode = wasmModule.update_constants(
          updatedBytecode,
          bcs.u8().serialize(values.decimals).toBytes(),
          bcs.u8().serialize(0).toBytes(), // Original value in template
          "U8"
        );

        // Update symbol constant
        updatedBytecode = wasmModule.update_constants(
          updatedBytecode,
          bcs
            .vector(bcs.u8())
            .serialize(encodeText(values.tokenSymbol))
            .toBytes(),
          bcs.vector(bcs.u8()).serialize(encodeText("TMPL")).toBytes(),
          "Vector(U8)"
        );

        // Update name constant
        updatedBytecode = wasmModule.update_constants(
          updatedBytecode,
          bcs
            .vector(bcs.u8())
            .serialize(encodeText(values.tokenName))
            .toBytes(),
          bcs.vector(bcs.u8()).serialize(encodeText("Template Coin")).toBytes(),
          "Vector(U8)"
        );

        // Update description constant
        updatedBytecode = wasmModule.update_constants(
          updatedBytecode,
          bcs
            .vector(bcs.u8())
            .serialize(
              encodeText(
                `${values.tokenName} is a coin created through BondCraft launchpad`
              )
            )
            .toBytes(),
          bcs
            .vector(bcs.u8())
            .serialize(encodeText("Template Coin Description"))
            .toBytes(),
          "Vector(U8)"
        );

        // Convert to array format that Transaction.publish() expects (Array<number>)
        const moduleBytes = Array.from(updatedBytecode);

        // Update loading message
        toast.loading("Publishing coin module...", { id: loadingToast });

        // Build transaction
        const txb = new Transaction();

        // Publish the updated coin module
        const [upgradeCap] = txb.publish({
          modules: [moduleBytes],
          dependencies: [
            normalizeSuiObjectId("0x1"),
            normalizeSuiObjectId("0x2"),
          ], // Sui framework
        });

        // Make sure to transfer the upgrade cap to the sender
        txb.transferObjects([upgradeCap], txb.pure.address(account.address));

        // Set gas budget for the entire transaction
        txb.setGasBudget(2000000000); // 2 SUI

        // Sign and execute the publishing transaction first
        const publishResult: SuiSignAndExecuteTransactionOutput =
          await signAndExecuteTransaction({
            transaction: txb,
            account,
            chain: "sui:testnet",
          });

        // Wait for transaction to be confirmed and get detailed results
        toast.loading("Waiting for transaction confirmation...", {
          id: loadingToast,
        });
        const txBlock = await waitForTransaction(publishResult.digest);

        // Find the published package ID from objectChanges (more reliable)
        const publishedPackage = txBlock.objectChanges?.find(
          (change) => change.type === "published"
        );

        if (!publishedPackage || publishedPackage.type !== "published") {
          throw new Error("Could not find published package in transaction");
        }

        const packageId = publishedPackage.packageId;

        // Extract actual module name from the published package
        let actualModuleName = moduleNameLower;
        if (publishedPackage.modules && publishedPackage.modules.length > 0) {
          actualModuleName = publishedPackage.modules[0];
        }

        // The correct coin type path with the actual module name
        const coinType = `${packageId}::${actualModuleName}::${values.tokenSymbol.toUpperCase()}`;

        // Find TreasuryCap and CoinMetadata directly from objectChanges
        const treasuryCapObj = txBlock.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            change.objectType.includes("TreasuryCap") &&
            change.objectType.includes(packageId)
        );

        const metadataObj = txBlock.objectChanges?.find(
          (change) =>
            change.type === "created" &&
            change.objectType.includes("CoinMetadata") &&
            change.objectType.includes(packageId)
        );

        if (!treasuryCapObj || !metadataObj) {
          throw new Error(
            "Failed to extract TreasuryCap or CoinMetadata from transaction result"
          );
        }

        if (
          treasuryCapObj.type !== "created" ||
          metadataObj.type !== "created"
        ) {
          throw new Error(
            "Expected created object types for TreasuryCap and CoinMetadata"
          );
        }

        const treasuryCapId = treasuryCapObj.objectId;
        const metadataId = metadataObj.objectId;

        // Update loading message
        toast.loading("Creating launchpad...", { id: loadingToast });

        // Now create a second transaction to create the launchpad
        const launchpadTxb = new Transaction();

        const decimals = values.decimals;

        // Call create_launchpad with the newly created objects
        launchpadTxb.moveCall({
          target: `${PACKAGE_ID}::factory::create_launchpad`,
          arguments: [
            launchpadTxb.object(FACTORY_ID),
            launchpadTxb.object(treasuryCapId),
            launchpadTxb.object(metadataId),
            launchpadTxb.pure.u64(
              convertToBaseUnits(values.totalSupply, decimals).toString()
            ),
            launchpadTxb.pure.u64(
              convertToBaseUnits(values.fundingTokens, decimals).toString()
            ),
            launchpadTxb.pure.u64(
              convertToBaseUnits(values.creatorTokens, decimals).toString()
            ),
            launchpadTxb.pure.u64(
              convertToBaseUnits(values.liquidityTokens, decimals).toString()
            ),
            launchpadTxb.pure.u64(
              convertToBaseUnits(values.platformTokens, decimals).toString()
            ),
            launchpadTxb.pure.u64(
              convertUSDCToBase(values.fundingGoal).toString()
            ),
          ],
          typeArguments: [coinType],
        });

        launchpadTxb.setGasBudget(1000000000); // 1 SUI

        // Sign and execute the launchpad creation transaction
        const launchpadResult: SuiSignAndExecuteTransactionOutput =
          await signAndExecuteTransaction({
            transaction: launchpadTxb,
            account,
            chain: "sui:testnet",
          });

        // Wait for launchpad transaction to be confirmed
        toast.loading("Finalizing your launchpad...", { id: loadingToast });
        const launchpadTxBlock = await waitForTransaction(
          launchpadResult.digest
        );

        console.log("Launchpad creation completed:", launchpadTxBlock);

        // Dismiss loading toast and show success
        toast.dismiss(loadingToast);
        toast.success(
          `Launchpad created successfully! Token: ${values.tokenSymbol}`,
          {
            position: "top-right",
          }
        );

        // Invalidate launchpad queries
        queryClient.invalidateQueries({ queryKey: ["launchpads"] });

        queryClient.invalidateQueries({ queryKey: ["user-launchpads"] });

        router.push("/my-launchpads");
      } catch (error) {
        // Dismiss loading toast
        toast.dismiss(loadingToast);

        // Parse the error using our helper function
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
      queryClient,
      waitForTransaction,
      router,
      parseMoveAbortError,
    ]
  );
};

export default useCreateLaunchpad;
