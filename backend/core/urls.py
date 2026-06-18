from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
from api.views import (
    CustomLoginView,
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
    InventoryMovementViewSet,
    MarketPriceViewSet,
    FinanceSummaryView,
    ReportGeneratorView,
    recibir_mensaje_chat,
    generar_backup_manual,
    SystemAlertViewSet
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
router.register(r'precios-mercado', MarketPriceViewSet, basename='precios-mercado')
router.register(r'alerts', SystemAlertViewSet, basename='alerts')

urlpatterns = [
    path('api/login/', CustomLoginView.as_view(), name='login'),
    path('api/reports/generate/', ReportGeneratorView.as_view(), name='report-generate'),
    path('api/chatbot/', recibir_mensaje_chat),
    path('api/backup-manual/', generar_backup_manual),
    path('api/finances/', FinanceSummaryView.as_view(), name='finances-summary'),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)