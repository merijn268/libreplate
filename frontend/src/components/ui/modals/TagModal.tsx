import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Modal } from "bootstrap";

interface Tag {
  id: number;
  name: string;
}

interface Props<T extends Tag> {
  open: boolean;
  onClose: () => void;

  tags: T[];

  selectedTags: number[];
  onTagsChange: (tags: number[]) => void;

  createTag: (name: string) => Promise<unknown>;
  deleteTag: (id: number) => Promise<unknown>;

  onChanged?: () => void;
}

export default function TagModal<T extends Tag>({
  open,
  onClose,
  tags,
  selectedTags,
  onTagsChange,
  createTag,
  deleteTag,
  onChanged,
}: Props<T>) {
  const [newTag, setNewTag] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);

  const createMutation = useMutation({
    mutationFn: (name: string) => createTag(name),

    onSuccess: () => {
      setNewTag("");
      onChanged?.();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteTag(id),

    onSuccess: () => {
      onChanged?.();
    },
  });

  useEffect(() => {
    const element = modalRef.current;

    if (!element) {
      return;
    }

    const modal = Modal.getOrCreateInstance(element);

    const handleHidden = () => {
      onClose();
    };

    element.addEventListener("hidden.bs.modal", handleHidden);

    if (open) {
      modal.show();
    } else {
      modal.hide();
    }

    return () => {
      element.removeEventListener("hidden.bs.modal", handleHidden);

      modal.dispose();
    };
  }, [open, onClose]);

  function handleCreate() {
    const name = newTag.trim();

    if (!name) {
      return;
    }

    createMutation.mutate(name);
  }

  function toggleTag(id: number) {
    if (selectedTags.includes(id)) {
      onTagsChange(selectedTags.filter((tagId) => tagId !== id));
      return;
    }

    onTagsChange([...selectedTags, id]);
  }

  return (
    <div
      ref={modalRef}
      className="modal fade"
      tabIndex={-1}
      aria-labelledby="tagModalLabel"
      aria-hidden="true"
      data-bs-backdrop="true"
      data-bs-keyboard="true"
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="tagModalLabel">
              Tags
            </h5>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              data-bs-dismiss="modal"
            />
          </div>

          <div className="modal-body">
            <div className="input-group mb-3">
              <input
                className="form-control"
                value={newTag}
                onChange={(event) => setNewTag(event.target.value)}
                placeholder="New tag"
              />

              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                Add
              </button>
            </div>

            <div className="list-group">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="
                    list-group-item
                    d-flex
                    justify-content-between
                    align-items-center
                  "
                >
                  <button
                    type="button"
                    className={`
                      btn
                      p-0
                      border-0
                      bg-transparent
                      text-start
                      ${
                        selectedTags.includes(tag.id)
                          ? "text-primary"
                          : "text-body"
                      }
                    `}
                    style={{
                      textDecoration: selectedTags.includes(tag.id)
                        ? "underline"
                        : "none",
                      textDecorationThickness: selectedTags.includes(tag.id)
                        ? "2px"
                        : undefined,
                      textUnderlineOffset: "4px",
                    }}
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>

                  <button
                    type="button"
                    className="
                      btn
                      btn-outline-danger
                      btn-sm
                      ms-2
                    "
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(tag.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
