from pydantic import BaseModel


class BodyMetricSchema(BaseModel):
    name: str
    description: str = ""
    show_in_daily_log: bool = True
    show_in_goal_edit: bool = True


DEFAULT_BODY_METRICS = [
    BodyMetricSchema(
        name="Height",
        description="The height of the user",
        show_in_daily_log=False,
        show_in_goal_edit=False,
    ),
    BodyMetricSchema(
        name="Weight",
        description="The weight of the user",
        show_in_daily_log=True,
        show_in_goal_edit=True,
    ),
    BodyMetricSchema(
        name="Age",
        description="The age of the user",
        show_in_daily_log=False,
        show_in_goal_edit=False,
    ),
]
