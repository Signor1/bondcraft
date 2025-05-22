export const convertToBaseUnits = (
  amount: number,
  decimals: number
): bigint => {
  return BigInt(amount * 10 ** decimals);
};

export const convertFromBaseUnits = (
  amount: bigint,
  decimals: number
): number => {
  return Number(amount) / 10 ** decimals;
};

// SUICoins (9 decimals)
export const convertSUIToBase = (amount: number) =>
  convertToBaseUnits(amount, 9);
export const convertFromSUIBase = (amount: bigint) =>
  convertFromBaseUnits(amount, 9);

// USDC (6 decimals)
export const convertUSDCToBase = (amount: number) =>
  convertToBaseUnits(amount, 6);
export const convertFromUSDCBase = (amount: bigint) =>
  convertFromBaseUnits(amount, 6);

export const toSafeBigInt = (value: number | string | bigint): bigint => {
  if (typeof value === "number") {
    return BigInt(Math.round(value));
  }
  return BigInt(value);
};
