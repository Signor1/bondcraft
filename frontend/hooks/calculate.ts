// This script calculates the correct k value for your specific case
// You can run this offline to verify what the correct k value should be

function calculateK(
  fundingGoal: number, // In USDC base units (with 6 decimals)
  fundingDecimals: number, // USDC decimals = 6
  maxTokens: number, // Number of tokens for funding
  tokenDecimals: number // Token decimals = 9
): number {
  const SCALING_FACTOR = 1_000_000_000; // 10^9 for precision

  // Convert inputs to safe number formats (BigInt for precision)
  const fundingGoalBig = BigInt(fundingGoal);
  const maxTokensBig = BigInt(maxTokens);

  // Calculate decimal adjustment factor
  const decimalDiff = tokenDecimals - fundingDecimals;
  const adjustmentFactor = BigInt(10) ** BigInt(decimalDiff);

  // Apply adjustment to maxTokens (convert to USDC decimal scale)
  const adjustedMaxTokens = maxTokensBig * adjustmentFactor;

  // Calculate k
  const numerator = BigInt(2) * fundingGoalBig * BigInt(SCALING_FACTOR);
  const denominator = adjustedMaxTokens * adjustedMaxTokens;

  let k = numerator / denominator;

  // Ensure k is at least 1
  if (k === BigInt(0)) {
    k = BigInt(1);
  }

  return Number(k);
}

// Use your specific values from the launchpad object
const fundingGoal = 1000000000; // 1,000,000,000 USDC base units (1,000 USDC)
const fundingTokens = 1400000; // 1,400,000 project tokens
const tokenDecimals = 9;
const usdcDecimals = 6;

// Calculate k
const k = calculateK(fundingGoal, usdcDecimals, fundingTokens, tokenDecimals);

console.log("Calculated k value:", k);

// Now calculate the current price for 1,000,100 tokens sold
function calculatePrice(
  tokensSold: number,
  tokenDecimals: number,
  k: number
): number {
  const SCALING_FACTOR = 1_000_000_000; // 10^9

  // For tokens with 9 decimals and USDC with 6 decimals
  const decimalAdjustment = 10 ** (tokenDecimals - 6);

  // Calculate price
  let price = (k * tokensSold) / SCALING_FACTOR;

  // Apply decimal adjustment to get price in USDC units
  price = price / decimalAdjustment;

  // Ensure non-zero price if there are tokens sold and k is non-zero
  if (price === 0 && tokensSold > 0 && k > 0) {
    price = 1;
  }

  return price;
}

const tokensSold = 1000100;
const currentPrice = calculatePrice(tokensSold, tokenDecimals, k);

console.log(
  "Current price with tokens sold:",
  currentPrice,
  "USDC base units per token"
);
console.log("That's approximately", currentPrice / 10 ** 6, "USDC per token");
