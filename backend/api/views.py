from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from django.db.models import Sum, F


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
    InventoryMovement,
    MarketPrice,
    CashRegister
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
    InventoryMovementSerializer,
    MarketPriceSerializer
)

class LivestockViewSet(viewsets.ModelViewSet):
    queryset = Livestock.objects.all() 
    serializer_class = LivestockSerializer 

    def get_queryset(self):
        queryset = super().get_queryset()
        
        sexo = self.request.query_params.get('sexo')
        estado = self.request.query_params.get('estado')
        search = self.request.query_params.get('search')

        if sexo:
            queryset = queryset.filter(sexo=sexo)
        if estado:
            queryset = queryset.filter(estado=estado)
        if search:
            queryset = queryset.filter(nombre__icontains=search) 

        return queryset

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer


class MarketPriceViewSet(viewsets.ModelViewSet):
        queryset = MarketPrice.objects.all()
        serializer_class = MarketPriceSerializer

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



class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        try:
            rol = self.user.profile.rol
        except:
            rol = 'Capataz' 
        
        data['rol'] = rol
        data['username'] = self.user.username
        return data

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



class FinanceSummaryView(APIView):
    def get(self, request):
        try:
            caja_obj = CashRegister.objects.order_by('-fecha_registro').first()
            saldo_inicial = float(caja_obj.saldo_inicial) if caja_obj else 0.0

            gastos_totales = InventoryMovement.objects.filter(
                tipo_movimiento='Entrada', 
                motivo__icontains='Compra'
            ).aggregate(total=Sum('costo_unitario'))['total'] or 0.0
            
            gastos_totales = float(gastos_totales)

            ingresos_totales = InventoryMovement.objects.filter(
                tipo_movimiento='Salida',
                motivo__icontains='Venta'
            ).aggregate(total=Sum(F('cantidad') * F('producto__precio_actual')))['total'] or 0.0
            
            ingresos_totales = float(ingresos_totales)

            dinero_en_caja = saldo_inicial + ingresos_totales - gastos_totales

            inventario_ganado_vivo = sum(float(animal.valor_estimado) for animal in Livestock.objects.filter(estado=1))

            inventario_bodega = Products.objects.all().aggregate(
                total=Sum(F('stock') * F('precio_actual'))
            )['total'] or 0.0
            inventario_bodega = float(inventario_bodega)

            patrimonio_total = dinero_en_caja + inventario_ganado_vivo + inventario_bodega

            cash_flow_trends = [
                { 'month': 'Mar', 'Income': ingresos_totales * 0.8, 'Expenses': gastos_totales * 0.9 },
                { 'month': 'Apr', 'Income': ingresos_totales * 0.9, 'Expenses': gastos_totales * 0.8 },
                { 'month': 'May', 'Income': ingresos_totales, 'Expenses': gastos_totales },
            ]

            ranch_valuation_growth = [
                { 'month': 'Mar', 'Value': patrimonio_total * 0.9 },
                { 'month': 'Apr', 'Value': patrimonio_total * 0.95 },
                { 'month': 'May', 'Value': patrimonio_total },
            ]

            ultimos_movimientos = InventoryMovement.objects.all().order_by('-fecha_movimiento')[:5]
            ledger_list = []
            for mov in ultimos_movimientos:
                ledger_list.append({
                    'id': mov.id,
                    'date': mov.fecha_movimiento.strftime('%Y-%m-%d'),
                    'description': f"{mov.tipo_movimiento} de {mov.producto} ({mov.motivo})",
                    'category': mov.producto.categoria if mov.producto else 'Varios',
                    'type': 'Ingreso' if mov.tipo_movimiento == 'Salida' and 'Venta' in mov.motivo else 'Egreso',
                    'amount': float(mov.costo_unitario or (mov.cantidad * (mov.producto.precio_actual if mov.producto else 0)))
                })

            return Response({
                'kpi': {
                    'patrimonio': round(patrimonio_total, 2),
                    'ingresos': round(ingresos_totales, 2),
                    'gastos': round(gastos_totales, 2),
                    'neto': round(dinero_en_caja, 2) 
                },
                'cashFlowTrends': cash_flow_trends,
                'ranchValuationGrowth': ranch_valuation_growth,
                'generalLedger': ledger_list
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print("\n" + "="*40)
            print("❌ ERROR EN EL ENDPOINT DE FINANZAS:")
            print(repr(e))
            print("="*40 + "\n")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)