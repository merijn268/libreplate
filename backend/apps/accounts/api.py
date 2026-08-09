from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class MessageSerializer(serializers.Serializer):
    detail = serializers.CharField()


class CsrfSerializer(serializers.Serializer):
    csrfToken = serializers.CharField()


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()


@extend_schema(
    request=None,
    responses=CsrfSerializer,
)
@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf_view(request):
    return Response({"csrfToken": get_token(request)})


@extend_schema(
    request=LoginSerializer,
    responses={
        200: MessageSerializer,
        401: MessageSerializer,
    },
)
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(
        request,
        username=username,
        password=password,
    )

    if user is None:
        return Response(
            {"detail": "Invalid credentials"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    login(request, user)

    return Response(
        {"detail": "Logged in"},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    request=None,
    responses={
        200: MessageSerializer,
    },
)
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)

    return Response(
        {"detail": "Logged out"},
        status=status.HTTP_200_OK,
    )


@extend_schema(
    request=None,
    responses=UserSerializer,
)
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(
        {
            "id": request.user.id,
            "username": request.user.username,
            "email": request.user.email,
        }
    )
