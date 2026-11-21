// scripts/seed.ts
//
// Dane testowe: dwóch użytkowników (user + admin) oraz przykładowe lekcje,
// dzięki którym można sprawdzić wygląd /lesson-map, odtwarzacza i panelu admina.
//
// Uruchomienie:  npm run db:seed
// Skrypt jest idempotentny – można go odpalać wielokrotnie (nadpisuje własne rekordy "seed-*").
import "dotenv/config";
import { hashPassword } from "better-auth/crypto";
import { Prisma, PersonaType, StepType } from "@/gen/prisma/client";
import { prisma } from "@/lib/prisma";
import { LESSON_PATHS } from "@/lib/lesson/paths";

const PASSWORD = "Password123!";

// ---------- Użytkownicy ----------

type SeedUser = Omit<Prisma.UserUncheckedCreateInput, "id" | "createdAt" | "updatedAt"> & {
  id: string;
  email: string;
};

const USERS: SeedUser[] = [
  {
    id: "seed-user",
    name: "Test User",
    email: "user@example.com",
    emailVerified: true,
    username: "testuser",
    displayUsername: "testuser",
    role: "user",
    experience: 120,
    streak: 2,
  },
  {
    id: "seed-admin",
    name: "Test Admin",
    email: "admin@example.com",
    emailVerified: true,
    username: "testadmin",
    displayUsername: "testadmin",
    role: "admin",
    experience: 0,
    streak: 0,
  },
];

// ---------- Treści lekcji ----------

// Krok seeda: wspólne kolumny + `data` (kształt wg types/step-data.ts).
type SeedStep = { type: StepType; title: string; data: Prisma.InputJsonObject };

type SeedLesson = Omit<
  Prisma.LessonUncheckedCreateInput,
  "steps" | "targetPersonas" | "progress"
> & {
  id: string;
  personas: PersonaType[];
  steps: SeedStep[];
};

// Tematy = ścieżki nauki z LESSON_PATHS (id tematu == parametr ?path= na mapie lekcji).
const TOPICS: Prisma.TopicUncheckedCreateInput[] = LESSON_PATHS.map((path) => ({
  id: path.id,
  topicTitle: path.name
}));

// Każdy temat ma "Chapter 1"; "stock-investor" dodatkowo "Chapter 2" (test grupowania po chapterTitle).
const CHAPTERS: Prisma.ChapterUncheckedCreateInput[] = [
  ...LESSON_PATHS.map((path) => ({
    id: `seed-chapter-${path.id}-1`,
    topicId: path.id,
    orderNumber: 1,
    chapterTitle: "Chapter 1",
  })),
  { id: "seed-chapter-stock-investor-2", topicId: "stock-investor", orderNumber: 2, chapterTitle: "Chapter 2" },
];

// Stare rekordy z poprzedniej wersji seeda – usuwane po przepięciu lekcji.
const LEGACY_CHAPTER_IDS = ["seed-chapter-1", "seed-chapter-2"];
const LEGACY_TOPIC_ID = "seed-topic";

// Komplet czterech typów kroków – używany przez większość lekcji.
const fullSteps = (topic: string): SeedStep[] => [
  {
    type: StepType.story,
    title: `A story about ${topic}`,
    data: {
      narrative: `Anna just got her first salary and wondered what to do with it.\n\nA friend told her to learn about ${topic} before spending anything.`,
    },
  },
  {
    type: StepType.concept,
    title: `What is ${topic}?`,
    data: {
      explanation: `${topic} is a habit of planning money before it is spent.\n\nIt helps you see where money goes and what is left for your goals.`,
      keyTakeaway: `Plan first, spend second.`,
    },
  },
  {
    type: StepType.decision,
    title: "What would you do?",
    data: {
      scenario: "You receive €1,000. Rent is already paid. What is your next move?",
      options: [
        { id: "option-1", label: "Spend it all on something fun", isOptimal: false, feedback: "Fun matters, but nothing is left for emergencies." },
        { id: "option-2", label: "Split it: needs, savings, fun", isOptimal: true, feedback: "A split keeps you safe today and ready for tomorrow." },
        { id: "option-3", label: "Hide it under the mattress", isOptimal: false, feedback: "Saving is good, but inflation slowly eats cash." },
      ],
    },
  },
  {
    type: StepType.summary,
    title: "Summary",
    data: {
      summary: `You learned why ${topic} matters and how to start.`,
      keyTakeaways: ["Plan before you spend", "Keep a safety buffer", "Review your plan every month"],
    },
  },
];

