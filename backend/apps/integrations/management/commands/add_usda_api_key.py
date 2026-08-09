# add_usda_api_key.py

from apps.integrations.models import USDAAPISettings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Add a USDA API key."

    def add_arguments(self, parser):
        parser.add_argument("key", help="The USDA API key.")

    def handle(self, *args, **options):
        USDAAPISettings.objects.create(key=options["key"])
        self.stdout.write(self.style.SUCCESS("USDA API key added."))
