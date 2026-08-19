import io
import os
import subprocess
import zipfile

import requests
from github import Github
from invoke import Context, task

from .data import create_cache_table, migrate
from .utils import info


def latest_master_sha():
    """
    Get latest commit SHA from origin/master.
    """
    result = subprocess.run(
        ["git", "ls-remote", "origin", "refs/heads/master"],
        capture_output=True,
        text=True,
        check=True,
    )

    return result.stdout.split()[0]


def current_sha():
    """
    Get current checked out commit SHA.
    """
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        capture_output=True,
        text=True,
        check=True,
    )

    return result.stdout.strip()


def github_repo():
    """
    Get owner/repo from git origin.
    """
    remote = subprocess.run(
        ["git", "remote", "get-url", "origin"],
        capture_output=True,
        text=True,
        check=True,
    ).stdout.strip()

    remote = remote.removesuffix(".git")

    if remote.startswith("git@github.com:"):
        remote = remote.removeprefix("git@github.com:")
    elif remote.startswith("https://github.com/"):
        remote = remote.removeprefix("https://github.com/")
    else:
        raise RuntimeError(f"Unsupported GitHub remote: {remote}")

    return remote.split("/", 1)


def github_actions_status(owner: str, repo: str, sha: str):
    """
    Check GitHub Actions status for a commit.
    """
    token = os.environ.get("GITHUB_TOKEN")
    github = Github(token) if token else Github()

    repository = github.get_repo(f"{owner}/{repo}")
    checks = repository.get_commit(sha).get_check_runs()

    if checks.totalCount == 0:
        return "missing"

    for check in checks:
        if check.status != "completed":
            return "pending"

        if check.conclusion != "success":
            return check.conclusion

    return "success"


def download_frontend_dist(owner: str, repo: str):
    """
    Download the frontend build from the nightly release.
    """
    frontend_dist = os.getenv("FRONTEND_DIST")
    if not frontend_dist:
        raise RuntimeError("FRONTEND_DIST environment variable is not set")

    token = os.environ.get("GITHUB_TOKEN")

    headers = {
        "Accept": "application/vnd.github+json",
    }

    if token:
        headers["Authorization"] = f"Bearer {token}"

    response = requests.get(
        f"https://api.github.com/repos/{owner}/{repo}/releases/tags/nightly",
        headers=headers,
        timeout=120,
    )
    response.raise_for_status()

    release = response.json()

    asset = next(
        (asset for asset in release["assets"] if asset["name"] == "frontend-dist.zip"),
        None,
    )

    if asset is None:
        raise RuntimeError("frontend-dist.zip not found in nightly release")

    info("Downloading frontend build from nightly release")

    response = requests.get(
        asset["browser_download_url"],
        headers=headers if token else None,
        timeout=120,
    )
    response.raise_for_status()

    os.makedirs(frontend_dist, exist_ok=True)

    with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
        zf.extractall(frontend_dist)

    info(f"Front end build extracted at `{frontend_dist}`.")


@task(
    aliases=["u"],
    help={
        "force": "Force the update even if the current checkout is already up to date."
    },
)
def update(c: Context, force=False):
    """
    Update LibrePlate dependencies, source code, frontend assets, and database state.
    """
    info("Checking latest master build")

    sha = latest_master_sha()
    current = current_sha()

    if current == sha and not force:
        info(f"Already up to date at {sha[:7]}, skipping update")
        return

    owner, repo = github_repo()
    status = github_actions_status(owner, repo, sha)

    if status != "success":
        info(
            f"Latest master commit {sha[:7]} "
            f"is not verified ({status}), skipping update"
        )
        return

    info(f"Latest master commit {sha[:7]} passed CI")
    info("Updating LibrePlate")

    previous_sha = current

    try:
        c.run("git fetch origin")
        c.run("git checkout master")
        c.run("uv sync")
        migrate(c)
        create_cache_table(c)
        download_frontend_dist(owner, repo)

    except Exception:
        info(f"Update failed, rolling back to {previous_sha[:7]}")
        c.run(f"git reset --hard {previous_sha}")
        info(f"Rolled back to {previous_sha[:7]}")
        raise

    info("Update complete")