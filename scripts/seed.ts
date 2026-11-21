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

type SeedOption = Omit<Prisma.DecisionOptionUncheckedCreateInput, "id" | "stepId" | "order">;

type SeedStep = Omit<
  Prisma.LessonStepUncheckedCreateInput,
  "id" | "lessonId" | "order" | "options" | "keyTakeaways"
> & {
  keyTakeaways?: string[];
  options?: SeedOption[];
};

type SeedLesson = Omit<
  Prisma.LessonUncheckedCreateInput,
  "steps" | "targetPersonas" | "progress"
> & {
  id: string;
  personas: PersonaType[];
  steps: SeedStep[];
};

const TOPIC_ID = "seed-topic";

const CHAPTERS: Prisma.ChapterUncheckedCreateInput[] = [
  { id: "seed-chapter-1", topicId: TOPIC_ID, orderNumber: 1, chapterTitle: "Money basics" },
  { id: "seed-chapter-2", topicId: TOPIC_ID, orderNumber: 2, chapterTitle: "First investments" },
];

// Komplet czterech typów kroków – używany przez większość lekcji.
const fullSteps = (topic: string): SeedStep[] => [
  {
    type: StepType.story,
    title: `A story about ${topic}`,
    narrative: `Anna just got her first salary and wondered what to do with it.\n\nA friend told her to learn about ${topic} before spending anything.`,
  },
  {
    type: StepType.concept,
    title: `What is ${topic}?`,
    explanation: `${topic} is a habit of planning money before it is spent.\n\nIt helps you see where money goes and what is left for your goals.`,
    keyTakeaway: `Plan first, spend second.`,
  },
  {
    type: StepType.decision,
    title: "What would you do?",
    scenario: "You receive 1000 PLN. Rent is already paid. What is your next move?",
    options: [
      { label: "Spend it all on something fun", isOptimal: false, feedback: "Fun matters, but nothing is left for emergencies." },
      { label: "Split it: needs, savings, fun", isOptimal: true, feedback: "A split keeps you safe today and ready for tomorrow." },
      { label: "Hide it under the mattress", isOptimal: false, feedback: "Saving is good, but inflation slowly eats cash." },
    ],
  },
  {
    type: StepType.summary,
    title: "Summary",
    summary: `You learned why ${topic} matters and how to start.`,
    keyTakeaways: ["Plan before you spend", "Keep a safety buffer", "Review your plan every month"],
  },
];

const LESSONS: SeedLesson[] = [
  {
    id: "seed-lesson-1",
    order: 1,
    pathId: "personal-finance",
    chapterId: "seed-chapter-1",
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
    pathId: "stock-investor",
    chapterId: "seed-chapter-2",
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
    pathId: "stock-investor",
    chapterId: "seed-chapter-2",
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
    pathId: "business-finance",
    chapterId: "seed-chapter-2",
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
    pathId: "taxes-and-law",
    chapterId: "seed-chapter-2",
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
    pathId: "stock-investor",
    chapterId: "seed-chapter-2",
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
  await prisma.topic.upsert({
    where: { id: TOPIC_ID },
    create: { id: TOPIC_ID, topicTitle: "Finance basics" },
    update: { topicTitle: "Finance basics" },
  });

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

    for (const [index, { options, keyTakeaways, ...step }] of steps.entries()) {
      await prisma.lessonStep.create({
        data: {
          ...step,
          lessonId: id,
          order: index + 1,
          ...(keyTakeaways ? { keyTakeaways } : {}),
          ...(options
            ? { options: { create: options.map((o, i) => ({ ...o, order: i + 1 })) } }
            : {}),
        },
      });
    }
  }
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

async function main() {
  await seedUsers();
  await seedLessons();
  await seedProgress();

  console.log("Seed finished.\n");
  console.log("Accounts (password for both: " + PASSWORD + "):");
  for (const u of USERS) console.log(`  ${u.role?.padEnd(5)}  ${u.email}  (username: ${u.username})`);
  console.log(`\nLessons: ${LESSONS.length}, completed by test user: ${COMPLETED_BY_USER.length}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
