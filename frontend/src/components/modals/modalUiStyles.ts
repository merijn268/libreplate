export const modalUiStyles = {
  buttons: {
    base: "btn btn-sm fw-medium rounded-pill px-3 py-2",
    danger: "btn btn-sm fw-medium rounded-pill px-3 py-2 text-danger",
    secondary: "btn btn-sm fw-medium rounded-pill px-3 py-2",
    primary:
      "btn btn-sm btn-primary text-white fw-medium rounded-pill px-4 py-2",
  },

  footer: {
    container: "d-flex justify-content-between align-items-center",
    actions: "d-flex justify-content-end gap-2",
  },

  form: {
    fields: "d-flex flex-column gap-3",
    field: "mt-2",
    labelRow: "d-flex align-items-center gap-2 mb-1",
    label: "form-label mb-0",
    error: "text-danger",
    errorMessage: "text-danger small",
  },

  list: {
    container: "list-group list-group-flush border rounded overflow-hidden",
    action: "list-group-item list-group-item-action px-3 py-2",
    actionContent: "d-flex align-items-center justify-content-between",
    actionLabel: "fw-medium",
    actionMeta: "text-muted small d-flex align-items-center gap-1",
    actionIcon: "text-primary",
  },
} as const;
