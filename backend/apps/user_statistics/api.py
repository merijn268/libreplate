from apps.user_statistics.models import Graph, GraphLine
from apps.user_statistics.serializers import GraphLineSerializer, GraphSerializer
from rest_framework import permissions, viewsets


class GraphViewSet(viewsets.ModelViewSet):
    serializer_class = GraphSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):

        # TODO apply this fix everywhere in the code:
        # invoke dev.ga
        # /home/m/Documents/repos/libreplate/backend/apps/user_statistics/api.py:21: Warning [GraphLineViewSet]: could not derive type of path parameter "id" because it is untyped and obtaining queryset from the viewset failed. Consider adding a type to the path (e.g. <int:id>) or annotating the parameter type with @extend_schema. Defaulting to "string".
        # /home/m/Documents/repos/libreplate/backend/apps/user_statistics/api.py:7: Warning [GraphViewSet]: could not derive type of path parameter "id" because it is untyped and obtaining queryset from the viewset failed. Consider adding a type to the path (e.g. <int:id>) or annotating the parameter type with @extend_schema. Defaulting to "string".

        # Schema generation summary:
        # Warnings: 8 (2 unique)
        # Errors:   0 (0 unique)
        if (
            getattr(self, "swagger_fake_view", False)
            or not self.request.user.is_authenticated
        ):
            return Graph.objects.none()

        return Graph.objects.filter(user=self.request.user).prefetch_related(
            "lines", "lines__body_metric", "lines__nutrient"
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class GraphLineViewSet(viewsets.ModelViewSet):
    serializer_class = GraphLineSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if (
            getattr(self, "swagger_fake_view", False)
            or not self.request.user.is_authenticated
        ):
            return GraphLine.objects.none()

        return GraphLine.objects.filter(graph__user=self.request.user).select_related(
            "graph", "body_metric", "nutrient"
        )
