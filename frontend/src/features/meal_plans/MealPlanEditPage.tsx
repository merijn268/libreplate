import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { mealPlansPartialUpdate, mealPlansRetrieve } from "@/api/generated";
import type { PatchedMealPlanWritable } from "@/api/generated";

import MealPlanEditForm from "./components/edit/MealPlanEditForm";
import MealPlanEditTabs from "./components/edit/MealPlanEditTabs";
import MealPlanMealsFoodsTab from "./components/edit/MealPlanEditContent";

type EditTab = "details" | "meals-foods";

export default function MealPlanEditPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<EditTab>("details");

  const mealPlanId = Number(id);

  const mealPlanQuery = useQuery({
    queryKey: ["meal-plan", mealPlanId],
    enabled: Number.isInteger(mealPlanId),
    queryFn: async () => {
      const response = await mealPlansRetrieve({
        path: {
          id: mealPlanId,
        },
      });

      return response.data;
    },
  });

  const updateMealPlan = useMutation({
    mutationFn: (data: PatchedMealPlanWritable) =>
      mealPlansPartialUpdate({
        path: {
          id: mealPlanId,
        },
        body: data,
      }),
    onSuccess: (response) => {
      queryClient.setQueryData(["meal-plan", mealPlanId], response.data);

      queryClient.invalidateQueries({
        queryKey: ["meal-plans"],
      });
    },
  });

  if (!Number.isInteger(mealPlanId)) {
    return <div className="alert alert-danger">Invalid meal plan.</div>;
  }

  if (mealPlanQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (mealPlanQuery.isError) {
    return <div className="alert alert-danger">Failed to load meal plan.</div>;
  }

  const mealPlan = mealPlanQuery.data;

  if (!mealPlan) {
    return <div className="alert alert-danger">Meal plan not found.</div>;
  }

  return (
    <div className="container">
      <MealPlanEditTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "details" && (
        <MealPlanEditForm
          mealPlan={mealPlan}
          onSubmit={(data) => updateMealPlan.mutate(data)}
          onCancel={() => navigate("/meal-plans")}
          isSaving={updateMealPlan.isPending}
        />
      )}

      {activeTab === "meals-foods" && <MealPlanMealsFoodsTab />}
    </div>
  );
}
