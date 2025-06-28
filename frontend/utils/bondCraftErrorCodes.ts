export const bondCraftErrorCodes = {
  // --- Factory Module Errors ---
  0: "Launchpad not found for the specified creator",
  1: "Invalid token supply allocation; the sum of all parts must equal the total supply",
  2: "Invalid coin metadata: Name cannot be empty",
  3: "Invalid coin metadata: Symbol cannot be empty",
  4: "Invalid coin metadata: Decimals must be exactly 9",

  // --- Launchpad Module Errors ---
  5: "Invalid funding goal; must be greater than zero",
  6: "Invalid total supply; must be greater than zero",
  7: "Insufficient payment for token purchase",
  8: "Operation not allowed in the current launchpad phase",
  9: "Unauthorized: Sender is not authorized to perform this action",
  10: "Insufficient tokens available for purchase or withdrawal",
  11: "Vesting period has not yet started or is not ready",
  12: "Purchase amount exceeds the maximum allowed per transaction",
  13: "Tokens have already been claimed and cannot be claimed again",

  // --- Pool Module Errors ---
  101: "Invalid tick range for the liquidity pool",
  102: "Invalid or zero liquidity amount provided",
  103: "Invalid tick spacing; must be 100, 500, or 3000",
  104: "Tick is not aligned with the specified tick spacing",
  105: "Insufficient liquidity for pool creation (minimum 1000 of each token)",
  106: "Invalid price for pool creation; results in an out-of-bounds sqrt_price",

  // --- Bonding Curve Module Errors (These correctly override the defaults) ---
  1000: "Division by zero occurred in bonding curve calculation",
  1001: "Numeric overflow occurred in bonding curve calculation",
};
