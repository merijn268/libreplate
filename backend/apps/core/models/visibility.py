from django.db import models


class DiaryDayTotalVisibility(models.Model):
    show_in_diary_day_total = models.BooleanField(default=True)

    class Meta:
        abstract = True


class DiaryMealTotalVisibility(models.Model):
    show_in_diary_meal_total = models.BooleanField(default=True)

    class Meta:
        abstract = True


class GoalEditVisibility(models.Model):
    show_in_goal_edit = models.BooleanField(default=True)

    class Meta:
        abstract = True


class DiaryVisibility(models.Model):
    show_in_diary = models.BooleanField(default=True)

    class Meta:
        abstract = True


class DailyLogVisibility(models.Model):
    show_in_daily_log = models.BooleanField(default=True)

    class Meta:
        abstract = True
