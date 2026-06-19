import { useEffect } from "react";
import { PhoneFrame, StatusBar } from "./components/PhoneFrame";
import { HomeScreen } from "./components/HomeScreen";
import { InspectionScreen } from "./components/InspectionScreen";
import { ReportView } from "./components/ReportView";
import { EscalationBanner } from "./components/EscalationBanner";
import { useApp } from "./lib/store";
import { loadInitialData } from "./voice/tools";

export default function App() {
  const callStatus = useApp((s) => s.callStatus);
  const onHome = callStatus === "idle" || callStatus === "ended";

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <PhoneFrame>
      <div className="flex h-full flex-col">
        <StatusBar />
        <div className="relative flex-1 overflow-hidden">
          {onHome ? <HomeScreen /> : <InspectionScreen />}
          <EscalationBanner />
          <ReportView />
        </div>
      </div>
    </PhoneFrame>
  );
}
