import { useState } from "react";

import type { Food } from "@/api/generated";
import AmountItem from "@/components/ui/meal_card/AmountItem";
import EditFoodAmountsModal from "@/components/ui/modals/EditFoodAmountsModal";

type Props = {
  item: {
    id: number;
    food: Food;
    serving_size?: number | null;
    number_of_servings?: number | null;
  };
  onSave: (values: {
    id: number;
    serving_size: number;
    number_of_servings: number;
  }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

export default function FoodAmountItem({ item, onSave, onDelete }: Props) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const servingSize = item.serving_size ?? 0;
  const numberOfServings = item.number_of_servings ?? 0;

  async function handleDelete() {
    setIsDeleting(true);

    try {
      await onDelete(item.id);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <AmountItem
        label={item.food.name}
        amount={`${servingSize}g × ${numberOfServings}`}
        onClick={() => setIsEditOpen(true)}
        onDelete={() => void handleDelete()}
        isDeleting={isDeleting}
        deleteLabel={`Remove ${item.food.name}`}
      />

      {isEditOpen && (
        <EditFoodAmountsModal
          food={item.food}
          servingSize={servingSize}
          numberOfServings={numberOfServings}
          onClose={() => setIsEditOpen(false)}
          onSave={async (values) => {
            await onSave({
              id: item.id,
              ...values,
            });
          }}
        />
      )}
    </>
  );
}
