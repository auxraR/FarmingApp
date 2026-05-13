from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    LivestockViewSet,
    BatchViewSet,
    FeedingLogViewSet,
    HealthActionViewSet,
    WeightControlViewSet,
    MilkProductionViewSet,
    SalesViewSet,
    ClientViewSet,
    ProductsViewSet,
    SalesDetailsViewSet,
    SalidaViewSet,
    InventoryMovementViewSet
)

router = DefaultRouter()
router.register(r'livestock', LivestockViewSet)
router.register(r'batches', BatchViewSet) 
router.register(r'feeding', FeedingLogViewSet) 
router.register(r'health-actions', HealthActionViewSet, basename='health-actions')
router.register(r'weight-control', WeightControlViewSet, basename='weight-control')
router.register(r'milk-production', MilkProductionViewSet, basename='milk-production')
router.register(r'sales', SalesViewSet, basename='sales')
router.register(r'clients', ClientViewSet, basename='clients')
router.register(r'products', ProductsViewSet, basename='products')
router.register(r'sales-details', SalesDetailsViewSet, basename='sales-details')
router.register(r'sales-outflow', SalidaViewSet, basename='sales-outflow')
router.register(r'inventory-movements', InventoryMovementViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
