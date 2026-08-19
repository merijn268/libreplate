type Props = {
  onClick: () => void;
};

export default function SmallPlusButton({ onClick }: Props) {
  return (
    <button
      type="button"
      className="btn btn-outline-primary rounded-circle d-flex align-items-center justify-content-center p-0"
      style={{
        width: "30px",
        height: "30px",
      }}
      onClick={onClick}
      aria-label="Add to meal"
    >
      <i
        className="bi bi-plus-lg"
        style={{
          fontSize: "16px",
          WebkitTextStroke: "0.5px currentColor",
        }}
      />
    </button>
  );
}
