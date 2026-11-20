export interface DailyOption {
  id: string;
  label: string;
  isOptimal: boolean;
  feedback: string;
}

export interface DailyLesson {
  dateKey: string; // Format YYYY-MM-DD
  category: string;
  title: string;
  scenario: string;
  rewardCoins: number;
  options: DailyOption[];
}

// Local date key without UTC timezone shift issues
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function fromDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDisplayDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function getMockDailyLessons(referenceDate = new Date()): Record<string, DailyLesson> {
  const today = toDateKey(referenceDate);
  const minus1 = toDateKey(addDays(referenceDate, -1));
  const minus2 = toDateKey(addDays(referenceDate, -2));
  const minus3 = toDateKey(addDays(referenceDate, -3));

  return {
    [today]: {
      dateKey: today,
      category: 'Market Psychology',
      title: 'A Sudden 12% Drop in One Week',
      scenario:
        'Your global ETF, which you hold for a 10-year investment horizon, drops 12% this week following weak economic data. You have €500 ready to invest. What do you do?',
      rewardCoins: 100,
      options: [
        {
          id: 'a',
          label: 'Sell everything before it drops any further',
          isOptimal: false,
          feedback:
            'Careful! Panic selling locks in a temporary paper loss as a real loss and often causes investors to miss the market rebound.',
        },
        {
          id: 'b',
          label: 'Stick to the plan and buy more at a lower price',
          isOptimal: true,
          feedback:
            'Great decision. With a long-term horizon, market dips allow you to lower your average purchase price (Dollar-Cost Averaging).',
        },
        {
          id: 'c',
          label: 'Take out a quick loan to buy as much as possible',
          isOptimal: false,
          feedback:
            'Investing borrowed money (leverage) drastically increases your risk—markets can stay down longer than you expect.',
        },
      ],
    },
    [minus1]: {
      dateKey: minus1,
      category: 'Inflation',
      title: 'Cash Sitting in a 0% Checking Account',
      scenario:
        'Annual inflation is at 5%. You keep €10,000 in a standard 0% checking account thinking, "at least I am not losing anything." What is the reality after one year?',
      rewardCoins: 100,
      options: [
        {
          id: 'a',
          label: 'I lose nothing — I still have exactly €10,000',
          isOptimal: false,
          feedback:
            'The nominal number stays the same, but your purchasing power drops to roughly €9,520 in today’s value. Inflation quietly erodes idle cash.',
        },
        {
          id: 'b',
          label: 'I lose roughly 5% of my real purchasing power',
          isOptimal: true,
          feedback:
            'Spot on. Even low-risk instruments like high-yield savings accounts or government bonds help protect your savings from inflation.',
        },
      ],
    },
    [minus2]: {
      dateKey: minus2,
      category: 'Diversification',
      title: 'Going All-In on One Hot Tech Stock',
      scenario:
        'A friend recommends a hyped AI stock that surged 80% over the past year. You are tempted to put 100% of your first investment budget into that single company.',
      rewardCoins: 100,
      options: [
        {
          id: 'a',
          label: 'Go 100% in — strong momentum means guaranteed gains',
          isOptimal: false,
          feedback:
            'Past performance does not guarantee future results. A single stock can lose 50% of its value after one disappointing earnings report.',
        },
        {
          id: 'b',
          label: 'Build a core with a broad ETF and keep single stocks to a small slice',
          isOptimal: true,
          feedback:
            'Well done! Diversification protects your capital from single-company risk while keeping you exposed to overall market growth.',
        },
      ],
    },
    [minus3]: {
      dateKey: minus3,
      category: 'Emergency Fund',
      title: 'Getting Your First Steps in Order',
      scenario:
        'You are just starting your financial journey. You saved your first €3,000, but you have no emergency reserve for unexpected expenses (like a car repair). Where should this money go?',
      rewardCoins: 100,
      options: [
        {
          id: 'a',
          label: 'Into a safe, easily accessible savings account',
          isOptimal: true,
          feedback:
            'Smart move. An emergency fund gives you peace of mind and ensures you never have to sell your investments at a loss during a crisis.',
        },
        {
          id: 'b',
          label: 'Straight into high-risk stocks for maximum growth',
          isOptimal: false,
          feedback:
            'Without an emergency cushion, an unexpected bill could force you to liquidate your investments at the worst possible time.',
        },
      ],
    },
  };
}