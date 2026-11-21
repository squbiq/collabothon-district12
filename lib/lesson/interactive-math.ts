// lib/lesson/interactive-math.ts
//
// Czysta matematyka kroków interaktywnych – wspólna dla odtwarzacza (klient) i walidacji (serwer).
import type { BudgetConfig, GrowthConfig, RiskConfig } from "@/types/interactive";

// ---------- Wzrost kapitału ----------

/** Kapitał po `years` latach miesięcznych wpłat `monthly` przy rocznej stopie `ratePct` (kapitalizacja miesięczna). */
export function futureValue(monthly: number, ratePct: number, years: number): number {
  const n = Math.max(0, Math.round(years * 12));
  const r = ratePct / 100 / 12;
  if (n === 0) return 0;
  if (r === 0) return monthly * n;
  return (monthly * (Math.pow(1 + r, n) - 1)) / r;
}

/** Punkty wykresu: kapitał i suma samych wpłat dla każdego roku od startu do celu. */
export function growthSeries(cfg: GrowthConfig, monthly: number, startAge: number, ratePct: number) {
  const points: { age: number; capital: number; paid: number }[] = [];
  for (let age = startAge; age <= cfg.targetAge; age++) {
    points.push({
      age,
      capital: futureValue(monthly, ratePct, age - startAge),
      paid: monthly * 12 * (age - startAge),
    });
  }
  return points;
}

/** Czy cel jest w ogóle osiągalny przy najkorzystniejszych ustawieniach suwaków. */
export const growthReachable = (cfg: GrowthConfig) =>
  futureValue(cfg.maxMonthly, cfg.rateMax, cfg.targetAge - cfg.startAgeMin) >= cfg.goalAmount;

// ---------- Budżet ----------

export const BUDGET_KEYS = ["fixed", "living", "fun", "savings", "invest"] as const;
export type BudgetKey = (typeof BUDGET_KEYS)[number];
export type BudgetShares = Record<BudgetKey, number>; // procenty całkowite, suma = 100

/** Stres finansowy 0–100: rośnie, gdy stałe opłaty lub bieżące wydatki spadają poniżej minimum. */
export function budgetStress(cfg: BudgetConfig, shares: BudgetShares): number {
  const amount = (k: BudgetKey) => (cfg.income * shares[k]) / 100;
  const need = cfg.fixedMin + cfg.livingMin;
  const shortfall = Math.max(0, cfg.fixedMin - amount("fixed")) + Math.max(0, cfg.livingMin - amount("living"));
  const noFun = shares.fun < 5 ? 15 : 0; // zero przyjemności też męczy
  return Math.min(100, Math.round((shortfall / need) * 250) + noFun);
}

export const BUDGET_STRESS_LIMIT = 40;

/**
 * Zmiana jednego suwaka: pozostałe odejmują (lub oddają) różnicę proporcjonalnie do swoich wartości,
 * więc suma zawsze wynosi 100%.
 */
export function rebalance(shares: BudgetShares, key: BudgetKey, value: number): BudgetShares {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const others = BUDGET_KEYS.filter((k) => k !== key);
  const pool = 100 - target;
  const othersTotal = others.reduce((sum, k) => sum + shares[k], 0);

  const next = { ...shares, [key]: target };
  if (othersTotal === 0) {
    // wszystkie pozostałe są na zerze – dzielimy równo
    others.forEach((k, i) => (next[k] = Math.floor(pool / others.length) + (i < pool % others.length ? 1 : 0)));
    return next;
  }

  // metoda największych reszt – zachowuje sumę równą dokładnie `pool`
  const raw = others.map((k) => ({ k, exact: (shares[k] / othersTotal) * pool }));
  raw.forEach(({ k, exact }) => (next[k] = Math.floor(exact)));
  let left = pool - raw.reduce((sum, { exact }) => sum + Math.floor(exact), 0);
  raw
    .slice()
    .sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)))
    .forEach(({ k }) => {
      if (left > 0) {
        next[k] += 1;
        left -= 1;
      }
    });
  return next;
}

// ---------- Ryzyko i zysk ----------

export const RISK_ASSETS = [
  { id: "cash", label: "Cash", risk: 5, ret: 8 },
  { id: "bonds", label: "Bonds", risk: 25, ret: 30 },
  { id: "etf", label: "ETFs", risk: 50, ret: 55 },
  { id: "stocks", label: "Stocks", risk: 75, ret: 75 },
  { id: "crypto", label: "Crypto", risk: 95, ret: 95 },
] as const;
export type RiskAssetId = (typeof RISK_ASSETS)[number]["id"];
export const RISK_MAX_UNITS = 10;

/** Ważona średnia ryzyka i zysku (0–100) dla liczby jednostek każdej klasy aktywów. */
export function portfolioScores(units: Record<RiskAssetId, number>) {
  const total = RISK_ASSETS.reduce((s, a) => s + units[a.id], 0);
  if (total === 0) return { risk: 0, ret: 0, total };
  const avg = (key: "risk" | "ret") => RISK_ASSETS.reduce((s, a) => s + a[key] * units[a.id], 0) / total;
  return { risk: Math.round(avg("risk")), ret: Math.round(avg("ret")), total };
}

export const inZone = (cfg: RiskConfig, risk: number) => risk >= cfg.zoneMin && risk <= cfg.zoneMax;

/** Czy zielona strefa da się trafić dowolnym portfelem (do walidacji w panelu). */
export function riskZoneReachable(cfg: RiskConfig): boolean {
  for (let a = 0; a <= RISK_MAX_UNITS; a++)
    for (let b = 0; a + b <= RISK_MAX_UNITS; b++)
      for (let c = 0; a + b + c <= RISK_MAX_UNITS; c++)
        for (let d = 0; a + b + c + d <= RISK_MAX_UNITS; d++) {
          const e = RISK_MAX_UNITS - a - b - c - d;
          if (inZone(cfg, portfolioScores({ cash: a, bonds: b, etf: c, stocks: d, crypto: e }).risk)) return true;
        }
  return false;
}
