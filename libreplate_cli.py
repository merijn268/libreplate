#!/usr/bin/env python3

"""
LibrePlate command-line interface.

LibrePlate uses Invoke to define and run its command-line tasks. This wrapper
extends Invoke's CLI with a small set of LibrePlate-wide options.

The main purpose of this wrapper is to allow options that apply to an entire
task invocation to be configured once, without adding those options to every
individual task.

This wrapper also changes Invoke's short ``-f`` option. Invoke normally uses
``-f`` as the short form of ``--config``. LibrePlate reserves ``-f`` for
``--force`` instead, and uses ``-c`` as the short form of ``--config``:

    libreplate -f deploy.update
    libreplate --force deploy.update

    libreplate -c config.yaml deploy.update
    libreplate --config config.yaml deploy.update

Apart from these LibrePlate-specific additions, Invoke remains responsible
for the CLI: task discovery, task-specific options, configuration loading,
help, task listing, and task execution.
"""

from invoke import Argument, Program

from tasks import ns


class LibrePlateProgram(Program):
    """Invoke's CLI extended with LibrePlate's options."""

    def core_args(self):
        """
        Extend Invoke's global CLI options with LibrePlate options.

        Invoke normally defines ``-f`` as an alias for ``--config``. LibrePlate
        uses ``-f`` for ``--force``, so the inherited config argument is
        replaced with an equivalent argument using ``-c`` instead.
        """
        args = super().core_args()

        # Invoke normally exposes:
        #
        #     -f, --config=STRING
        #
        # LibrePlate reserves -f for --force, so replace Invoke's config
        # argument with -c/--config.
        args = [arg for arg in args if "config" not in arg.names]

        args.append(
            Argument(
                names=("config", "c"),
                kind=str,
                help="Runtime configuration file to use.",
            )
        )

        # LibrePlate-wide options. These are parsed as Invoke core options
        # and then stored in Invoke's configuration for the current run.
        args.append(
            Argument(
                names=("force", "f"),
                kind=bool,
                default=False,
                help="Force the operation.",
            )
        )

        args.append(
            Argument(
                names=("verbose", "v"),
                kind=bool,
                default=False,
                help="Enable verbose output.",
            )
        )

        return args

    def update_config(self, merge=True):
        """
        Store LibrePlate CLI options in Invoke's configuration.

        The task collection provides the default values for these settings.
        The command-line values override those defaults for the current
        invocation.

        The values are stored in Invoke's ``cli`` configuration namespace,
        making them available to every task through its Context:

            c.config.cli.verbose
            c.config.cli.force
        """
        super().update_config(merge=merge)

        # The collection configuration may not have been merged into the
        # Program's config yet, so ensure the namespace exists before applying
        # the command-line overrides.
        self.config.setdefault("cli", {})

        self.config["cli"]["verbose"] = self.args.verbose
        self.config["cli"]["force"] = self.args.force


if __name__ == "__main__":
    LibrePlateProgram(
        namespace=ns,
        binary="libreplate_cli.py",
    ).run()
