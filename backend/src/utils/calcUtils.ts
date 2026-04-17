const DAILY_WAGE = Number(process.env.DAILY_WAGE) || 500;

export interface ActivityFinancials {
  duration: number;
  cost: number;
  revenue: number;
  profit: number;
}

export function calculateFinancials(
  landSize: number,
  workerCount: number,
  efficiency: number,
  bookingAmountPerAcre: number
): ActivityFinancials {
  const duration = Math.ceil(landSize / (workerCount * efficiency));
  const cost = duration * workerCount * DAILY_WAGE;
  const revenue = landSize * bookingAmountPerAcre;
  const profit = revenue - cost;
  return { duration, cost, revenue, profit };
}