const LESSONS: SeedLesson[] = [
  {
    id: "seed-lesson-1",
    order: 1,
    chapterId: "seed-chapter-personal-finance-1",
    title: "What is a budget?",
    description: "Learn how to plan your monthly income and expenses.",
    estimatedMinutes: 5,
    experience: 50,
    personas: [PersonaType.starter],
    steps: fullSteps("budgeting"),
  },
  {
    id: "seed-lesson-2",
    order: 2,
    chapterId: "seed-chapter-stock-investor-1",
    title: "How the stock market works",
    description: "Shares, prices and why they move.",
    estimatedMinutes: 8,
    experience: 70,
    personas: [PersonaType.starter, PersonaType.family],
    steps: fullSteps("the stock market"),
  },
  {
    // Długi tytuł i opis – sprawdza zawijanie tekstu w karcie.
    id: "seed-lesson-3",
    order: 3,
    chapterId: "seed-chapter-stock-investor-1",
    title: "Diversification: why you should never put all your eggs into one basket, even a very good one",
    description:
      "A longer description used to check text wrapping on the lesson map: how spreading money across different assets, sectors and countries reduces risk without necessarily reducing expected returns.",
    estimatedMinutes: 12,
    experience: 80,
    personas: [PersonaType.starter],
    steps: fullSteps("diversification"),
  },
  {
    id: "seed-lesson-4",
    order: 4,
    chapterId: "seed-chapter-business-finance-1",
    title: "Cash flow for small businesses",
    description: "Why profitable companies still run out of cash.",
    estimatedMinutes: 10,
    experience: 60,
    personas: [PersonaType.family],
    steps: fullSteps("cash flow"),
  },
  {
    id: "seed-lesson-5",
    order: 5,
    chapterId: "seed-chapter-taxes-and-law-1",
    title: "Capital gains tax basics",
    description: "What you owe when your investments make a profit.",
    estimatedMinutes: 7,
    experience: 60,
    personas: [PersonaType.starter, PersonaType.family],
    steps: fullSteps("capital gains tax"),
  },
  {
    // Lekcja bez kroków – sprawdza pusty stan odtwarzacza.
    id: "seed-lesson-6",
    order: 6,
    chapterId: "seed-chapter-stock-investor-2",
    title: "Lesson without steps",
    description: "Used to test the empty state of the lesson player.",
    estimatedMinutes: 1,
    experience: 0,
    personas: [],
    steps: [],
  },
];

// Lekcje ukończone przez zwykłego użytkownika -> status "completed" na mapie.
// Następna po nich jest "active", reszta "locked".
const COMPLETED_BY_USER = ["seed-lesson-1", "seed-lesson-2"];

// ---------- Zapis do bazy ----------

async function seedUsers() {
  const passwordHash = await hashPassword(PASSWORD);

  for (const { id, email, ...rest } of USERS) {
    const data = { ...rest, email };
    await prisma.user.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });

    // Konto "credential" = logowanie e-mail + hasło (tak jak robi to better-auth).
    const account: Prisma.AccountUncheckedCreateInput = {
      id: `${id}-credential`,
      accountId: id,
      providerId: "credential",
      userId: id,
      password: passwordHash,
    };
    await prisma.account.upsert({
      where: { id: account.id! },
      create: account,
      update: { password: passwordHash },
    });
  }
}

async function seedLessons() {
  for (const topic of TOPICS) {
    await prisma.topic.upsert({
      where: { id: topic.id! },
      create: topic,
      update: { topicTitle: topic.topicTitle },
    });
  }

  for (const chapter of CHAPTERS) {
    await prisma.chapter.upsert({
      where: { id: chapter.id! },
      create: chapter,
      update: { topicId: chapter.topicId, orderNumber: chapter.orderNumber, chapterTitle: chapter.chapterTitle },
    });
  }

  for (const { personas, steps, ...lesson } of LESSONS) {
    const { id, ...fields } = lesson;
    await prisma.lesson.upsert({ where: { id }, create: lesson, update: fields });

    // Persony i kroki odtwarzamy od zera, żeby zmiany w seedzie były widoczne po ponownym uruchomieniu.
    await prisma.lessonPersona.deleteMany({ where: { lessonId: id } });
    await prisma.lessonStep.deleteMany({ where: { lessonId: id } });

    if (personas.length > 0) {
      await prisma.lessonPersona.createMany({
        data: personas.map((persona) => ({ lessonId: id, persona })),
      });
    }

    for (const [index, step] of steps.entries()) {
      await prisma.lessonStep.create({ data: { ...step, lessonId: id, order: index + 1 } });
    }
  }

  // Lekcje są już w nowych rozdziałach – stary temat i rozdziały można usunąć.
  await prisma.chapter.deleteMany({ where: { id: { in: LEGACY_CHAPTER_IDS } } });
  await prisma.topic.deleteMany({ where: { id: LEGACY_TOPIC_ID } });
}

async function seedProgress() {
  const completedAt = new Date();
  for (const lessonId of COMPLETED_BY_USER) {
    await prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId: "seed-user", lessonId } },
      create: { userId: "seed-user", lessonId, status: "completed", completedAt },
      update: { status: "completed", completedAt },
    });
  }
}

