import { useCallback, useEffect, useMemo, useState } from "react";

import type { Recipe, RecipeIngredient } from "@/api/generated/types.gen";
import {
  recipesIngredientsCreate,
  recipesIngredientsDestroy,
  recipesIngredientsPartialUpdate,
  foodsRetrieve,
  type Food,
} from "@/api/generated";

import { useQuery } from "@tanstack/react-query";

import FoodPickerModal from "@/features/foods/components/FoodPickerModal";

import FoodAmountItem from "@/components/ui/FoodAmountItem";
import TotalsModal from "@/components/ui/modals/NutrientsTotalsModal";

interface IngredientsCardProps {
  recipe: Recipe;
}

const nutrients = {
  energy: ["energy", "calories"],
  protein: ["protein"],
  fat: ["fat", "total lipid"],
  carbohydrates: ["carbohydrate", "carbs"],
};

type NutrientTotals = Record<keyof typeof nutrients, number>;

function emptyTotals(): NutrientTotals {
  return {
    energy: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
  };
}

function getNutrient(food: Food, names: string[]) {
  return (
    food.nutrients?.find((n) =>
      names.some((name) => n.nutrient.name.toLowerCase().includes(name)),
    )?.amount ?? 0
  );
}

function calculateNutrients(
  food: Food,
  numberOfServings: number | null | undefined,
  servingSize: number | null | undefined,
): NutrientTotals {
  const multiplier =
    food.serving && food.serving > 0
      ? (Number(numberOfServings ?? 0) * Number(servingSize ?? 0)) /
        food.serving
      : 0;

  return Object.fromEntries(
    Object.entries(nutrients).map(([key, names]) => [
      key,
      getNutrient(food, names) * multiplier,
    ]),
  ) as NutrientTotals;
}

function useFood(id: number) {
  return useQuery({
    queryKey: ["food", id],
    queryFn: async () => {
      const response = await foodsRetrieve({
        path: {
          id,
        },
      });

      return response.data;
    },
  });
}

function IngredientTotalsItem({
  ingredient,
  onChange,
}: {
  ingredient: RecipeIngredient;
  onChange: (id: number, values: NutrientTotals) => void;
}) {
  const { data: food } = useFood(ingredient.food);

  useEffect(() => {
    if (!food) {
      return;
    }

    onChange(
      ingredient.id,
      calculateNutrients(
        food,
        ingredient.number_of_servings,
        ingredient.serving_amount,
      ),
    );
  }, [
    food,
    ingredient.id,
    ingredient.number_of_servings,
    ingredient.serving_amount,
    onChange,
  ]);

  return null;
}

function IngredientTotals({
  ingredients,
  onTotalsClick,
}: {
  ingredients: RecipeIngredient[];
  onTotalsClick: (totals: NutrientTotals) => void;
}) {
  const [ingredientTotals, setIngredientTotals] = useState<
    Record<number, NutrientTotals>
  >({});

  useEffect(() => {
    setIngredientTotals((current) => {
      const next = { ...current };

      Object.keys(next).forEach((id) => {
        if (!ingredients.some((item) => item.id === Number(id))) {
          delete next[Number(id)];
        }
      });

      return next;
    });
  }, [ingredients]);

  const updateTotal = useCallback((id: number, values: NutrientTotals) => {
    setIngredientTotals((current) => ({
      ...current,
      [id]: values,
    }));
  }, []);

  const totals = useMemo(() => {
    return ingredients.reduce<NutrientTotals>((sum, ingredient) => {
      const values = ingredientTotals[ingredient.id] ?? emptyTotals();

      return {
        energy: sum.energy + values.energy,
        protein: sum.protein + values.protein,
        fat: sum.fat + values.fat,
        carbohydrates: sum.carbohydrates + values.carbohydrates,
      };
    }, emptyTotals());
  }, [ingredients, ingredientTotals]);

  return (
    <>
      {ingredients.map((ingredient) => (
        <IngredientTotalsItem
          key={ingredient.id}
          ingredient={ingredient}
          onChange={updateTotal}
        />
      ))}

      <tfoot className="table fw-semibold">
        <tr style={{ cursor: "pointer" }} onClick={() => onTotalsClick(totals)}>
          <td>Totals</td>
          <td colSpan={2} />
          <td>{Math.round(totals.energy)} kcal</td>
          <td>{Math.round(totals.protein)} P</td>
          <td>{Math.round(totals.fat)} F</td>
          <td>{Math.round(totals.carbohydrates)} C</td>
        </tr>
      </tfoot>
    </>
  );
}

