from apps.body_metrics.models import BodyMetric, BodyMetricLog
from apps.body_metrics.serializers import (
    BodyMetricLogSerializer,
    BodyMetricSerializer,
)
from django.db.models import Q
from drf_spectacular.utils import OpenApiParameter, OpenApiTypes, extend_schema
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        ),
    ]
)
class BodyMetricLogViewSet(viewsets.ModelViewSet):
    serializer_class = BodyMetricLogSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return (
            BodyMetricLog.objects.filter(user=self.request.user)
            .select_related("body_metric")
            .order_by("-date", "-id")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@extend_schema(
    parameters=[
        OpenApiParameter(
            name="id",
            type=OpenApiTypes.INT,
            location=OpenApiParameter.PATH,
        ),
    ]
)
class BodyMetricViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BodyMetricSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return BodyMetric.objects.filter(
            Q(user__isnull=True) | Q(user=self.request.user)
        ).order_by("id")
