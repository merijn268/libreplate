# integrations/models.py

from django.db import models


class USDAAPISettings(models.Model):
    key = models.CharField(max_length=64, unique=True, primary_key=True)
