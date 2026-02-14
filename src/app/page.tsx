"use client";

import { useState } from "react";
import InputBar from "@/components/InputBar";
import BottomMenu from "@/components/BottomMenu";
import FriendsView from "@/components/views/FriendsView";
import SettingsView from "@/components/views/SettingsView";
import { useUser } from "@/hooks/useUser";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"map" | "friends" | "settings">("map");
  const { user } = useUser();

  const friendRequestCount = user?.friendRequests?.incoming?.length || 0;

  return (
    <main className="w-full h-full pointer-events-none relative">
      {/* Map is always in background in layout.tsx */}

      {/* Active View */}
      {activeTab === "friends" && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm">
          <FriendsView />
        </div>
      )}

      {/* ... other views ... */}
      {activeTab === "settings" && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm">
          <SettingsView />
        </div>
      )}

      {/* Input Bar only on Map */}
      {activeTab === "map" && <InputBar />}

      {/* Bottom Navigation */}
      <BottomMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={friendRequestCount}
      />
    </main>
  );
}
