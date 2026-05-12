from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta

from .models import (
    Livestock,
    Batch,
    FeedingLog,
    HealthAction,
    WeightControl,
    MilkProduction,
    Sales,
    SalesDetails,
    Client,
    Products,
    Salida
)
from .serializers import (
    LivestockSerializer,
    BatchSerializer,
    FeedingLogSerializer,
    HealthActionSerializer,
    WeightControlSerializer,
    MilkProductionSerializer,
    SalesSerializer,
    SalesDetailSerializer,
    ClientSerializer,
    ProductSerializer,
    SalidaSerializer
)

class LivestockViewSet(viewsets.ModelViewSet):
    queryset = Livestock.objects.all().order_by('-id')
    serializer_class = LivestockSerializer
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    search_fields = ['id', 'nombre']

    filterset_fields = ['estado']


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

class FeedingLogViewSet(viewsets.ModelViewSet):
    queryset = FeedingLog.objects.all().order_by('-date', '-id')
    serializer_class = FeedingLogSerializer

class HealthActionViewSet(viewsets.ModelViewSet):
    serializer_class = HealthActionSerializer

    def get_queryset(self):
        queryset = HealthAction.objects.all().order_by('-fecha')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset
    

class WeightControlViewSet(viewsets.ModelViewSet):
    serializer_class = WeightControlSerializer

    def get_queryset(self):
        # Ordenamos del más reciente al más antiguo
        queryset = WeightControl.objects.all().order_by('-fecha')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset
    

class MilkProductionViewSet(viewsets.ModelViewSet):
    serializer_class = MilkProductionSerializer

    def get_queryset(self):
        queryset = MilkProduction.objects.all().order_by('-date')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

class SalesViewSet(viewsets.ModelViewSet):
    queryset = Sales.objects.all().order_by('-sale_date', '-id')
    serializer_class = SalesSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                self.perform_create(serializer)
            
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-id')
    serializer_class = ClientSerializer

class ProductsViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.all().order_by('-id')
    serializer_class = ProductSerializer

class SalesDetailsViewSet(viewsets.ModelViewSet):
    queryset = SalesDetails.objects.all().order_by('-id')
    serializer_class = SalesDetailSerializer


class SalidaViewSet(viewsets.ModelViewSet):
    queryset = Salida.objects.all().order_by('-fecha_salida', '-id')
    serializer_class = SalidaSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        if response.status_code == 201:
            animal_id = request.data.get('ganado')
            animal = Livestock.objects.get(id=animal_id)
            animal.estado = 0
            animal.save()
        return response

    @action(detail=True, methods=['post'])
    def revertir(self, request, pk=None):
        salida = self.get_object()

        if salida.motivo_salida == 'Venta':
            return Response({"error": "Las ventas deben anularse desde el módulo de Sales."}, status=status.HTTP_400_BAD_REQUEST)
        
        limite_tiempo = timezone.now().date() - timedelta(days=7)
        if salida.fecha_salida < limite_tiempo:
            return Response({"error": "Solo se pueden revertir salidas de los últimos 7 días."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                animal = salida.ganado
                animal.estado = 1
                animal.save()
                
                salida.delete()
                
            return Response({"status": "Salida revertida y animal reintegrado"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
