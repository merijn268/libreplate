import re
from pathlib import Path

from invoke import Context, task
from invoke.exceptions import Exit
from utils import BASE_DIR, print_success

# TODO this code should probably be moved to a sepparate package!

TASK_PATTERN = re.compile(
    r"""
^\s{2}
(?P<name>[a-zA-Z_][\w\.-]*)
(?:\s+\((?P<aliases>[^)]*)\))?
\s{2,}
""",
    re.VERBOSE,
)

MANUAL_HEADER = """

# Invoke tasks documentation

To use invoke you will have to create a virtual environment first, and use its
python shell. Install [Python UV](https://docs.astral.sh/uv/getting-started/installation/) and run.

```sh
cd backend && uv sync
source ./venv/bin/activate
cd ../
```

To run a task you can use:

```sh
invoke <task> <flags>
```

To learn more about a task:

```sh
invoke --help <task>
```

If you are new to Invoke you can also run:

```sh
invoke --help
```

"""


@task(aliases=["gi"])
def generate_invoke_manual(c: Context, check: bool = False) -> None:
    """
    Generate a Markdown manual of all Invoke tasks.

    Args:
        check: Only check whether the generated manual differs from the existing file.
    """

    output = Path(BASE_DIR / "tasks_manual.md")
    result = c.run("invoke --list", hide=True)

    tasks = []

    for line in result.stdout.splitlines():
        match = TASK_PATTERN.match(line)
        if not match:
            continue

        aliases = []
        if match.group("aliases"):
            aliases = [alias.strip() for alias in match.group("aliases").split(",")]

        tasks.append(
            {
                "name": match.group("name"),
                "aliases": aliases,
            }
        )

    markdown = [MANUAL_HEADER]

    markdown.append("## Table of contents\n")

    for task_data in tasks:
        name = task_data["name"]
        anchor = name.lower().replace(".", "-")
        markdown.append(f"- [`{name}`](#{anchor})")

    markdown.append("")

    for task_data in tasks:
        name = task_data["name"]
        aliases = task_data["aliases"]
        anchor = name.lower().replace(".", "-")

        help_text = c.run(
            f"invoke --help {name}",
            hide=True,
            warn=True,
        ).stdout.strip()

        # Remove the Options section when Invoke reports that there are no options.
        help_text = re.sub(
            r"\n\nOptions:\n\s*none\s*$",
            "",
            help_text,
        )

        markdown.append(f'<a id="{anchor}"></a>')
        markdown.append(f"\n## `{name}`\n")

        if aliases:
            markdown.append(f"**Aliases:** {', '.join(f'`{a}`' for a in aliases)}\n")

        markdown.extend(
            [
                "```text",
                help_text,
                "```",
            ]
        )

    generated = "\n".join(markdown)

    if check:
        if not output.exists():
            raise Exit(
                f"`{output}` does not exist. Run `invoke dev.generate-invoke-manual`.",
                code=1,
            )

        existing = output.read_text(encoding="utf-8")

        if existing != generated:
            raise Exit(
                f"`{output}` is out of date. Run `invoke dev.generate-invoke-manual`.",
                code=1,
            )

        print_success("Invoke manual is up to date.")
        return

    output.write_text(generated, encoding="utf-8")
    print_success(f"Generated `{output}`")
