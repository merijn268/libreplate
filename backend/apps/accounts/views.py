from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect


@login_required
def toggle_dark_mode(request):
    preferences = request.user.preferences

    preferences.dark_mode = not preferences.dark_mode
    preferences.save()

    return redirect(request.META.get("HTTP_REFERER", "/"))


@login_required
def update_theme_color(request):
    if request.method == "POST":
        color = request.POST.get("theme_color")

        if color:
            request.user.preferences.theme_color = color
            request.user.preferences.save()

    return JsonResponse({"status": "ok"})
