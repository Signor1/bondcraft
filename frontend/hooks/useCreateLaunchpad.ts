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
import { SuiClientErrorDecoder } from "suiclient-error-decoder";
import { bondCraftErrorCodes } from "@/utils/bondCraftErrorCodes";

// Extend formSchema to handle platformAdmin default
type FormValues = z.infer<typeof formSchema>;

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
    async (values: FormValues) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

      const loadingToast = toast.loading("Creating your token...");

      let coinPublishingSuccessful = false;
      let packageId: string;
      let actualModuleName: string;
      let coinType: string;
      let treasuryCapId: string;
      let metadataId: string;

      // STEP 1: Coin Publishing with separate try-catch
      try {
        // First, load the WASM module and bytecode template
        const wasmModule = await import("@mysten/move-bytecode-template");
        await wasmModule.default(
          new URL(
            "@mysten/move-bytecode-template/move_bytecode_template_bg.wasm",
            import.meta.url
          ).toString()
        );

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

        // Get module name in lowercase
        const moduleNameLower = values.tokenSymbol
          .toLowerCase()
          .substring(0, 3);

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
          bcs.u8().serialize(0).toBytes(),
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

        // Convert to array format that Transaction.publish() expects
        const moduleBytes = Array.from(updatedBytecode);

        toast.loading("Publishing coin module...", { id: loadingToast });

        // Build transaction for coin publishing
        const txb = new Transaction();
        const [upgradeCap] = txb.publish({
          modules: [moduleBytes],
          dependencies: [
            normalizeSuiObjectId("0x1"),
            normalizeSuiObjectId("0x2"),
          ],
        });

        txb.transferObjects([upgradeCap], txb.pure.address(account.address));
        txb.setGasBudget(2000000000); // 2 SUI

        // Sign and execute the publishing transaction
        const publishResult: SuiSignAndExecuteTransactionOutput =
          await signAndExecuteTransaction({
            transaction: txb,
            account,
            chain: "sui:testnet",
          });

        toast.loading("Waiting for coin publishing confirmation...", {
          id: loadingToast,
        });

        const txBlock = await waitForTransaction(publishResult.digest);

        // Find the published package ID from objectChanges
        const publishedPackage = txBlock.objectChanges?.find(
          (change) => change.type === "published"
        );

        if (!publishedPackage || publishedPackage.type !== "published") {
          throw new Error("Could not find published package in transaction");
        }

        packageId = publishedPackage.packageId;

        // Extract actual module name from the published package
        actualModuleName = moduleNameLower;
        if (publishedPackage.modules && publishedPackage.modules.length > 0) {
          actualModuleName = publishedPackage.modules[0];
        }

        coinType = `${packageId}::${actualModuleName}::${values.tokenSymbol.toUpperCase()}`;

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

        treasuryCapId = treasuryCapObj.objectId;
        metadataId = metadataObj.objectId;

        // Mark coin publishing as successful
        coinPublishingSuccessful = true;

        toast.loading("Coin published successfully! Creating launchpad...", {
          id: loadingToast,
        });
      } catch (error) {
        // Handle coin publishing errors
        toast.dismiss(loadingToast);
        const decoded = errorDecoder.parseError(error);
        toast.error(`Failed to publish coin: ${decoded.message}`, {
          position: "top-right",
          duration: 8000,
        });
        console.error("Coin publishing error:", decoded);
        return; // Exit early if coin publishing fails
      }

      // 2: Launchpad Creation with separate try-catch
      try {
        // Build launchpad creation transaction
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

        toast.loading("Finalizing your launchpad...", { id: loadingToast });

        const launchpadTxBlock = await waitForTransaction(
          launchpadResult.digest
        );

        console.log("Launchpad creation completed:", launchpadTxBlock);

        // Both operations successful
        toast.dismiss(loadingToast);
        toast.success(
          `Launchpad created successfully! Token: ${values.tokenSymbol}`,
          {
            position: "top-right",
          }
        );

        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ["launchpads"] });
        queryClient.invalidateQueries({ queryKey: ["user-launchpads"] });
        router.push("/my-launchpads");
      } catch (error) {
        // Handle launchpad creation errors
        toast.dismiss(loadingToast);
        const decoded = errorDecoder.parseError(error);

        // Show specific error for launchpad creation failure
        if (coinPublishingSuccessful) {
          toast.error(`${decoded.message}`, {
            position: "top-right",
            duration: 10000, // Show longer since this is a partial failure
          });
        }

        console.error("Launchpad creation error:", decoded);

        // Optionally still invalidate coin-related queries since coin was created
        queryClient.invalidateQueries({ queryKey: ["user-coins"] });
      }
    },
    [
      account,
      signAndExecuteTransaction,
      queryClient,
      waitForTransaction,
      router,
      errorDecoder,
    ]
  );
};

export default useCreateLaunchpad;
