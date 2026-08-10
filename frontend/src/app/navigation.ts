import {
  Book,
  Cake2,
  Gear,
  JournalText,
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
  // {
  //     label: "Groceries",
  //     path: "/groceries",
  //     icon: Cart3,
  // },
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
  // {
  //     label: "Meal Plans",
  //     path: "/meal-plans",
  //     icon: Calendar2Week,
  // },
  // {
  //     label: "Statistics",
  //     path: "/statistics",
  //     icon: BarChart,
  // },
  // {
  //     label: "Goals",
  //     path: "/goals",
  //     icon: Bullseye,
  // },
];

export const bottomNavigation: NavigationItem[] = [
  {
    label: "Settings",
    path: "/settings",
    icon: Gear,
  },
  // {
  //     label: "Account",
  //     path: "/account",
  //     icon: PersonCircle,
  // },
];
