import { useRef } from "react";
import { useMutation } from "@tanstack/react-query";

import { recipesPictureCreate } from "@/api/generated";

interface Props {
  recipeId: number;
  width?: number;
  height?: number;
}

export default function RecipeCardPicture({ recipeId, width, height }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPicture = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      return recipesPictureCreate({
        path: {
          id: recipeId,
        },
        body: formData as unknown as never,
      });
    },
  });

  function stopCardClick(event: React.MouseEvent) {
    event.stopPropagation();
  }

  function handleEditClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.stopPropagation();

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    uploadPicture.mutate(file);

    event.target.value = "";
  }

  const imageUrl = `/api/recipes/${recipeId}/picture/`;

  return (
    <div
      className="
        position-relative
        flex-shrink-0
        recipe-picture
      "
      onClick={stopCardClick}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      <img
        src={imageUrl}
        alt="Recipe"
        className="
          rounded
          w-100
          h-100
          object-fit-cover
        "
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />

      <div
        className="
          bg-light
          rounded
          d-flex
          align-items-center
          justify-content-center
          text-muted
          w-100
          h-100
        "
        style={{
          display: "none",
        }}
      >
        No image
      </div>

      <button
        type="button"
        className="
          btn
          btn-sm
          position-absolute
          top-0
          end-0
          m-2
          shadow-sm
          recipe-picture-edit
        "
        onClick={handleEditClick}
        title="Change picture"
      >
        <i className="bi bi-pencil" aria-hidden="true" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="d-none"
        onClick={stopCardClick}
        onChange={handleFileChange}
      />

      <style>
        {`
          .recipe-picture-edit {
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.15s ease-in-out;
          }

          .recipe-picture:hover .recipe-picture-edit {
            opacity: 1;
            pointer-events: auto;
          }
        `}
      </style>
    </div>
  );
}
