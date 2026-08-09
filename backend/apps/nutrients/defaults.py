from typing import Optional

from pydantic import BaseModel

# Default USDA nutrients
# https://www.ars.usda.gov/ARSUserFiles/80400530/pdf/fndds/2021_2023_FNDDS_Doc.pdf


class NutrientSchema(BaseModel):
    name: str
    description: Optional[str] = None
    abbreviation: Optional[str] = None

    show_in_diary_total: bool = False
    show_in_diary_meal: bool = False
    show_in_food_edit: bool = False
    show_in_recipe: bool = False
    show_in_recipes: bool = False
    show_in_foods: bool = False
    show_in_goal_edit: bool = False

    # USDA FoodData Central nutrient number
    usda_nutrient_number: Optional[int] = None

    order: int = 0


def nutrient_everywhere(**kwargs):
    return NutrientSchema(
        show_in_diary_total=True,
        show_in_diary_meal=True,
        show_in_food_edit=True,
        show_in_recipe=True,
        show_in_recipes=True,
        show_in_foods=True,
        show_in_goal_edit=True,
        **kwargs,
    )


def nutrient_recipe_food_edit(**kwargs):
    return NutrientSchema(
        show_in_food_edit=True,
        show_in_recipe=True,
        **kwargs,
    )


DEFAULT_NUTRIENTS = [
    nutrient_everywhere(
        name="Energy",
        description="Energy provided by food.",
        abbreviation=None,
        usda_nutrient_number=208,
        order=1,
    ),
    nutrient_everywhere(
        name="Fat",
        description="Total fat content.",
        abbreviation=None,
        usda_nutrient_number=204,
        order=2,
    ),
    nutrient_recipe_food_edit(
        name="Saturated Fat",
        description="Saturated fatty acids.",
        abbreviation="Sat fat",
        usda_nutrient_number=606,
        order=3,
    ),
    nutrient_everywhere(
        name="Carbohydrates",
        description="Total carbohydrate content.",
        abbreviation="Carbs",
        usda_nutrient_number=205,
        order=4,
    ),
    nutrient_recipe_food_edit(
        name="Sugar",
        description="Total sugars.",
        abbreviation=None,
        usda_nutrient_number=269,
        order=5,
    ),
    nutrient_recipe_food_edit(
        name="Fiber",
        description="Dietary fiber content.",
        abbreviation=None,
        usda_nutrient_number=291,
        order=6,
    ),
    nutrient_everywhere(
        name="Protein",
        description="Total protein content.",
        abbreviation=None,
        usda_nutrient_number=203,
        order=7,
    ),
    nutrient_recipe_food_edit(
        name="Sodium",
        description="Sodium content.",
        abbreviation=None,
        usda_nutrient_number=307,
        order=8,
    ),
    NutrientSchema(
        name="Cholesterol",
        description="Cholesterol content.",
        usda_nutrient_number=601,
    ),
    NutrientSchema(
        name="Water",
        description="Water content.",
        usda_nutrient_number=255,
    ),
    NutrientSchema(
        name="Alcohol",
        description="Alcohol content.",
        usda_nutrient_number=221,
    ),
    NutrientSchema(
        name="Caffeine",
        description="Caffeine content.",
        usda_nutrient_number=262,
    ),
    NutrientSchema(
        name="Theobromine",
        description="Theobromine content.",
        usda_nutrient_number=263,
    ),
    NutrientSchema(
        name="Calcium",
        description="Calcium content.",
        usda_nutrient_number=301,
    ),
    NutrientSchema(
        name="Iron",
        description="Iron content.",
        usda_nutrient_number=303,
    ),
    NutrientSchema(
        name="Magnesium",
        description="Magnesium content.",
        usda_nutrient_number=304,
    ),
    NutrientSchema(
        name="Phosphorus",
        description="Phosphorus content.",
        usda_nutrient_number=305,
    ),
    NutrientSchema(
        name="Potassium",
        description="Potassium content.",
        usda_nutrient_number=306,
    ),
    NutrientSchema(
        name="Zinc",
        description="Zinc content.",
        usda_nutrient_number=309,
    ),
    NutrientSchema(
        name="Copper",
        description="Copper content.",
        usda_nutrient_number=312,
    ),
    NutrientSchema(
        name="Selenium",
        description="Selenium content.",
        usda_nutrient_number=317,
    ),
    NutrientSchema(
        name="Retinol",
        description="Retinol content.",
        usda_nutrient_number=319,
    ),
    NutrientSchema(
        name="Vitamin A, RAE",
        description="Vitamin A activity equivalents.",
        usda_nutrient_number=320,
    ),
    NutrientSchema(
        name="Beta Carotene",
        description="Beta carotene content.",
        usda_nutrient_number=321,
    ),
    NutrientSchema(
        name="Alpha Carotene",
        description="Alpha carotene content.",
        usda_nutrient_number=322,
    ),
    NutrientSchema(
        name="Vitamin E",
        description="Alpha-tocopherol content.",
        usda_nutrient_number=323,
    ),
    NutrientSchema(
        name="Vitamin D",
        description="Vitamin D (D2 + D3) content.",
        usda_nutrient_number=328,
    ),
    NutrientSchema(
        name="Beta Cryptoxanthin",
        description="Beta cryptoxanthin content.",
        usda_nutrient_number=334,
    ),
    NutrientSchema(
        name="Lycopene",
        description="Lycopene content.",
        usda_nutrient_number=337,
    ),
    NutrientSchema(
        name="Lutein + Zeaxanthin",
        description="Lutein and zeaxanthin content.",
        usda_nutrient_number=338,
    ),
    NutrientSchema(
        name="Vitamin C",
        description="Total ascorbic acid content.",
        usda_nutrient_number=401,
    ),
    NutrientSchema(
        name="Thiamin",
        description="Vitamin B1 content.",
        usda_nutrient_number=404,
    ),
    NutrientSchema(
        name="Riboflavin",
        description="Vitamin B2 content.",
        usda_nutrient_number=405,
    ),
    NutrientSchema(
        name="Niacin",
        description="Vitamin B3 content.",
        usda_nutrient_number=406,
    ),
    NutrientSchema(
        name="Vitamin B6",
        description="Vitamin B6 content.",
        usda_nutrient_number=415,
    ),
    NutrientSchema(
        name="Folate",
        description="Total folate content.",
        usda_nutrient_number=417,
    ),
    NutrientSchema(
        name="Vitamin B12",
        description="Vitamin B12 content.",
        usda_nutrient_number=418,
    ),
    NutrientSchema(
        name="Choline",
        description="Total choline content.",
        usda_nutrient_number=421,
    ),
    NutrientSchema(
        name="Vitamin K",
        description="Phylloquinone content.",
        usda_nutrient_number=430,
    ),
    NutrientSchema(
        name="Folic Acid",
        description="Folic acid content.",
        usda_nutrient_number=431,
    ),
    NutrientSchema(
        name="Folate, Food",
        description="Naturally occurring folate.",
        usda_nutrient_number=432,
    ),
    NutrientSchema(
        name="Folate, DFE",
        description="Dietary folate equivalents.",
        usda_nutrient_number=435,
    ),
    NutrientSchema(
        name="Added Vitamin E",
        description="Added vitamin E content.",
        usda_nutrient_number=573,
    ),
    NutrientSchema(
        name="Added Vitamin B12",
        description="Added vitamin B12 content.",
        usda_nutrient_number=578,
    ),
    # Fatty acids
    NutrientSchema(
        name="Trans Fat",
        description="Total trans fatty acids.",
        usda_nutrient_number=605,
    ),
    NutrientSchema(
        name="Butyric Acid (4:0)",
        description="4-carbon saturated fatty acid.",
        usda_nutrient_number=607,
    ),
    NutrientSchema(
        name="Caproic Acid (6:0)",
        description="6-carbon saturated fatty acid.",
        usda_nutrient_number=608,
    ),
    NutrientSchema(
        name="Caprylic Acid (8:0)",
        description="8-carbon saturated fatty acid.",
        usda_nutrient_number=609,
    ),
    NutrientSchema(
        name="Capric Acid (10:0)",
        description="10-carbon saturated fatty acid.",
        usda_nutrient_number=610,
    ),
    NutrientSchema(
        name="Lauric Acid (12:0)",
        description="12-carbon saturated fatty acid.",
        usda_nutrient_number=611,
    ),
    NutrientSchema(
        name="Myristic Acid (14:0)",
        description="14-carbon saturated fatty acid.",
        usda_nutrient_number=612,
    ),
    NutrientSchema(
        name="Palmitic Acid (16:0)",
        description="16-carbon saturated fatty acid.",
        usda_nutrient_number=613,
    ),
    NutrientSchema(
        name="Stearic Acid (18:0)",
        description="18-carbon saturated fatty acid.",
        usda_nutrient_number=614,
    ),
    NutrientSchema(
        name="Oleic Acid (18:1)",
        description="Monounsaturated fatty acid.",
        usda_nutrient_number=617,
    ),
    NutrientSchema(
        name="Linoleic Acid (18:2)",
        description="Omega-6 fatty acid.",
        usda_nutrient_number=618,
    ),
    NutrientSchema(
        name="Linolenic Acid (18:3)",
        description="Omega-3 fatty acid.",
        usda_nutrient_number=619,
    ),
    NutrientSchema(
        name="Arachidonic Acid (20:4)",
        description="Polyunsaturated fatty acid.",
        usda_nutrient_number=620,
    ),
    NutrientSchema(
        name="DHA (22:6 n-3)",
        description="Docosahexaenoic acid.",
        usda_nutrient_number=621,
    ),
    NutrientSchema(
        name="Palmitoleic Acid (16:1)",
        description="Monounsaturated fatty acid.",
        usda_nutrient_number=626,
    ),
    NutrientSchema(
        name="Parinaric Acid (18:4)",
        description="Polyunsaturated fatty acid.",
        usda_nutrient_number=627,
    ),
    NutrientSchema(
        name="Gadoleic Acid (20:1)",
        description="Monounsaturated fatty acid.",
        usda_nutrient_number=628,
    ),
    NutrientSchema(
        name="EPA (20:5 n-3)",
        description="Eicosapentaenoic acid.",
        usda_nutrient_number=629,
    ),
    NutrientSchema(
        name="Erucic Acid (22:1)",
        description="Monounsaturated fatty acid.",
        usda_nutrient_number=630,
    ),
    NutrientSchema(
        name="DPA (22:5 n-3)",
        description="Docosapentaenoic acid.",
        usda_nutrient_number=631,
    ),
    NutrientSchema(
        name="Total Monounsaturated Fatty Acids",
        description="Total MUFA content.",
        usda_nutrient_number=645,
    ),
    NutrientSchema(
        name="Total Polyunsaturated Fatty Acids",
        description="Total PUFA content.",
        usda_nutrient_number=646,
    ),
]
