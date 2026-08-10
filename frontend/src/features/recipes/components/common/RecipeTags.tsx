import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { Recipe, RecipeTag } from "@/api/generated/types.gen";
import { recipesPartialUpdate, recipesTagsList } from "@/api/generated";

interface Props {
  recipe: Recipe;
}

export default function RecipeCardTags({ recipe }: Props) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["recipe-tags"],
    queryFn: () => recipesTagsList(),
  });

  const tags: RecipeTag[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  const tagIds = recipe.tags.map((tag) => tag.id);

  const update = useMutation({
    mutationFn: (tag_ids: number[]) =>
      recipesPartialUpdate({
        path: { id: recipe.id },
        body: { tag_ids },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recipe", recipe.id],
      });

      queryClient.invalidateQueries({
        queryKey: ["recipes"],
      });

      queryClient.invalidateQueries({
        queryKey: ["recipe-tags"],
      });
    },
  });

  const unusedTags = tags.filter((tag: RecipeTag) => !tagIds.includes(tag.id));

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const setTags = (ids: number[]) => {
    update.mutate(ids);
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-1" onClick={stop}>
      {recipe.tags.map((tag) => (
        <span
          key={tag.id}
          className="badge text-bg-primary d-flex align-items-center gap-1"
        >
          {tag.name}

          <button
            type="button"
            className="btn btn-sm p-0 text-body border-0 lh-1"
            title="Remove tag"
            onClick={(e) => {
              stop(e);
              setTags(tagIds.filter((id) => id !== tag.id));
            }}
          >
            <i className="bi bi-x" />
          </button>
        </span>
      ))}

      {unusedTags.length > 0 && (
        <div className="dropdown">
          <button
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-center p-0"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
            title="Add tag"
            onClick={stop}
          >
            <i className="bi bi-plus" />
          </button>

          <ul className="dropdown-menu">
            {unusedTags.map((tag: RecipeTag) => (
              <li key={tag.id}>
                <button
                  className="dropdown-item"
                  type="button"
                  onClick={(e) => {
                    stop(e);
                    setTags([...tagIds, tag.id]);
                  }}
                >
                  {tag.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
