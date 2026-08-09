from rest_framework import serializers


class TagSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
