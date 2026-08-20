import shlex

from invoke import Context, task

from .utils import django_run, info


@task
def create_cache_table(c: Context) -> None:
    """
    Create the Django database cache table.
    """
    info("Create Django cache table")
    django_run(c, "createcachetable django_cache")


@task(aliases=["m"])
def migrate(c: Context):
    """
    Apply Django database migrations.
    """
    info("Creating and applying migrations")
    django_run(c, "migrate")


@task(aliases=["sd"])
def sync_default_data(c: Context, overwrite=False):
    """
    Synchronize default application data.
    """
    info("Syncing default data")

    for command in [
        "sync_default_nutrients",
        "sync_default_units",
        "sync_default_body_metrics",
    ]:
        full_command = command
        if overwrite:
            full_command += " --overwrite"

        django_run(c, full_command)


@task(
    aliases=["ua"],
    help={
        "skip-password-validation": "Skip password validation.",
    },
)
def user_add(
    c: Context,
    username: str,
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    skip_password_validation: bool = False,
):
    """
    Create a new LibrePlate user account.
    """
    info(f"Adding new user `{username}`")

    command = (
        "add_user "
        f"{shlex.quote(username)} "
        f"{shlex.quote(first_name)} "
        f"{shlex.quote(last_name)} "
        f"{shlex.quote(email)} "
        f"{shlex.quote(password)}"
    )

    if skip_password_validation:
        command += " --skip-password-validation"

    django_run(c, command)


@task(aliases=["ur"])
def user_remove(c: Context, username: str):
    """
    Remove an existing LibrePlate user account.
    """
    info(f"Removing user `{username}`")
    django_run(c, f'remove_user "{username}"')


@task(aliases=["au"])
def add_usda_api_key(c: Context, key: str):
    """
    Configure the USDA API key.
    """
    info("Adding USDA API key")

    django_run(
        c,
        f"add_usda_api_key {key}",
    )
