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
import { formSchema } from "@/app/create/page";
import type { SuiSignAndExecuteTransactionOutput } from "@mysten/wallet-standard";
import { getFullnodeUrl } from "@mysten/sui/client";

// Extend formSchema to handle platformAdmin default
type FormValues = z.infer<typeof formSchema>;

const useCreateLaunchpad = () => {
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
  return useCallback(
    async (values: FormValues) => {
      if (!account) {
        toast.error("Please connect your wallet");
        return;
      }

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

        // Build transaction
        const txb = new Transaction();

        // Publish the updated coin module
        const [upgradeCap] = txb.publish({
          modules: [moduleBytes],
          dependencies: [],
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

        console.log("Publish transaction result:", publishResult);

        // Fetch the full transaction block to get the complete effects object
        const txBlock = await suiClient.getTransactionBlock({
          digest: publishResult.digest,
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
        });

        console.log("Full transaction block:", txBlock);

        if (
          !txBlock.effects?.created ||
          !Array.isArray(txBlock.effects.created)
        ) {
          throw new Error(
            "Transaction successful but created objects not found in transaction effects"
          );
        }

        // Define the coin type for reference (not directly used but kept for clarity)
        const coinType = `${values.tokenSymbol.toLowerCase()}::${values.tokenSymbol.toLowerCase()}::${values.tokenSymbol.toUpperCase()}`;

        console.log("Coin type:", coinType);

        // Extract package ID from the transaction result
        const packageId = txBlock.effects.created.find(
          (obj: any) => obj.owner === "Immutable"
        )?.reference.objectId;

        if (!packageId) {
          throw new Error(
            "Failed to extract package ID from transaction result"
          );
        }

        // Extract TreasuryCap and CoinMetadata from the transaction result
        const treasuryCapObj = txBlock.effects.created.find(
          (obj: any) =>
            obj.owner.AddressOwner === account.address &&
            obj.type.includes("TreasuryCap")
        );

        const metadataObj = txBlock.effects.created.find(
          (obj: any) =>
            obj.owner === "Immutable" && obj.type.includes("CoinMetadata")
        );

        if (!treasuryCapObj || !metadataObj) {
          throw new Error(
            "Failed to extract TreasuryCap or CoinMetadata from transaction result"
          );
        }

        const treasuryCapId = treasuryCapObj.reference.objectId;
        const metadataId = metadataObj.reference.objectId;

        // Now create a second transaction to create the launchpad
        const launchpadTxb = new Transaction();

        // Call create_launchpad with the newly created objects
        launchpadTxb.moveCall({
          target: `${PACKAGE_ID}::factory::create_launchpad`,
          arguments: [
            launchpadTxb.object(FACTORY_ID),
            launchpadTxb.object(treasuryCapId),
            launchpadTxb.object(metadataId),
            launchpadTxb.pure.u64(values.totalSupply),
            launchpadTxb.pure.u64(values.fundingTokens),
            launchpadTxb.pure.u64(values.creatorTokens),
            launchpadTxb.pure.u64(values.liquidityTokens),
            launchpadTxb.pure.u64(values.platformTokens),
            launchpadTxb.pure.u64(values.fundingGoal),
          ],
          typeArguments: [
            `${packageId}::${values.tokenSymbol.toLowerCase()}::${values.tokenSymbol.toUpperCase()}`,
          ],
        });

        launchpadTxb.setGasBudget(1000000000); // 1 SUI

        // Sign and execute the launchpad creation transaction
        const launchpadResult: SuiSignAndExecuteTransactionOutput =
          await signAndExecuteTransaction({
            transaction: launchpadTxb,
            account,
            chain: "sui:testnet",
          });

        console.log("Launchpad creation result:", launchpadResult);

        toast.success(
          `Launchpad created successfully! Digest: ${launchpadResult.digest}`,
          {
            position: "top-right",
          }
        );

        // Invalidate launchpad queries
        queryClient.invalidateQueries({ queryKey: ["launchpads"] });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message.includes("EInvalidSupply")
              ? "Total allocations must equal total supply"
              : error.message.includes("EInvalidAllocation")
              ? "Allocations must equal total supply"
              : error.message.includes("EInvalidFundingGoal")
              ? "Funding goal must be greater than zero"
              : error.message.includes("EInvalidTotalSupply")
              ? "Total supply must be greater than zero"
              : "Failed to create launchpad"
            : "An unexpected error occurred";
        toast.error(errorMessage, {
          position: "top-right",
        });
      }
    },
    [account, signAndExecuteTransaction, queryClient, suiClient]
  );
};

export default useCreateLaunchpad;
