from apps.units.services import sync_default_units
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            default=False,
            help="Overwrite existing default units.",
        )

    def handle(self, *args, **options):
        sync_default_units(overwrite=options["overwrite"])
