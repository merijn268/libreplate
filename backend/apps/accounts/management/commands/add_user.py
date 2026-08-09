from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create a user."

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("first_name")
        parser.add_argument("last_name")
        parser.add_argument("email")
        parser.add_argument("password")
        parser.add_argument(
            "--skip-password-validation",
            action="store_true",
            help="Skip Django password validation.",
        )

    def handle(self, *args, **options):
        User = get_user_model()

        if User.objects.filter(username=options["username"]).exists():
            self.stdout.write("User already exists")
            return

        if not options["skip_password_validation"]:
            try:
                validate_password(
                    options["password"],
                    user=User(
                        username=options["username"],
                        email=options["email"],
                    ),
                )
            except ValidationError as exc:
                self.stdout.write("Password validation failed:")
                for error in exc.messages:
                    self.stdout.write(f"- {error}")
                return

        User.objects.create_user(
            username=options["username"],
            email=options["email"],
            password=options["password"],
            first_name=options["first_name"],
            last_name=options["last_name"],
        )

        self.stdout.write(self.style.SUCCESS("User created"))
