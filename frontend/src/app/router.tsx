import { createBrowserRouter, Navigate, redirect } from "react-router-dom";

import AppLayout from "./AppLayout";

import { accountsMeRetrieve } from "@/api/generated/sdk.gen";

import LoginPage from "../features/auth/LoginPage";
import RecipesPage from "../features/recipes/RecipesPage";
import RecipeEditPage from "../features/recipes/RecipeEditPage";
import FoodEditPage from "../features/foods/FoodEditPage";
import FoodsPage from "../features/foods/FoodsPage";
import DiaryPage from "../features/diary/DiaryPage";
import GroceriesPage from "@/features/groceries/GroceriesPage";
import GroceriesEditPage from "@/features/groceries/GropceriesEditPage";
import MealPlansPage from "../features/meal_plans/MealPlansPage";
import MealPlanEditPage from "../features/meal_plans/MealPlanEditPage";
import StatisticsPage from "@/features/statistics/StatisticsPage";
import StatisticsEditPage from "@/features/statistics/StatisticsEditPage";
import SettingsPage from "../features/settings/SettingsPage";
import AppearanceSettingsPage from "../features/settings/AppearanceSettingsPage";
import GoalsPage from "../features/goals/GoalsPage";

function placeholder(title: string) {
  return (
    <>
      <h1>{title}</h1>
      <p>Coming soon.</p>
    </>
  );
}

async function authLoader() {
  const { data, error } = await accountsMeRetrieve();

  if (error || !data) {
    throw redirect("/login");
  }

  return data;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },

  {
    loader: authLoader,
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/diary" replace />,
      },

      {
        path: "diary",
        element: <DiaryPage />,
        handle: {
          title: "Diary",
        },
      },

      {
        path: "groceries",
        element: <GroceriesPage />,
        handle: {
          title: "Groceries",
        },
      },

      {
        path: "groceries/:id/edit",
        element: <GroceriesEditPage />,
        handle: {
          title: "Edit Grocery List",
        },
      },

      {
        path: "recipes",
        element: <RecipesPage />,
        handle: {
          title: "My Recipes",
        },
      },

      {
        path: "recipes/:id/edit",
        element: <RecipeEditPage />,
        handle: {
          title: "Edit Recipe",
        },
      },

      {
        path: "foods/:id/edit",
        element: <FoodEditPage />,
        handle: {
          title: "Edit Food",
        },
      },

      {
        path: "foods",
        element: <FoodsPage />,
        handle: {
          title: "Foods",
        },
      },

      {
        path: "meal-plans",
        element: <MealPlansPage />,
        handle: {
          title: "Meal Plans",
        },
      },

      {
        path: "meal-plans/:id/edit",
        element: <MealPlanEditPage />,
        handle: {
          title: "Edit Meal Plan",
        },
      },

      {
        path: "statistics",
        element: <StatisticsPage />,
        handle: {
          title: "Statistics",
        },
      },

      {
        path: "statistics/new",
        element: <StatisticsEditPage />,
        handle: {
          title: "New Graph",
        },
      },

      {
        path: "statistics/:id/edit",
        element: <StatisticsEditPage />,
        handle: {
          title: "Edit Graph",
        },
      },

      {
        path: "settings/goals",
        element: <GoalsPage />,
        handle: {
          title: "Goals",
        },
      },

      {
        path: "settings",
        element: <SettingsPage />,
        handle: {
          title: "Settings",
        },
      },

      {
        path: "settings/appearance",
        element: <AppearanceSettingsPage />,
        handle: {
          title: "Appearance",
        },
      },
      {
        path: "account",
        element: placeholder("Account"),
        handle: {
          title: "Account",
        },
      },
    ],
  },
]);

export default router;
