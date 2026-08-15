import {
  Book,
  Cake2,
  Calendar3,
  Gear,
  JournalText,
  Cart4,
  GraphDown,
  type Icon,
} from "react-bootstrap-icons";

export interface NavigationItem {
  label: string;
  path: string;
  icon: Icon;
}

export const mainNavigation: NavigationItem[] = [
  {
    label: "Diary",
    path: "/diary",
    icon: JournalText,
  },
  {
    label: "Recipes",
    path: "/recipes",
    icon: Book,
  },
  {
    label: "Foods",
    path: "/foods",
    icon: Cake2,
  },
  {
    label: "Groceries",
    path: "/groceries",
    icon: Cart4,
  },
  // TODO easter egg, when bulking it goes up.
  {
    label: "Statistics",
    path: "/statistics",
    icon: GraphDown,
  },
  {
    label: "Meal Plans",
    path: "/meal-plans",
    icon: Calendar3,
  },
];

export const bottomNavigation: NavigationItem[] = [
  {
    label: "Settings",
    path: "/settings",
    icon: Gear,
  },
];
