from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import LivestockViewSet, BatchViewSet, FeedingLogViewSet, HealthActionViewSet, WeightControlViewSet

router = DefaultRouter()
router.register(r'livestock', LivestockViewSet)
router.register(r'batches', BatchViewSet) 
router.register(r'feeding', FeedingLogViewSet) 
router.register(r'health-actions', HealthActionViewSet, basename='health-actions')
router.register(r'weight-control', WeightControlViewSet, basename='weight-control')
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]