"use client";
import React from "react";

interface Tab {
  key: string;
  label: string;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}) => {
  return (
    <div
      className={
        "flex gap-2 mb-6 border-b border-muted " +
        className
      }
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => !tab.disabled && onTabChange(tab.key)}
          className={
            "px-5 py-2 text-sm font-semibold rounded-t-xl transition-all " +
            (tab.key === activeTab
              ? "bg-card text-accent border-x border-t border-muted border-b-0"
              : "text-muted hover:text-foreground bg-transparent border-b-2 border-transparent") +
            (tab.disabled ? " opacity-40 cursor-not-allowed" : " cursor-pointer")
          }
          disabled={tab.disabled}
          type="button"
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
