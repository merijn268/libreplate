from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from drf_spectacular.utils import extend_schema
from rest_framework import serializers, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserPreferences
from .serializers import UserPreferencesSerializer


class UserPreferencesView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsAuthenticated]

    def get_preferences(self, request):
        preferences, _ = UserPreferences.objects.get_or_create(
            user=request.user,
        )
        return preferences

    @extend_schema(
        request=None,
        responses=UserPreferencesSerializer,
    )
    def get(self, request):
        preferences = self.get_preferences(request)

        return Response(
            UserPreferencesSerializer(preferences).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        request=UserPreferencesSerializer,
        responses=UserPreferencesSerializer,
    )
    def patch(self, request):
        preferences = self.get_preferences(request)

        serializer = UserPreferencesSerializer(
            preferences,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


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
