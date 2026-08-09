from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Remove a user by username."

    def add_arguments(self, parser):
        parser.add_argument("username")

    def handle(self, *args, **options):
        User = get_user_model()

        try:
            user = User.objects.get(username=options["username"])
        except User.DoesNotExist:
            self.stdout.write("User does not exist")
            return

        user.delete()
        self.stdout.write(self.style.SUCCESS("User removed"))
