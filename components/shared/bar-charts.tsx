"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { cn } from "cn"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

export const description = "Compound interest calculator"

// Fixed calculator assumptions
const ANNUAL_RATE = 0.05 // nominal annual interest rate
const TAX_RATE = 0.19 // capital gains tax (Belka)
const MONTHS_IN_YEAR = 12

const MIN_YEARS = 1
const MAX_YEARS = 40

const chartConfig = {
  deposits: {
    label: "Deposits",
    color: "var(--chart-2)",
  },
  interest: {
    label: "Interest (after tax)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

type YearPoint = {
  year: number
  deposits: number
  interest: number
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "PLN",
  maximumFractionDigits: 0,
})

/**
 * Compound interest with monthly compounding and a monthly contribution
 * (paid at the end of the month). Returns the state at the end of each year.
 */
function calculate(years: number, monthlyDeposit: number): YearPoint[] {
  const monthlyRate = ANNUAL_RATE / MONTHS_IN_YEAR
  const points: YearPoint[] = []

  let balance = 0
  let deposits = 0

  for (let year = 1; year <= years; year++) {
    for (let m = 0; m < MONTHS_IN_YEAR; m++) {
      balance = balance * (1 + monthlyRate) + monthlyDeposit
      deposits += monthlyDeposit
    }
    const interestNet = Math.max(0, balance - deposits) * (1 - TAX_RATE)
    points.push({
      year,
      deposits: Math.round(deposits),
      interest: Math.round(interestNet),
    })
  }

  return points
}

export function ChartBarInteractive({ className }: { className?: string }) {
  const [years, setYears] = React.useState(10)
  const [depositInput, setDepositInput] = React.useState("500")

  const deposit = Math.max(0, Number(depositInput.replace(",", ".")) || 0)

  const data = React.useMemo(() => calculate(years, deposit), [years, deposit])

  const last = data[data.length - 1]
  const total = last ? last.deposits + last.interest : 0

  return (
    <Card className={cn("py-0 w-full", className)}>
      <CardHeader className="flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-center">
        <section className="flex flex-1 flex-col justify-center gap-1">
          <CardTitle>Compound interest calculator</CardTitle>
          <CardDescription>
            Value of a deposit or investment with contributions and tax
            {" "}({ANNUAL_RATE * 100}% per year, monthly compounding,
            {TAX_RATE * 100}% tax)
          </CardDescription>
        </section>

        <section className="flex flex-1 flex-row items-end justify-center gap-6">
          <section className="flex w-full h-full flex-col gap-2">
            <label className="flex items-between justify-between text-sm">
              <span>Period</span>
              <span className="font-medium tabular-nums">
                {years} {yearsLabel(years)}
              </span>
            </label>
            <Slider
              min={MIN_YEARS}
              max={MAX_YEARS}
              step={1}
              value={years}
              onValueChange={(v) =>
                setYears(Array.isArray(v) ? v[0] : (v as number))
              }
              aria-label="Period in years"
            />
          </section>

          <section className="flex w-full flex-col gap-2">
            <label htmlFor="monthly-deposit" className="text-sm">
              Monthly contribution (PLN)
            </label>
            <Input
              id="monthly-deposit"
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Contribution"
              value={depositInput}
              onChange={(e) => setDepositInput(e.target.value)}
            />
          </section>
        </section>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 px-2 py-6 sm:px-6">
        <section className="grid grid-cols-3 gap-4 text-sm">
          <Summary label="Deposited" value={last?.deposits ?? 0} />
          <Summary label="Net interest" value={last?.interest ?? 0} />
          <Summary label={`Total after ${years} ${yearsLabel(years)}`} value={total} strong />
        </section>

        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-75 w-full"
        >
          <BarChart
            accessibilityLayer
            data={data}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={6}
              width={72}
              tickFormatter={(value) => currency.format(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-52"
                  labelFormatter={(value) => `Year ${value}`}
                  formatter={(value, name) => (
                    <span className="flex w-full justify-between gap-4">
                      <span className="text-muted-foreground">
                        {chartConfig[name as keyof typeof chartConfig]?.label}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {currency.format(Number(value))}
                      </span>
                    </span>
                  )}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="deposits"
              stackId="a"
              fill="var(--color-deposits)"
            />
            <Bar
              dataKey="interest"
              stackId="a"
              fill="var(--color-interest)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function Summary({
  label,
  value,
  strong,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn("tabular-nums", strong ? "text-xl font-semibold" : "text-lg")}
      >
        {currency.format(value)}
      </span>
    </div>
  )
}

function yearsLabel(n: number) {
  return n === 1 ? "year" : "years"
}
