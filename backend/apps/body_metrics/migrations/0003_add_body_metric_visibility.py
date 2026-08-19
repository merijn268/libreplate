from django.db import migrations, models
import django.db.models.deletion


def create_body_metric_visibility(apps, schema_editor):
    BodyMetric = apps.get_model("body_metrics", "BodyMetric")
    BodyMetricsVisibility = apps.get_model(
        "body_metrics",
        "BodyMetricsVisibility",
    )

    visibility_defaults = {
        "Height": {
            "show_in_diary": False,
            "show_in_goal_edit": False,
        },
        "Weight": {
            "show_in_diary": True,
            "show_in_goal_edit": True,
        },
        "Age": {
            "show_in_diary": False,
            "show_in_goal_edit": False,
        },
    }

    for body_metric in BodyMetric.objects.all():
        defaults = visibility_defaults.get(
            body_metric.name,
            {
                "show_in_diary": True,
                "show_in_goal_edit": True,
            },
        )

        visibility = BodyMetricsVisibility.objects.create(
            **defaults,
        )

        body_metric.visibility_id = visibility.pk
        body_metric.save(update_fields=["visibility"])


class Migration(migrations.Migration):
    dependencies = [
        (
            "body_metrics",
            "0002_bodymetric_created_at_bodymetric_is_favorite_and_more",
        ),
    ]

    operations = [
        migrations.CreateModel(
            name="BodyMetricsVisibility",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "show_in_diary",
                    models.BooleanField(default=True),
                ),
                (
                    "show_in_goal_edit",
                    models.BooleanField(default=True),
                ),
            ],
        ),
        migrations.AddField(
            model_name="bodymetric",
            name="visibility",
            field=models.OneToOneField(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="body_metric",
                to="body_metrics.bodymetricsvisibility",
            ),
        ),
        migrations.RunPython(
            create_body_metric_visibility,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="bodymetric",
            name="visibility",
            field=models.OneToOneField(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="body_metric",
                to="body_metrics.bodymetricsvisibility",
            ),
        ),
    ]
