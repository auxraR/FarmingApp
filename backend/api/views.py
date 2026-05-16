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
    Salida,
    InventoryMovement
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
    SalidaSerializer,
    InventoryMovementSerializer
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

    def perform_create(self, serializer):
        registro = serializer.save()
        
        if hasattr(registro, 'producto') and registro.producto:
            InventoryMovement.objects.create(
                producto=registro.producto,
                tipo_movimiento='Salida',
                cantidad=registro.quantity_kg, 
                motivo='Alimentación',
                observaciones=f'Ración registrada el {registro.date}'
            )


class HealthActionViewSet(viewsets.ModelViewSet):
    serializer_class = HealthActionSerializer

    def get_queryset(self):
        queryset = HealthAction.objects.all().order_by('-fecha')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset
    
    def perform_create(self, serializer):
        registro = serializer.save()
        
        if registro.tipo_evento:
            try:
                producto_usado = Products.objects.get(id=registro.tipo_evento)
                
                import re
                cantidad_limpia = re.findall(r"[-+]?\d*\.\d+|\d+", str(registro.dosis))
                cantidad_num = float(cantidad_limpia[0]) if cantidad_limpia else 0
                
                if cantidad_num > 0:
                    InventoryMovement.objects.create(
                        producto=producto_usado, 
                        tipo_movimiento='Salida',
                        cantidad=cantidad_num,
                        motivo='Aplicación Sanitaria',
                        observaciones=f'Aplicado a animal ID #{registro.animal.id}'
                    )
            except Products.DoesNotExist:
                print(f"No se encontró un producto con el ID {registro.tipo_evento}")
            except Exception as e:
                print(f"Error al descontar inventario de salud: {e}")

class WeightControlViewSet(viewsets.ModelViewSet):
    serializer_class = WeightControlSerializer

    def get_queryset(self):
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

    def perform_create(self, serializer):
        registro = serializer.save()
        
        producto_leche = Products.objects.filter(nombre__icontains='Leche').first()
        
        if producto_leche:
            InventoryMovement.objects.create(
                producto=producto_leche,
                tipo_movimiento='Entrada',
                cantidad=registro.liters_produced,
                motivo='Producción Diaria',
                observaciones=f'Ordeño registrado el {registro.date}'
            )
    

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


class InventoryMovementViewSet(viewsets.ModelViewSet):
    queryset = InventoryMovement.objects.all().order_by('-fecha_movimiento')
    serializer_class = InventoryMovementSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tipo_movimiento', 'producto', 'motivo']