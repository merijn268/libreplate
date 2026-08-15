import { useState } from "react";

import type { Food } from "@/api/generated";
import AmountItem from "@/components/meal_card/AmountItem";
import EditFoodAmountModal from "@/components/modals/EditFoodAmountModal";

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

  const servingSize = item.serving_size ?? 0;
  const numberOfServings = item.number_of_servings ?? 0;

  return (
    <>
      <AmountItem
        label={item.food.name}
        amount={`${servingSize * numberOfServings}g`}
        onClick={() => setIsEditOpen(true)}
      />

      {isEditOpen && (
        <EditFoodAmountModal
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
          onDelete={async () => {
            await onDelete(item.id);
            setIsEditOpen(false);
          }}
        />
      )}
    </>
  );
}
