import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import type { FoodNutrient, Nutrient } from "@/api/generated";
import {
  foodsDestroy,
  foodsPartialUpdate,
  foodsRetrieve,
  nutrientsList,
} from "@/api/generated";

export default function FoodEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const foodId = Number(id);

  const foodQuery = useQuery({
    queryKey: ["food", foodId],
    queryFn: async () => {
      const response = await foodsRetrieve({
        path: {
          id: foodId,
        },
      });

      return response.data;
    },
  });

  const nutrientsQuery = useQuery({
    queryKey: ["nutrients"],
    queryFn: async () => {
      const response = await nutrientsList();

      return response.data;
    },
  });

  const updateFood = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Record<string, unknown>;
    }) => {
      const response = await foodsPartialUpdate({
        path: {
          id,
        },
        body: data,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["food", foodId],
      });
    },
  });

  const deleteFood = useMutation({
    mutationFn: async (id: number) => {
      await foodsDestroy({
        path: {
          id,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["foods"],
      });
    },
  });

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [serving, setServing] = useState<number | "">("");
  const [unitID, setUnitID] = useState(0);
  const [unitName, setUnitName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [nutrients, setNutrients] = useState<FoodNutrient[]>([]);

  // Prefill the form fields whenever a new `foodQuery.data` object arrives
  // (initial load, switching food id, or a refetch after save). Computed
  // during render instead of via an effect.
  const [syncedFood, setSyncedFood] = useState(foodQuery.data);

  if (foodQuery.data && foodQuery.data !== syncedFood) {
    setSyncedFood(foodQuery.data);

    const food = foodQuery.data;

    setName(food.name);
    setBrand(food.brand ?? "");
    setDescription(food.description ?? "");
    setServing(food.serving ?? "");
    setUnitID(food.unit.id);
    setUnitName(food.unit.name);
    setBarcode(food.barcode ?? "");
    setIsFavorite(food.is_favorite ?? false);
  }

  // Recompute the merged nutrients list whenever the food or the available
  // nutrient definitions change, again during render rather than in an
  // effect.
  const [syncedNutrientSources, setSyncedNutrientSources] = useState<{
    food: typeof foodQuery.data;
    nutrients: typeof nutrientsQuery.data;
  }>({ food: foodQuery.data, nutrients: nutrientsQuery.data });

  if (
    foodQuery.data &&
    nutrientsQuery.data &&
    (foodQuery.data !== syncedNutrientSources.food ||
      nutrientsQuery.data !== syncedNutrientSources.nutrients)
  ) {
    setSyncedNutrientSources({
      food: foodQuery.data,
      nutrients: nutrientsQuery.data,
    });

    const food = foodQuery.data;
    const availableNutrients = nutrientsQuery.data;

    const relevantNutrients = availableNutrients.filter(
      (nutrient: Nutrient) =>
        nutrient.show_in_food_edit ||
        food.nutrients?.some((n) => n.nutrient.id === nutrient.id),
    );

    const merged: FoodNutrient[] = relevantNutrients.map(
      (nutrient: Nutrient) => {
        const existing = food.nutrients?.find(
          (n) => n.nutrient.id === nutrient.id,
        );

        return {
          nutrient: {
            id: nutrient.id,
            name: nutrient.name,
            unit: nutrient.unit,
          },
          amount: existing?.amount ?? 0,
        };
      },
    );

    setNutrients(merged);
  }

  if (foodQuery.isPending || nutrientsQuery.isPending) {
    return <div>Loading...</div>;
  }

  if (foodQuery.isError || nutrientsQuery.isError) {
    return <div>Failed to load food.</div>;
  }

  function updateNutrientAmount(index: number, amount: number) {
    setNutrients((prev) =>
      prev.map((n, i) =>
        i === index
          ? {
              ...n,
              amount,
            }
          : n,
      ),
    );
  }

  function handleSave() {
    updateFood.mutate(
      {
        id: foodId,
        data: {
          name,
          brand: brand || null,
          description: description || "",
          serving: serving === "" ? 0 : Number(serving),
          unit_id: unitID,
          barcode: barcode || null,
          is_favorite: isFavorite,
          nutrients: nutrients.map((n) => ({
            nutrient_id: n.nutrient.id,
            amount: Number(n.amount),
          })),
        },
      },
      {
        onSuccess: () => navigate("/foods"),
      },
    );
  }

  function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"? This cannot be undone.`,
    );

    if (confirmed) {
      deleteFood.mutate(foodId, {
        onSuccess: () => navigate("/foods"),
      });
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between mb-3">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={() => navigate("/foods")}
        >
          Back
        </button>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleDelete}
          disabled={deleteFood.isPending}
        >
          <i className="bi bi-trash me-1" />
          Delete
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <label className="form-label">Name</label>
              <input
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Brand</label>
              <input
                className="form-control"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
              />
            </div>

            <div className="col-12">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label">Serving</label>
              <input
                type="number"
                className="form-control"
                value={serving}
                onChange={(e) =>
                  setServing(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label">Unit</label>
              <input className="form-control" value={unitName} readOnly />
            </div>

            <div className="col-12 col-md-6">
              <label className="form-label">Barcode</label>
              <input
                className="form-control"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="isFavorite"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                />

                <label className="form-check-label" htmlFor="isFavorite">
                  Favorite
                </label>
              </div>
            </div>
          </div>

          <hr className="my-4" />

          <h5 className="mb-3">Nutrients</h5>

          {nutrients.length === 0 && (
            <p className="text-muted">No nutrients configured.</p>
          )}

          {nutrients.map((nutrient, index) => (
            <div
              key={nutrient.nutrient.id}
              className="d-flex align-items-center gap-2 mb-2"
            >
              <div className="text-truncate" style={{ width: "160px" }}>
                {nutrient.nutrient.name}
              </div>

              <input
                type="number"
                className="form-control form-control-sm text-end"
                style={{ width: "90px" }}
                value={nutrient.amount}
                onChange={(e) =>
                  updateNutrientAmount(index, Number(e.target.value))
                }
              />

              <span className="text-muted">{nutrient.nutrient.unit}</span>
            </div>
          ))}

          <div className="text-end mt-4">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={updateFood.isPending}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
