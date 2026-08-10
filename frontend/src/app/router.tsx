import { createBrowserRouter, Navigate, redirect } from "react-router-dom";

import AppLayout from "./AppLayout";

import { accountsMeRetrieve } from "@/api/generated/sdk.gen";

import LoginPage from "../features/auth/LoginPage";
import RecipesPage from "../features/recipes/RecipesPage";
import RecipeEditPage from "../features/recipes/RecipeEditPage";
import FoodEditPage from "../features/foods/FoodEditPage";
import FoodsPage from "../features/foods/FoodsPage";
import DiaryPage from "../features/diary/DiaryPage";
import MealPlansPage from "../features/meal_plans/MealPlansPage";
import MealPlanEditPage from "../features/meal_plans/MealPlanEditPage";
import SettingsPage from "../features/settings/SettingsPage";
import AppearanceSettingsPage from "../features/settings/AppearanceSettingsPage";

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
        element: placeholder("Groceries"),
        handle: {
          title: "Groceries",
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
        element: placeholder("Statistics"),
        handle: {
          title: "Statistics",
        },
      },

      {
        path: "goals",
        element: placeholder("Goals"),
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
