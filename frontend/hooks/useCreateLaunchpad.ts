import { useCallback } from "react";
import { toast } from "react-toastify";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { bcs } from "@mysten/bcs";
import { useQueryClient } from "@tanstack/react-query";

const useCreateLaunchpad = () => {
  const queryClient = useQueryClient();
  const account = useCurrentAccount();

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  return useCallback(async () => {
    if (!account) {
      toast.error("Please connect your wallet");
      return;
    }
  }, []);
};

export default useCreateLaunchpad;
