type Props = {
  onClick: () => void;
};

export default function AddButton({ onClick }: Props) {
  return (
    <button
      type="button"
      className="border-0 bg-transparent p-0"
      onClick={onClick}
      aria-label="Add to meal"
    >
      <i
        className="bi bi-plus-lg text-primary"
        style={{ WebkitTextStroke: "0.7px currentColor" }}
      />
    </button>
  );
}
