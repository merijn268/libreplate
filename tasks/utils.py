"""
Invoke utility functions and configuration helpers for project automation tasks.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from enum import IntEnum
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from dotenv import load_dotenv
from invoke import Context
from invoke.exceptions import Failure
from rich.console import Console


class GitDiffExitCode(IntEnum):
    NO_CHANGES = 0
    CHANGES_FOUND = 1


BASE_DIR = Path(__file__).parent.parent.resolve()
VENV_DIR = BASE_DIR / ".venv"

spec = spec_from_file_location(
    name="verify_env", location=BASE_DIR / "tools" / "verify_env.py"
)
verify_env = module_from_spec(spec=spec)
spec.loader.exec_module(module=verify_env)
load_dotenv(BASE_DIR / ".env")

IS_DEBUG = os.getenv("DEBUG", "false").lower() == "true"

console = Console()


def info(message: str) -> None:
    """
    Pretty print an informational message.
    """
    console.print(f"[bold]INFO[/bold] {message}")


def print_success(message: str) -> None:
    """
    Pretty print a success message.
    """
    console.print(f"[bold green]SUCCESS[/bold green] {message}")


def print_error(message: str) -> None:
    """
    Pretty print an error message.
    """
    console.print(f"[bold red]ERROR[/bold red] {message}")


def run_command(c: Context, command: str, quiet_stdout: bool = False) -> None:
    """
    Run a command, optionally suppressing normal output.
    """
    result = c.run(
        command,
        hide=True if quiet_stdout else None,
        warn=True,
        pty=not quiet_stdout,
        in_stream=False,
    )
    if result.exited != 0:
        if quiet_stdout:
            stderr = result.stderr or ""
            if stderr and not stderr.endswith("\n"):
                stderr += "\n"
            sys.stderr.write(stderr)
        sys.stderr.write(f"\n[failed] {command}\n")
        raise Failure(result)


def venv_run(c: Context, command: str, quiet_stdout: bool = False) -> None:
    """
    Run a command from the project virtual environment.
    """
    executable, *args = command.split(" ")
    executable_path = VENV_DIR / "bin" / executable

    if executable_path.exists():
        command = f'"{executable_path}" {" ".join(args)}'

    run_command(c, command, quiet_stdout)


def django_run(c: Context, command: str, quiet_stdout: bool = False) -> None:
    """
    Run a Django command.
    """
    with c.cd(BASE_DIR / "backend"):
        venv_run(c, f"python manage.py {command}", quiet_stdout)


def npx_run(c: Context, command: str, quiet_stdout: bool = False) -> None:
    """
    Run a Node command with npx.
    """
    with c.cd(BASE_DIR / "frontend"):
        run_command(c, f"npx {command}", quiet_stdout)


def npm_run(c: Context, command: str, quiet_stdout: bool = False) -> None:
    """
    Run a Node command with npm.
    """
    with c.cd(BASE_DIR / "frontend"):
        run_command(c, f"npm {command}", quiet_stdout)


def copy_frontend_dist() -> None:
    """
    Copy the generated frontend dist files to FRONTEND_DIST.
    """
    frontend_dist = os.getenv("FRONTEND_DIST")

    if not frontend_dist:
        raise RuntimeError("FRONTEND_DIST is not configured")

    source = BASE_DIR / "frontend" / "dist"
    destination = Path(frontend_dist).resolve()

    if source.resolve() == destination:
        print_success(f"Frontend already available at {destination}")
        return

    if not source.exists():
        raise RuntimeError(f"Frontend build directory does not exist: {source}")

    destination.mkdir(parents=True, exist_ok=True)

    for item in destination.iterdir():
        if item.is_dir():
            shutil.rmtree(item)
        else:
            item.unlink()

    for item in source.iterdir():
        target = destination / item.name

        if item.is_dir():
            shutil.copytree(item, target)
        else:
            shutil.copy2(item, target)

    print_success(f"Frontend copied to {destination}")


def codebase_has_changes(paths: Path | list[Path]) -> bool:
    """
    Return True if any of `paths` changed in the latest commit range or
    in the current working tree.

    Includes:
    - changes from the previous commit to HEAD
    - staged changes
    - unstaged changes
    - untracked files

    Works with shallow Git checkouts such as GitHub Actions.
    """
    if isinstance(paths, Path):
        paths = [paths]

    for path in paths:
        if not path.exists():
            raise FileNotFoundError(f"Path does not exist: {path}")

    def run_git(*args: str) -> subprocess.CompletedProcess[bytes]:
        try:
            return subprocess.run(
                ["git", *args],
                cwd=Path.cwd(),
                capture_output=True,
            )
        except FileNotFoundError as exc:
            raise RuntimeError(
                "Git is not installed or could not be found on PATH."
            ) from exc

    def commit_exists(rev: str) -> bool:
        result = run_git("cat-file", "-e", f"{rev}^{{commit}}")
        return result.returncode == 0

    # First check the current working tree against HEAD.
    # This includes staged and unstaged changes to tracked files.
    result = run_git("diff", "--quiet", "HEAD", "--", *paths)

    match result.returncode:
        case GitDiffExitCode.CHANGES_FOUND:
            return True
        case GitDiffExitCode.NO_CHANGES:
            pass
        case _:
            raise RuntimeError(f"Git diff failed: {result.stderr.decode().strip()}")

    # Untracked files are not included by git diff.
    result = run_git(
        "ls-files",
        "--others",
        "--exclude-standard",
        "--",
        *paths,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Git ls-files failed: {result.stderr.decode().strip()}")

    if result.stdout.strip():
        return True

    # Determine the commit to diff against.
    #
    # GitHub Actions exposes the commit before the push in GITHUB_EVENT_BEFORE.
    # This is only set for push events, and even then the commit object may
    # not exist locally on a shallow checkout, so we verify (and try to
    # fetch) before trusting it. Otherwise fall back to HEAD~1.
    before = os.environ.get("GITHUB_EVENT_BEFORE")
    base_rev: str | None = None

    if before and before != "0" * 40:
        if not commit_exists(before):
            run_git("fetch", "--depth=1", "origin", before)
        if commit_exists(before):
            base_rev = before

    if base_rev is None and commit_exists("HEAD~1"):
        base_rev = "HEAD~1"

    if base_rev is None:
        # No usable previous commit exists locally (e.g. the repo's first
        # commit, or a shallow checkout where the prior commit couldn't be
        # fetched). The working-tree and untracked checks above are all
        # that can be determined in that case.
        return False

    result = run_git("diff", "--quiet", base_rev, "HEAD", "--", *paths)

    match result.returncode:
        case GitDiffExitCode.CHANGES_FOUND:
            return True
        case GitDiffExitCode.NO_CHANGES:
            return False
        case _:
            raise RuntimeError(f"Git diff failed: {result.stderr.decode().strip()}")
