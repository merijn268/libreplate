import { useEffect, useState } from "react";

import type { Food } from "@/api/generated";
import {
  integrationsAddCreate,
  integrationsSearchList,
  foodsList,
} from "@/api/generated";
import Modal from "@/components/modals/Modal";

interface FoodPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (foods: Food[]) => void;
}

interface SearchFood extends Food {
  selectionId: string;
}

const RESULTS_HEIGHT = 360;

function getCalories(food: Food): number | null {
  const nutrients = food.nutrients ?? [];

  const byUnit = nutrients.find(
    (n) => n.nutrient.unit?.toLowerCase() === "kcal",
  );

  if (byUnit) {
    return byUnit.amount;
  }

  const byName = nutrients.find((n) => /energy|calorie/i.test(n.nutrient.name));

  return byName?.amount ?? null;
}

export default function FoodPickerModal({
  isOpen,
  onClose,
  onSelect,
}: FoodPickerModalProps) {
  const [search, setSearch] = useState("");

  const [localFoods, setLocalFoods] = useState<Food[]>([]);
  const [searchFoods, setSearchFoods] = useState<SearchFood[]>([]);

  const [selectedLocalIds, setSelectedLocalIds] = useState<Set<number>>(
    new Set(),
  );

  const [selectedSearchIds, setSelectedSearchIds] = useState<Set<string>>(
    new Set(),
  );

  const [isSearchResult, setIsSearchResult] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    async function loadFoods() {
      setIsLoading(true);
      setIsError(false);

      try {
        const response = await foodsList();

        setLocalFoods(response.data ?? []);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadFoods();
  }, [isOpen]);

  const filteredLocalFoods = localFoods.filter((food) =>
    food.name.toLowerCase().includes(search.toLowerCase()),
  );

  async function searchFoodsExternal() {
    if (!search.trim()) {
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setIsSearchResult(true);

    try {
      const response = await integrationsSearchList({
        query: {
          query: search.trim(),
          services: "Dirk",
          limit: 20,
        },
      });

      setSearchFoods(
        (response.data ?? []).map((food: Food) => ({
          ...food,
          selectionId: crypto.randomUUID(),
        })) as SearchFood[],
      );

      setSelectedLocalIds(new Set());
      setSelectedSearchIds(new Set());
    } catch (error) {
      console.error(error);

      setSearchFoods([]);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }

  function toggleLocalFood(id: number) {
    setSelectedLocalIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function toggleSearchFood(id: string) {
    setSelectedSearchIds((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function reset() {
    setSearch("");
    setSearchFoods([]);
    setSelectedLocalIds(new Set());
    setSelectedSearchIds(new Set());
    setIsSearchResult(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleConfirm() {
    if (isSearchResult) {
      const selected = searchFoods.filter((food) =>
        selectedSearchIds.has(food.selectionId),
      );

      if (!selected.length) {
        return;
      }

      setIsSubmitting(true);
      setIsError(false);

      try {
        const createdFoods = await Promise.all(
          selected.map(async (food) => {
            if (!food.external_source || !food.external_id) {
              throw new Error("Missing integration details for food");
            }

            const response = await integrationsAddCreate({
              body: {
                service: food.external_source as "Dirk" | "USDA",
                external_id: food.external_id,
              },
            });

            if (!response.data) {
              throw new Error("Failed to add food");
            }

            return response.data;
          }),
        );

        onSelect(createdFoods);
        reset();
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    const foods = localFoods.filter((food) => selectedLocalIds.has(food.id));

    if (!foods.length) {
      return;
    }

    onSelect(foods);
    reset();
  }

  const selectedCount = isSearchResult
    ? selectedSearchIds.size
    : selectedLocalIds.size;

  return (
    <Modal
      isOpen={isOpen}
      title="Select foods"
      onClose={handleClose}
      footer={
        <div className="d-flex justify-content-between align-items-center">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>

          <button
            className="btn btn-primary"
            disabled={selectedCount === 0 || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting
              ? "Adding..."
              : `Add ${selectedCount || ""} food${
                  selectedCount === 1 ? "" : "s"
                }`}
          </button>
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          searchFoodsExternal();
        }}
      >
        <div className="mb-3">
          <input
            className="form-control"
            placeholder="Search food..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setIsSearchResult(false);
            }}
          />
        </div>
      </form>

      {isError && (
        <p className="text-danger">
          {isSearchResult
            ? "Failed to add the selected food(s)."
            : "Failed to load foods."}
        </p>
      )}

      <div className="overflow-auto" style={{ height: RESULTS_HEIGHT }}>
        {isLoading && <p>Loading foods...</p>}

        {!isLoading &&
          !isSearchResult &&
          filteredLocalFoods.map((food) => {
            const checked = selectedLocalIds.has(food.id);
            const calories = getCalories(food);

            return (
              <label
                key={food.id}
                className="d-flex justify-content-between align-items-center rounded px-2 py-1 mb-1"
                style={{
                  cursor: "pointer",
                  background: checked ? "#f0f6ff" : undefined,
                }}
              >
                <span>
                  <input
                    className="me-2"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleLocalFood(food.id)}
                  />

                  {food.name}
                </span>

                <small className="text-muted">
                  {calories !== null ? `${Math.round(calories)} kcal` : "—"}
                </small>
              </label>
            );
          })}

        {!isLoading &&
          isSearchResult &&
          searchFoods.map((food) => {
            const checked = selectedSearchIds.has(food.selectionId);

            return (
              <label
                key={food.selectionId}
                className="d-flex justify-content-between align-items-center rounded px-2 py-1 mb-1"
                style={{
                  cursor: "pointer",
                  background: checked ? "#f0f6ff" : undefined,
                }}
              >
                <span>
                  <input
                    className="me-2"
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSearchFood(food.selectionId)}
                  />

                  {food.name}
                </span>

                <small className="text-muted">{food.external_source}</small>
              </label>
            );
          })}

        {!isLoading && !isSearchResult && filteredLocalFoods.length === 0 && (
          <p className="text-muted">No foods found.</p>
        )}

        {!isLoading && isSearchResult && searchFoods.length === 0 && (
          <p className="text-muted">No foods found.</p>
        )}
      </div>
    </Modal>
  );
}
