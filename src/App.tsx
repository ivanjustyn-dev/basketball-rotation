import { Toaster } from "sonner";
import { AppHeader } from "./components/AppHeader";
import { CourtSection } from "./components/CourtSection";
import { PrimaryActions } from "./components/PrimaryActions";
import { QueueSection } from "./components/QueueSection";
import { RegisteredPlayersSection } from "./components/RegisteredPlayersSection";
import { RestingSection } from "./components/RestingSection";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <AppHeader />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-4 pb-10">
        <PrimaryActions />
        <CourtSection />
        <QueueSection />
        <RestingSection />
        <RegisteredPlayersSection />
      </main>
      <Toaster richColors position="top-center" />
    </div>
  );
}
