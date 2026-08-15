import { useEffect, useRef, useState } from "react";

export interface SortOption<TSort extends string> {
  value: TSort;
  label: string;
}

export interface SearchScope {
  count: number;
  label: string;
}

interface Props<TSort extends string, TagType = unknown> {
  search: string;
  onSearchChange: (value: string) => void;
  scope: SearchScope;

  showFavorites: boolean;
  onToggleFavorites: () => void;

  sortMethod: TSort;
  onSortChange: (value: TSort) => void;
  sortOptions: SortOption<TSort>[];

  tags?: TagType[];
  selectedTags?: number[];
  onTagsChange?: (tags: number[]) => void;

  onManageTags?: () => void;
}

export default function SearchBar<TSort extends string, TagType = unknown>({
  search,
  onSearchChange,
  scope,
  showFavorites,
  onToggleFavorites,
  sortMethod,
  onSortChange,
  sortOptions,
  selectedTags = [],
  onManageTags,
}: Props<TSort, TagType>) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const placeholder =
    scope.count <= 1
      ? "Not much to search through..."
      : `Searching ${scope.count} ${scope.label}`;

  return (
    <div className="row">
      <div className="col">
        <div className="input-group">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="form-control app-surface"
          />

          <button
            className={`btn border ${
              showFavorites
                ? "btn-primary border-primary"
                : "btn-outline-primary border-primary"
            }`}
            onClick={onToggleFavorites}
            title="Show favorites"
          >
            <i className={showFavorites ? "bi bi-heart-fill" : "bi bi-heart"} />
          </button>

          {onManageTags && (
            <button
              className={`btn border ${
                selectedTags.length > 0
                  ? "btn-primary border-primary"
                  : "btn-outline-primary border-primary"
              }`}
              onClick={onManageTags}
              title="Manage tags"
            >
              <i
                className={`bi ${
                  selectedTags.length > 0 ? "bi-tags-fill" : "bi-tags"
                }`}
              />
            </button>
          )}

          <div className="dropdown" ref={sortRef}>
            <button
              type="button"
              className="btn btn-outline-primary border-primary rounded-0 rounded-end"
              aria-expanded={sortOpen}
              title="Sort"
              onClick={() => setSortOpen((open) => !open)}
            >
              <i className="bi bi-filter" />
            </button>

            <ul
              className={`dropdown-menu${sortOpen ? " show" : ""}`}
              style={{ right: 0, left: "auto" }}
            >
              {sortOptions.map((option) => (
                <li key={option.value}>
                  <button
                    className={`dropdown-item ${
                      sortMethod === option.value ? "active" : ""
                    }`}
                    type="button"
                    onClick={() => {
                      onSortChange(option.value);
                      setSortOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
