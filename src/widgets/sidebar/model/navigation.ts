// Widget: Sidebar - Navigation Items Configuration

import { Home, Building2, Newspaper, Brain, ListTodo } from "lucide-react";

export type NavigationItem = {
  nameKey: string; // i18n key
  href: string;
  icon: typeof Home;
};

export const navigationItems: NavigationItem[] = [
  { nameKey: "nav.dashboard", href: "/", icon: Home },
  { nameKey: "nav.analyze", href: "/analyze", icon: Brain },
  { nameKey: "nav.companies", href: "/situations", icon: Building2 },
  { nameKey: "nav.news", href: "/news", icon: Newspaper },
  { nameKey: "nav.jobs", href: "/jobs", icon: ListTodo },
];
