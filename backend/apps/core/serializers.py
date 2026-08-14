from rest_framework import serializers


class UserOwnedRelatedField(serializers.PrimaryKeyRelatedField):
    """
    A primary key field restricted to objects owned by the current user,
    using the given serializer for representation.
    """

    def __init__(self, *args, serializer_class=None, **kwargs):
        self.serializer_class = serializer_class
        super().__init__(*args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.context["request"].user
        return queryset.filter(user=user)

    def to_representation(self, value):
        return self.serializer_class(
            value,
            context=self.context,
        ).data
