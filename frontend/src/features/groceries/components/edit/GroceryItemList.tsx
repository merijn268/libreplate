import GroceryItemRow from "./GroceryItemRow";

import type { GroceryListFood } from "@/api/generated/types.gen";

interface Props {
  items: GroceryListFood[];
  onToggle: (id: number) => void;
}

export default function GroceryItemList({ items, onToggle }: Props) {
  const sortedItems = [...items].sort(
    (a, b) => Number(a.on_hand) - Number(b.on_hand),
  );

  if (sortedItems.length === 0) {
    return <p className="text-muted">No items on this list yet.</p>;
  }

  return (
    <ul className="list-unstyled">
      {sortedItems.map((item) => (
        <li key={item.id}>
          <GroceryItemRow item={item} onToggle={onToggle} />
        </li>
      ))}
    </ul>
  );
}
