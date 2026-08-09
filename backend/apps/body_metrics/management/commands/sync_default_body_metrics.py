from apps.body_metrics.services import sync_default_body_metrics
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "--overwrite",
            action="store_true",
            default=False,
            help="Overwrite existing default body metrics.",
        )

    def handle(self, *args, **options):
        sync_default_body_metrics(overwrite=options["overwrite"])
