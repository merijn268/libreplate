import type { GroceryListFood } from "@/api/generated/types.gen";

interface Props {
  item: GroceryListFood;
  onToggle: (id: number) => void;
}

export default function GroceryItemRow({ item, onToggle }: Props) {
  return (
    <label className="d-flex align-items-center gap-2 py-1">
      <input
        type="checkbox"
        checked={item.on_hand}
        onChange={() => onToggle(item.id)}
      />
      <span
        className={
          item.on_hand ? "text-muted text-decoration-line-through" : ""
        }
      >
        {item.food.name}
        {item.amount ? ` — ${item.amount}` : ""}
      </span>
    </label>
  );
}
