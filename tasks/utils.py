"""
Invoke utility functions and configuration helpers for project automation tasks.
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path

from dotenv import load_dotenv
from invoke import Context
from invoke.exceptions import Failure
from rich.console import Console

# This file is located in base_dir/tasks/utils.py. So 'parent' needs to be
# called twice.
BASE_DIR = Path(__file__).parent.parent.resolve()
VENV_DIR = BASE_DIR / ".venv"

# TODO add helper to verify the environment file.
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


# TODO Breaks formatting and pythons breakline(). messy when fails.
def run_command(c: Context, command: str, quiet_stdout: bool = False) -> None:
    """
    Run a command, optionally suppressing normal output.
    """
    if quiet_stdout:
        result = c.run(command, hide=True, warn=True)

        # Only show stderr when the command failed.
        if result.exited != 0:
            sys.stderr.write(result.stderr or "")
            raise Failure(result)
    else:
        c.run(command)


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
