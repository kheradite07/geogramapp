"use client";

import { useState } from "react";
import InputBar from "@/components/InputBar";
import BottomMenu from "@/components/BottomMenu";
import FriendsView from "@/components/views/FriendsView";
import SettingsView from "@/components/views/SettingsView";
import { useUser } from "@/hooks/useUser";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"map" | "friends" | "settings">("map");
  const { user } = useUser();

  const friendRequestCount = user?.friendRequests?.incoming?.length || 0;

  return (
    <main className="w-full h-full pointer-events-none relative">
      {/* Map is always in background in layout.tsx */}

      <AnimatePresence mode="wait">
        {/* Active View */}
        {activeTab === "friends" && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }} // Simple fade out/down
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm"
          >
            <FriendsView />
          </motion.div>
        )}

        {/* ... other views ... */}
        {activeTab === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm"
          >
            <SettingsView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar only on Map */}
      <AnimatePresence>
        {activeTab === "map" && (
          <motion.div
            key="inputbar"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-x-0 bottom-0 top-0 pointer-events-none z-30"
          >
            <InputBar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <BottomMenu
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={friendRequestCount}
      />
    </main>
  );
}
