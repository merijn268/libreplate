import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("goals", "0002_goalgroup_created_at_goalgroup_is_favorite_and_more"),
    ]

    operations = [
        migrations.RenameModel(
            old_name="GoalGroup",
            new_name="GoalPlan",
        ),
        migrations.RenameField(
            model_name="goalnutrient",
            old_name="goal_group",
            new_name="goal_plan",
        ),
        migrations.AddField(
            model_name="goalbodymetric",
            name="goal_plan",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="body_metric_goals",
                to="goals.goalplan",
            ),
        ),
        migrations.AddConstraint(
            model_name="goalnutrient",
            constraint=models.UniqueConstraint(
                fields=("goal_plan", "nutrient"),
                name="unique_nutrient_per_goal_plan",
            ),
        ),
        migrations.AddConstraint(
            model_name="goalbodymetric",
            constraint=models.UniqueConstraint(
                fields=("goal_plan", "body_metric"),
                name="unique_body_metric_per_goal_plan",
            ),
        ),
        migrations.AlterField(
            model_name="goalbodymetric",
            name="goal_plan",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="body_metric_goals",
                to="goals.goalplan",
            ),
        ),
    ]