// ---------- Zadania dnia (pula pytań, także dla Areny) ----------

type SeedDaily = {
  category: string;
  title: string;
  scenario: string;
  rewardExp: number;
  options: [label: string, isOptimal: boolean, feedback: string][];
};

const DAILY: SeedDaily[] = [
  {
    category: "Market Psychology", title: "The market drops 12%", rewardExp: 40,
    scenario: "Your ETF portfolio of €8,000 lost 12% in a month. Headlines are alarming. What do you do?",
    options: [
      ["Sell everything to stop the losses", false, "Selling after a drop locks in the loss and usually means missing the recovery."],
      ["Stick to the plan and keep investing", true, "Correct. A long-term plan should not change because of short-term noise."],
      ["Wait for a few months and decide later", false, "Waiting without a rule often turns into emotional decisions."],
    ],
  },
  {
    category: "Inflation", title: "Savings at 0% interest", rewardExp: 30,
    scenario: "You keep €10,000 on a current account paying 0% while inflation is 3%. What happens over a year?",
    options: [
      ["Nothing, the balance is still €10,000", false, "The number stays, but it buys about 3% less."],
      ["You lose about €300 of purchasing power", true, "Correct. Inflation silently erodes idle cash."],
      ["You gain because prices will fall", false, "With positive inflation, prices rise on average."],
    ],
  },
  {
    category: "Diversification", title: "A hot tech stock", rewardExp: 40,
    scenario: "A colleague says a single tech stock doubled this year. You have €5,000 to invest. What is the most sensible move?",
    options: [
      ["Put everything into that stock", false, "Concentrating on one company is a very high risk."],
      ["Spread across a broad, low-cost index fund", true, "Correct. Diversification reduces the risk of a single failure."],
      ["Buy only after it doubles again", false, "Chasing trends is a common way to buy at the top."],
    ],
  },
  {
    category: "Emergency Fund", title: "An unexpected repair", rewardExp: 30,
    scenario: "Your car needs a €1,200 repair. You have no savings but a credit card with 20% APR. What would have helped most?",
    options: [
      ["A higher credit limit", false, "More credit only makes expensive debt easier to take."],
      ["An emergency fund of 3–6 months of expenses", true, "Correct. A cash buffer avoids costly borrowing."],
      ["Investing all spare money in stocks", false, "Investments can be down exactly when you need the cash."],
    ],
  },
  {
    category: "Compound Interest", title: "Start early or invest more?", rewardExp: 40,
    scenario: "Anna invests €200 a month from age 25, Ben invests €400 a month from age 35, both until 65 at the same return. Who ends up with more?",
    options: [
      ["Ben, because he invests more per month", false, "Ben invests less in total time, and misses ten years of compounding."],
      ["Anna, because of 10 extra years of compounding", true, "Correct. Time in the market is a powerful factor."],
      ["They end up with exactly the same", false, "Different timing means a different result."],
    ],
  },
  {
    category: "Fees", title: "The cost of a 2% fee", rewardExp: 40,
    scenario: "Two funds have the same gross return. Fund A charges 0.2% per year, Fund B charges 2%. Over 30 years, what is the effect?",
    options: [
      ["It is negligible", false, "Fees compound too and can take a large share of the final value."],
      ["Fund B can cost tens of percent of the final wealth", true, "Correct. Small annual fees add up massively."],
      ["Fund B is better because it costs more", false, "Higher price does not mean higher return."],
    ],
  },
  {
    category: "Risk", title: "Risk and return", rewardExp: 30,
    scenario: "An offer promises a guaranteed 25% return per year with no risk. What is the right reaction?",
    options: [
      ["Invest quickly before it ends", false, "Urgency is a classic pressure tactic."],
      ["Treat it as a likely scam", true, "Correct. Higher returns always come with higher risk."],
      ["Invest a small amount to test it", false, "Even small amounts feed a scam and are rarely returned."],
    ],
  },
  {
    category: "Budgeting", title: "Splitting your income", rewardExp: 30,
    scenario: "You earn €2,500 net per month. Which approach follows the common 50/30/20 rule?",
    options: [
      ["€1,250 needs, €750 wants, €500 savings", true, "Correct. 50% needs, 30% wants, 20% savings and debt repayment."],
      ["€500 needs, €750 wants, €1,250 savings", false, "That is unrealistic for most people's fixed costs."],
      ["€2,000 wants, €500 needs", false, "Wants should not exceed needs in a stable budget."],
    ],
  },
  {
    category: "Taxes", title: "Gains and taxes", rewardExp: 30,
    scenario: "You sold shares with a €1,500 profit. What should you remember?",
    options: [
      ["Profits are never taxed", false, "In most countries investment gains are taxed."],
      ["Check the local capital gains rules and set money aside", true, "Correct. Rules differ by country, so plan for the tax."],
      ["Only dividends are taxed", false, "Realised capital gains are usually taxed as well."],
    ],
  },
  {
    category: "Debt", title: "Which debt first?", rewardExp: 40,
    scenario: "You have €3,000 extra. Debts: a €5,000 loan at 4% and a €2,000 credit card at 22%. What is the best use?",
    options: [
      ["Pay down the credit card", true, "Correct. The highest interest rate costs you the most."],
      ["Pay down the 4% loan", false, "The lower rate costs less, so it can wait."],
      ["Split evenly between both", false, "Splitting leaves the expensive debt growing longer."],
    ],
  },
  {
    category: "Dollar-Cost Averaging", title: "Invest in one go or monthly?", rewardExp: 40,
    scenario: "You want to invest €6,000 but fear a market drop. Which approach reduces timing risk?",
    options: [
      ["Invest €500 each month for a year", true, "Correct. Regular investing smooths out the entry price."],
      ["Wait until the market is clearly safe", false, "Nobody can reliably time the market."],
      ["Invest only after a rise", false, "That means buying at higher prices."],
    ],
  },
  {
    category: "Scams", title: "A message from your \"bank\"", rewardExp: 30,
    scenario: "You receive an SMS: \"Your account is blocked, confirm your PIN at this link.\" What do you do?",
    options: [
      ["Click and confirm the PIN", false, "Banks never ask for a PIN through a link."],
      ["Ignore the link and contact the bank via its official app", true, "Correct. This is a typical phishing attempt."],
      ["Reply asking if it is real", false, "Replying confirms your number is active."],
    ],
  },
  {
    category: "Retirement", title: "Retirement savings", rewardExp: 40,
    scenario: "You are 30 and your employer matches pension contributions up to 5% of your salary. What is the smart move?",
    options: [
      ["Contribute enough to get the full match", true, "Correct. The match is an immediate, guaranteed return."],
      ["Skip it, retirement is far away", false, "You lose free money and years of compounding."],
      ["Contribute only 1%", false, "You would leave part of the match unused."],
    ],
  },
  {
    category: "Time Horizon", title: "Money needed in two years", rewardExp: 30,
    scenario: "You need €15,000 for a down payment in 2 years. Where should it be kept?",
    options: [
      ["100% in a volatile stock fund", false, "Stocks can drop sharply in a short period."],
      ["In a safe, easily accessible savings product", true, "Correct. Short horizons call for low-risk instruments."],
      ["In a single cryptocurrency", false, "Very high volatility is unsuitable for a fixed deadline."],
    ],
  },
  {
    category: "Credit", title: "Minimum card payment", rewardExp: 30,
    scenario: "Your card statement shows €1,000 due, with a €25 minimum payment. What is the best choice?",
    options: [
      ["Pay only the minimum", false, "Interest accrues on the rest and the debt lasts for years."],
      ["Pay the full balance if you can", true, "Correct. Paying in full avoids interest entirely."],
      ["Ignore it for a month", false, "Late fees and credit-score damage follow."],
    ],
  },
  {
    category: "Rebalancing", title: "Portfolio drift", rewardExp: 40,
    scenario: "Your 60/40 stocks/bonds portfolio drifted to 75/25 after a rally. What does rebalancing mean here?",
    options: [
      ["Selling some stocks and buying bonds to return to 60/40", true, "Correct. It restores your intended risk level."],
      ["Buying more stocks since they are winning", false, "That increases risk beyond your plan."],
      ["Selling everything and starting over", false, "Rebalancing is a small adjustment, not a restart."],
    ],
  },
];

async function seedDaily() {
  for (const [i, task] of DAILY.entries()) {
    const id = `seed-daily-${i + 1}`;
    const { options, ...fields } = task;
    await prisma.dailyLesson.upsert({
      where: { id },
      create: { id, dateKey: null, ...fields },
      update: fields,
    });
    // opcje odtwarzamy od zera (kolejność ma znaczenie)
    await prisma.dailyOption.deleteMany({ where: { dailyLessonId: id } });
    await prisma.dailyOption.createMany({
      data: options.map(([label, isOptimal, feedback], order) => ({ dailyLessonId: id, order, label, isOptimal, feedback })),
    });
  }
}

async function main() {
  await seedUsers();
  await seedLessons();
  await seedProgress();
  await seedDaily();

  console.log("Seed finished.\n");
  console.log("Accounts (password for both: " + PASSWORD + "):");
  for (const u of USERS) console.log(`  ${u.role?.padEnd(5)}  ${u.email}  (username: ${u.username})`);
  console.log(`\nLessons: ${LESSONS.length}, completed by test user: ${COMPLETED_BY_USER.length}`);
  console.log(`Daily tasks: ${DAILY.length}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
