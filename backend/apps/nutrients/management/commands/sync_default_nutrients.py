from apps.nutrients.services import sync_default_nutrients
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Sync default nutrients"

    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            help="Update existing nutrients with default values",
        )

    def handle(self, *args, **options):
        overwrite = options["overwrite"]

        sync_default_nutrients(overwrite=overwrite)
