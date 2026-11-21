// Komponent serwerowy: pobiera listę zadań (do wyboru przy eksporcie) dla ikon import/eksport.
import { requireAdmin } from "@/lib/session";
import { getDailyPool } from "@/lib/daily/admin-queries";
import { DailyTransferButtons } from "./daily-transfer";

export async function DailyTransferLoader() {
  await requireAdmin(); // odczyt sesji = dane żądania (tryb dynamiczny) + kontrola roli
  const tasks = await getDailyPool();
  return <DailyTransferButtons tasks={tasks} />;
}
