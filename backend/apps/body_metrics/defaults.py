from pydantic import BaseModel


class BodyMetricSchema(BaseModel):
    name: str
    description: str = ""
    show_in_diary: bool = True
    show_in_goal_edit: bool = True
    is_single_entry: bool = False


DEFAULT_BODY_METRICS = [
    BodyMetricSchema(
        name="Height",
        description="The height of the user",
        show_in_diary=False,
        show_in_goal_edit=False,
        is_single_entry=True,
    ),
    BodyMetricSchema(
        name="Weight",
        description="The weight of the user",
        show_in_diary=True,
        show_in_goal_edit=True,
        is_single_entry=False,
    ),
    BodyMetricSchema(
        name="Age",
        description="The age of the user",
        show_in_diary=False,
        show_in_goal_edit=False,
        is_single_entry=True,
    ),
]
