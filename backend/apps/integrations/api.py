from apps.foods.serializers import FoodSerializer
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet

from .serializers import FoodIntegrationAddSerializer
from .service import FoodIntegrationAPI

FOOD_SEARCH_PARAMETERS = [
    OpenApiParameter(
        "query",
        str,
        required=True,
        description="Search term for the food integration providers.",
    ),
    # TODO Hardcoded, change later.
    OpenApiParameter(
        "services",
        str,
        required=True,
        description="Comma separated integration services to search. Available: Dirk, USDA.",
    ),
    OpenApiParameter(
        "limit",
        int,
        description="Maximum number of results to return for all integrations combined.",
    ),
]


class FoodIntegrationViewSet(ViewSet):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=FOOD_SEARCH_PARAMETERS,
        responses=FoodSerializer(many=True),
    )
    @action(detail=False, methods=["get"])
    def search(self, request):
        params = request.query_params

        foods = FoodIntegrationAPI().search(
            query=params.get("query", ""),
            services=params.get("services", "").split(","),
            limit=int(params.get("limit", 20)),
            user=request.user,
        )

        return Response(
            FoodSerializer(
                foods,
                many=True,
                context={"request": request},
            ).data
        )

    @extend_schema(
        request=FoodIntegrationAddSerializer,
        responses=FoodSerializer,
    )
    @action(detail=False, methods=["post"])
    def add(self, request):
        serializer = FoodIntegrationAddSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        food = FoodIntegrationAPI().add(
            service=serializer.validated_data["service"],
            external_id=serializer.validated_data["external_id"],
            user=request.user,
        )

        return Response(
            FoodSerializer(
                food,
                context={"request": request},
            ).data
        )
