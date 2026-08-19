

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


## Table of contents

- [`data.create-cache-table`](#data-create-cache-table)
- [`data.migrate`](#data-migrate)
- [`data.sync-default-data`](#data-sync-default-data)
- [`dev.check`](#dev-check)
- [`dev.django-shell`](#dev-django-shell)
- [`dev.format`](#dev-format)
- [`dev.generate-api`](#dev-generate-api)
- [`dev.generate-invoke-manual`](#dev-generate-invoke-manual)
- [`dev.pre-commit`](#dev-pre-commit)
- [`dev.serve-backend`](#dev-serve-backend)
- [`dev.serve-frontend`](#dev-serve-frontend)
- [`dev.test`](#dev-test)
- [`dev.user-add-dummy`](#dev-user-add-dummy)
- [`dev.verify`](#dev-verify)
- [`docs.generate-invoke-manual`](#docs-generate-invoke-manual)
- [`manage.create-cache-table`](#manage-create-cache-table)
- [`manage.migrate`](#manage-migrate)
- [`manage.update`](#manage-update)
- [`setup.add-usda-api-key`](#setup-add-usda-api-key)
- [`setup.build-front-end`](#setup-build-front-end)
- [`setup.init`](#setup-init)
- [`setup.migrate`](#setup-migrate)
- [`setup.sync-default-data`](#setup-sync-default-data)
- [`setup.user-add`](#setup-user-add)
- [`setup.user-remove`](#setup-user-remove)

<a id="data-create-cache-table"></a>

## `data.create-cache-table`

```text
Usage: inv[oke] [--core-opts] data.create-cache-table [other tasks here ...]

Docstring:
  Create the Django database cache table.
```
<a id="data-migrate"></a>

## `data.migrate`

**Aliases:** `data.m`

```text
Usage: inv[oke] [--core-opts] data.migrate [other tasks here ...]

Docstring:
  Create and apply Django migrations.
```
<a id="data-sync-default-data"></a>

## `data.sync-default-data`

**Aliases:** `data.sd`

```text
Usage: inv[oke] [--core-opts] data.sync-default-data [--options] [other tasks here ...]

Docstring:
  Synchronize default application data.

Options:
  -o, --overwrite
```
<a id="dev-check"></a>

## `dev.check`

**Aliases:** `dev.c`

```text
Usage: inv[oke] [--core-opts] dev.check [--options] [other tasks here ...]

Docstring:
  Run code quality checks.

Options:
  -f, --force     Run checks even if there are no codebase changes.
  -v, --verbose   Show stdout output from commands.
```
<a id="dev-django-shell"></a>

## `dev.django-shell`

**Aliases:** `dev.ds`

```text
Usage: inv[oke] [--core-opts] dev.django-shell [other tasks here ...]

Docstring:
  Open the django shell.
```
<a id="dev-format"></a>

## `dev.format`

**Aliases:** `dev.f`

```text
Usage: inv[oke] [--core-opts] dev.format [--options] [other tasks here ...]

Docstring:
  Automatically format the codebase.

Options:
  -f, --force     Run formatter even if there are no codebase changes.
  -v, --verbose   Show stdout output from commands.
```
<a id="dev-generate-api"></a>

## `dev.generate-api`

**Aliases:** `dev.ga`

```text
Usage: inv[oke] [--core-opts] dev.generate-api [--options] [other tasks here ...]

Docstring:
  Generate the frontend API client from the Django OpenAPI schema.

  Use --check to fail if generated files would change.

Options:
  -c, --check
  -f, --force
  -v, --verbose
```
<a id="dev-generate-invoke-manual"></a>

## `dev.generate-invoke-manual`

**Aliases:** `dev.gi`

```text
Usage: inv[oke] [--core-opts] dev.generate-invoke-manual [--options] [other tasks here ...]

Docstring:
  Generate a Markdown manual of all Invoke tasks.

Options:
  -c, --check     Only check whether the generated manual differs from the
                  existing file.
  -f, --force     Force generation, even when there are no changes.
  -v, --verbose
```
<a id="dev-pre-commit"></a>

## `dev.pre-commit`

**Aliases:** `dev.pc`

```text
Usage: inv[oke] [--core-opts] dev.pre-commit [--options] [other tasks here ...]

Docstring:
  Command to run pre commit to make sure it passes the pipeline.

  Also run all file generators so applicable generated code can be commited.

Options:
  -f, --force     Run formatters, checks, and tests even if there are no
                  codebase changes.
  -v, --verbose   Show stdout output from commands.
```
<a id="dev-serve-backend"></a>

## `dev.serve-backend`

**Aliases:** `dev.sb`

```text
Usage: inv[oke] [--core-opts] dev.serve-backend [other tasks here ...]

Docstring:
  Start the backend development server.
```
<a id="dev-serve-frontend"></a>

## `dev.serve-frontend`

**Aliases:** `dev.sf`

```text
Usage: inv[oke] [--core-opts] dev.serve-frontend [other tasks here ...]

Docstring:
  Start the frontend development server.
```
<a id="dev-test"></a>

## `dev.test`

**Aliases:** `dev.t`

```text
Usage: inv[oke] [--core-opts] dev.test [--options] [other tasks here ...]

Docstring:
  Run the LibrePlate automated test suite

Options:
  -f, --force     Run tests even if there are no codebase changes.
  -v, --verbose   Show stdout output from commands.
```
<a id="dev-user-add-dummy"></a>

## `dev.user-add-dummy`

**Aliases:** `dev.ud`

```text
Usage: inv[oke] [--core-opts] dev.user-add-dummy [other tasks here ...]

Docstring:
  Create a dummy LibrePlate user account.
```
<a id="dev-verify"></a>

## `dev.verify`

**Aliases:** `dev.v`

```text
Usage: inv[oke] [--core-opts] dev.verify [--options] [other tasks here ...]

Docstring:
  Run all code quality checks and tests

Options:
  -f, --force     Force all checks to run.
  -v, --verbose   Show stdout output from commands.
```
<a id="docs-generate-invoke-manual"></a>

## `docs.generate-invoke-manual`

**Aliases:** `docs.gi`

```text
Usage: inv[oke] [--core-opts] docs.generate-invoke-manual [--options] [other tasks here ...]

Docstring:
  Generate a Markdown manual of all Invoke tasks.

Options:
  -c, --check     Only check whether the generated manual differs from the
                  existing file.
  -f, --force     Force generation, even when there are no changes.
  -v, --verbose
```
<a id="manage-create-cache-table"></a>

## `manage.create-cache-table`

```text
Usage: inv[oke] [--core-opts] manage.create-cache-table [other tasks here ...]

Docstring:
  Create the Django database cache table.
```
<a id="manage-migrate"></a>

## `manage.migrate`

**Aliases:** `manage.m`

```text
Usage: inv[oke] [--core-opts] manage.migrate [other tasks here ...]

Docstring:
  Create and apply Django migrations.
```
<a id="manage-update"></a>

## `manage.update`

**Aliases:** `manage.u`

```text
Usage: inv[oke] [--core-opts] manage.update [--options] [other tasks here ...]

Docstring:
  Update LibrePlate dependencies, source code, frontend assets, and database state.

Options:
  -f, --force   Force the update even if the current checkout is already up to
                date.
```
<a id="setup-add-usda-api-key"></a>

## `setup.add-usda-api-key`

**Aliases:** `setup.au`

```text
Usage: inv[oke] [--core-opts] setup.add-usda-api-key [--options] [other tasks here ...]

Docstring:
  Configure the USDA API key.

Options:
  -k STRING, --key=STRING
```
<a id="setup-build-front-end"></a>

## `setup.build-front-end`

**Aliases:** `setup.bf`

```text
Usage: inv[oke] [--core-opts] setup.build-front-end [--options] [other tasks here ...]

Docstring:
  Build the React front end.

Options:
  -c, --check     Only build, do not copy frontend assets.
  -v, --verbose   Show stdout output from commands.
```
<a id="setup-init"></a>

## `setup.init`

**Aliases:** `setup.i`

```text
Usage: inv[oke] [--core-opts] setup.init [other tasks here ...]

Docstring:
  Initialize LibrePlate.
```
<a id="setup-migrate"></a>

## `setup.migrate`

**Aliases:** `setup.m`

```text
Usage: inv[oke] [--core-opts] setup.migrate [other tasks here ...]

Docstring:
  Create and apply Django migrations.
```
<a id="setup-sync-default-data"></a>

## `setup.sync-default-data`

**Aliases:** `setup.sd`

```text
Usage: inv[oke] [--core-opts] setup.sync-default-data [--options] [other tasks here ...]

Docstring:
  Synchronize default application data.

Options:
  -o, --overwrite
```
<a id="setup-user-add"></a>

## `setup.user-add`

**Aliases:** `setup.ua`

```text
Usage: inv[oke] [--core-opts] setup.user-add [--options] [other tasks here ...]

Docstring:
  Create a new LibrePlate user account.

Options:
  -e STRING, --email=STRING
  -f STRING, --first-name=STRING
  -l STRING, --last-name=STRING
  -p STRING, --password=STRING
  -s, --skip-password-validation   Skip password validation.
  -u STRING, --username=STRING
```
<a id="setup-user-remove"></a>

## `setup.user-remove`

**Aliases:** `setup.ur`

```text
Usage: inv[oke] [--core-opts] setup.user-remove [--options] [other tasks here ...]

Docstring:
  Remove an existing LibrePlate user account.

Options:
  -u STRING, --username=STRING
```