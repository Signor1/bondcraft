import * as z from "zod";

export const formSchema = z.object({
  tokenName: z
    .string()
    .min(1, { message: "Token name is required" })
    .max(32, { message: "Token name must be 32 characters or less" }),
  tokenSymbol: z
    .string()
    .min(1, { message: "Token symbol is required" })
    .max(32, { message: "Token symbol must be 32 characters or less" }),
  decimals: z
    .number()
    .min(9, { message: "Decimals must be 9" })
    .max(9, { message: "Decimals cannot exceed 9" }),
  totalSupply: z
    .number()
    .min(1000000, { message: "Total supply must be at least 1,000,000" }),
  fundingTokens: z
    .number()
    .min(1000, { message: "Funding tokens must be at least 1,000" }),
  creatorTokens: z
    .number()
    .min(1000, { message: "Creator tokens must be at least 1,000" }),
  liquidityTokens: z.number().min(1000, {
    message: "Liquidity tokens must be at least 1,000 for Cetus pool",
  }),
  platformTokens: z
    .number()
    .min(1000, { message: "Platform tokens must be at least 1,000" }),
  fundingGoal: z
    .number()
    .min(1000, { message: "Funding goal must be at least 1,000 USDC" })
    .max(1000000000, {
      message: "Funding goal cannot exceed 1,000,000,000 USDC",
    }),
});