function IngredientItem({
  ingredient,
  onSave,
  onDelete,
}: {
  ingredient: RecipeIngredient;
  onSave: (
    id: number,
    values: {
      servingSize: number;
      numberOfServings: number;
    },
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const { data: food } = useFood(ingredient.food);

  if (!food) {
    return <li className="list-group-item">Loading...</li>;
  }

  return (
    <FoodAmountItem
      item={{
        id: ingredient.id,
        food,
        serving_size: ingredient.serving_amount,
        number_of_servings: ingredient.number_of_servings,
      }}
      onSave={async (values) => {
        await onSave(ingredient.id, {
          servingSize: values.serving_size,
          numberOfServings: values.number_of_servings,
        });
      }}
      onDelete={onDelete}
    />
  );
}

export default function IngredientsCard({ recipe }: IngredientsCardProps) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    recipe.ingredients ?? [],
  );

  const [pickerOpen, setPickerOpen] = useState(false);
  const [isTotalsModalOpen, setIsTotalsModalOpen] = useState(false);
  const [totals, setTotals] = useState<NutrientTotals>(emptyTotals());

  useEffect(() => {
    setIngredients(recipe.ingredients ?? []);
  }, [recipe.ingredients]);

  const addFood = async (foods: Food[]) => {
    setPickerOpen(false);

    let order = ingredients.length;

    for (const food of foods) {
      const response = await recipesIngredientsCreate({
        path: {
          id: recipe.id,
        },
        body: {
          food: food.id,
          number_of_servings: 1,
          serving_amount: food.serving ?? 1,
          order,
        },
      });

      order++;

      if (response.data) {
        setIngredients((items) => [...items, response.data]);
      }
    }
  };

  const updateIngredient = async (
    id: number,
    values: {
      servingSize: number;
      numberOfServings: number;
    },
  ) => {
    setIngredients((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              serving_amount: values.servingSize,
              number_of_servings: values.numberOfServings,
            }
          : item,
      ),
    );

    await recipesIngredientsPartialUpdate({
      path: {
        id: recipe.id,
        ingredient_pk: id,
      },
      body: {
        serving_amount: values.servingSize,
        number_of_servings: values.numberOfServings,
      },
    });
  };

  const removeIngredient = async (id: number) => {
    setIngredients((items) => items.filter((item) => item.id !== id));

    await recipesIngredientsDestroy({
      path: {
        id: recipe.id,
        ingredient_pk: id,
      },
    });
  };

  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <TotalsModal
          isOpen={isTotalsModalOpen}
          onClose={() => setIsTotalsModalOpen(false)}
          title={recipe.name}
          totals={{
            energy: totals.energy,
            protein: totals.protein,
            fat: totals.fat,
            carbs: totals.carbohydrates,
          }}
        />

        <div className="d-flex justify-content-between mb-4">
          <h4 className="card-title mb-0">Ingredients</h4>

          <button
            className="btn btn-primary"
            onClick={() => setPickerOpen(true)}
          >
            Add ingredient
          </button>
        </div>

        <ul className="list-group list-group-flush">
          {ingredients.map((ingredient) => (
            <IngredientItem
              key={ingredient.id}
              ingredient={ingredient}
              onSave={updateIngredient}
              onDelete={removeIngredient}
            />
          ))}
        </ul>

        <table className="table table-hover align-middle mt-3">
          <IngredientTotals
            ingredients={ingredients}
            onTotalsClick={(values) => {
              setTotals(values);
              setIsTotalsModalOpen(true);
            }}
          />
        </table>
      </div>

      <FoodPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addFood}
      />
    </div>
  );
}
