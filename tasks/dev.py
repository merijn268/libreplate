"""
Invoke tasks for project development workflows.

This module provides command-line tasks for maintaining the LibrePlate codebase,
including:

- Running code quality checks
- Automatically formatting source code
- Running the Django test suite
- Starting the development or production web server
"""

import filecmp
import shlex
import tempfile
from pathlib import Path

from invoke import Context, task

from . import deploy, docs
from .utils import (
    BASE_DIR,
    VENV_DIR,
    codebase_has_changes,
    django_run,
    info,
    npm_run,
    npx_run,
    print_error,
    print_success,
    venv_run,
)


def isort_cmd(check_only: bool = False) -> str:
    args = [
        "isort",
        str(BASE_DIR),
        "--skip",
        str(VENV_DIR),
        "--skip-glob",
        "*/migrations/*",
        "--settings-path",
        str(BASE_DIR / "pyproject.toml"),
    ]

    if check_only:
        args.insert(2, "--check-only")

    return " ".join(shlex.quote(arg) for arg in args)


def black_cmd() -> str:
    return f"black {BASE_DIR} --check --exclude '(/\\.venv/)'"


def ruff_check_cmd(fix: bool = False, exit_zero: bool = False) -> str:
    args = [
        "ruff",
        "check",
        str(BASE_DIR),
        "--exclude",
        str(VENV_DIR),
    ]

    if fix:
        args.append("--fix")

    if exit_zero:
        args.append("--exit-zero")

    return " ".join(args)


@task(aliases=["v"])
def verify(c: Context) -> None:
    """Run all code quality checks and tests."""

    check(c)
    test(c)
    docs.generate_manual(c, check=True)
    generate_api(c, check=True)


@task(aliases=["pc"])
def pre_commit(c) -> None:
    """
    Run pre-commit checks and generate applicable files.

    Also run all file generators so applicable generated code can be committed.
    """

    format(c)
    check(c)
    test(c)
    docs.generate_manual(c)
    generate_api(c)

    if c.config.cli.force.value or codebase_has_changes(BASE_DIR / "frontend"):
        deploy.build_front_end.body(c, check=True)


@task(aliases=["ds"])
def django_shell(c: Context):
    """
    Open the django shell.
    """
    django_run(c, "shell")


@task(aliases=["ud"])
def user_add_dummy(c: Context):
    """
    Create a dummy LibrePlate user account.

    Login:
        username = dummy
        password = dummy
    """
    username = "dummy"
    first_name = "Dummy"
    last_name = "User"
    email = "dummy@example.com"
    password = "dummy"

    info(f"Adding dummy user `{username}`")

    django_run(
        c,
        "add_user "
        f"{shlex.quote(username)} "
        f"{shlex.quote(first_name)} "
        f"{shlex.quote(last_name)} "
        f"{shlex.quote(email)} "
        f"{shlex.quote(password)} "
        "--skip-password-validation",
    )


@task(aliases=["c"])
def check(c: Context) -> None:
    """Run code quality checks."""

    verbose = c.config.cli.verbose.value
    force = c.config.cli.force.value

    if verbose:
        info("Checking code quality.")

    if force or codebase_has_changes(
        [
            BASE_DIR / "backend",
            BASE_DIR / "tasks",
        ]
    ):
        venv_run(c, isort_cmd(check_only=True), quiet_stdout=not verbose)
        venv_run(c, black_cmd(), quiet_stdout=not verbose)
        venv_run(c, ruff_check_cmd(fix=True), quiet_stdout=not verbose)
        print_success(message="Python Code checks passed")

    if force or codebase_has_changes(BASE_DIR / "frontend"):
        npx_run(
            c,
            "oxlint --deny-warnings . --ignore-pattern dist/assets/",
            quiet_stdout=not verbose,
        )
        npx_run(
            c,
            f"prettier --check . --ignore-path {BASE_DIR / 'frontend/.prettierignore'}",
            quiet_stdout=not verbose,
        )

        print_success(message="React Code checks passed")


# TODO IDE should automatically format!
@task(aliases=["f"])
def format(c: Context) -> None:
    """Automatically format the codebase."""

    verbose = c.config.cli.verbose.value
    force = c.config.cli.force.value

    if verbose:
        info("Checking formatters need to run")

    if force or codebase_has_changes(BASE_DIR / "frontend"):
        npx_run(
            c,
            f"prettier --write . --ignore-path {BASE_DIR / 'frontend/.prettierignore'}",
            quiet_stdout=not verbose,
        )
        print_success(message="React formatters passed")

    if force or codebase_has_changes([BASE_DIR / "backend", BASE_DIR / "tasks"]):
        venv_run(c, isort_cmd(), quiet_stdout=not verbose)
        venv_run(c, black_cmd().replace("--check", ""), quiet_stdout=not verbose)
        venv_run(
            c,
            f"ruff format {BASE_DIR} --exclude {VENV_DIR}",
            quiet_stdout=not verbose,
        )
        venv_run(
            c,
            ruff_check_cmd(fix=True, exit_zero=True),
            quiet_stdout=not verbose,
        )

        print_success(message="Python formatters passed")


@task(aliases=["t"])
def test(c: Context) -> None:
    """Run the LibrePlate automated test suite."""

    verbose = c.config.cli.verbose.value
    force = c.config.cli.force.value

    if force or codebase_has_changes(BASE_DIR / "backend"):
        with c.cd(BASE_DIR / "backend"):
            venv_run(c, "pytest", quiet_stdout=not verbose)
    else:
        if verbose:
            info("No changes in Django backend, not running tests.")
        return

    print_success(message="All tests passed")


@task(aliases=["sb"])
def serve_backend(c: Context) -> None:
    """
    Start the backend development server.
    """
    info("Running backend server")

    django_run(c, "runserver")


@task(aliases=["sf"])
@task
def serve_frontend(c: Context) -> None:
    """
    Start the frontend development server.
    """
    info("Running frontend server")

    npm_run(c, "run dev")


def api_changed(c: Context) -> bool:
    schema_path = BASE_DIR / "frontend" / "openapi.yaml"

    with tempfile.TemporaryDirectory() as tmp_dir:
        tmp_schema = Path(tmp_dir) / "openapi.yaml"

        with c.cd(BASE_DIR / "backend"):
            venv_run(
                c,
                f"python manage.py spectacular --file {tmp_schema}",
            )

        return not filecmp.cmp(
            tmp_schema,
            schema_path,
            shallow=False,
        )


@task(aliases=["ga"])
def generate_api(c: Context, check: bool = False) -> None:
    """
    Generate the frontend API client from the Django OpenAPI schema.

    Use --check to fail if generated files would change.
    """

    verbose = c.config.cli.verbose.value
    force = c.config.cli.force.value

    if not force and not codebase_has_changes(BASE_DIR / "backend"):
        if verbose:
            info("No changes in api generation.")
        return

    schema_path = BASE_DIR / "frontend" / "openapi.yaml"

    if check:
        if api_changed(c):
            print_error("API client is out of date. Run `invoke dev.generate-api`.")
            raise SystemExit(1)

        print_success("API client is up to date")
        return

    with c.cd(BASE_DIR / "backend"):
        venv_run(
            c,
            f"python manage.py spectacular --file {schema_path}",
            quiet_stdout=not verbose,
        )

    npm_run(c, "run api:generate", quiet_stdout=not verbose)
    print_success("Frontend API generated")
