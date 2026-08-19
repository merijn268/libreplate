#!/usr/bin/env python3

import sys
from pathlib import Path

REQUIRED_VARIABLES = [
    "DEBUG",
    "SECRET_KEY",
    "ALLOWED_HOSTS",
    "DATABASE_URL",
    "FRONTEND_DIST",
    "MEDIA_ROOT",
    "CORS_ALLOWED_ORIGINS",
    "CSRF_TRUSTED_ORIGINS",
    "CORS_ALLOW_CREDENTIALS",
    "SESSION_COOKIE_SECURE",
    "CSRF_COOKIE_SECURE",
]


def load_env_file(path: Path) -> dict[str, str]:
    """Load a simple KEY=VALUE environment file."""
    if not path.exists():
        raise FileNotFoundError(f"Environment file not found: {path}")

    variables = {}

    for line_number, raw_line in enumerate(path.read_text().splitlines(), start=1):
        line = raw_line.strip()

        # Ignore blank lines and comments.
        if not line or line.startswith("#"):
            continue

        if "=" not in line:
            print(
                f"Warning: ignoring invalid line {line_number}: {raw_line}",
                file=sys.stderr,
            )
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()

        # Remove optional surrounding quotes.
        if len(value) >= 2 and value[0] == value[-1]:
            if value[0] in ('"', "'"):
                value = value[1:-1]

        variables[key] = value

    return variables


def verify_environment(env_file: str = ".env") -> bool:
    """Verify that all required environment variables are present and non-empty."""
    path = Path(env_file)

    try:
        variables = load_env_file(path)
    except FileNotFoundError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return False

    missing = [
        variable for variable in REQUIRED_VARIABLES if not variables.get(variable)
    ]

    if missing:
        print("Environment verification FAILED.")
        print()
        print("Missing or empty variables:")

        for variable in missing:
            print(f"  - {variable}")

        print()
        print(f"{len(missing)} required variable(s) are missing or empty.")

        return False

    print("Environment verification PASSED.")
    print(f"All {len(REQUIRED_VARIABLES)} required variables are set.")

    return True


def main() -> int:
    env_file = sys.argv[1] if len(sys.argv) > 1 else ".env"

    return 0 if verify_environment(env_file) else 1


if __name__ == "__main__":
    sys.exit(main())
