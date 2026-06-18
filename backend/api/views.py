from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from rest_framework.decorators import action, api_view  
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from django.db.models import Sum, F, Count, Avg
from datetime import datetime, timedelta
import os
import google.generativeai as genai
from dotenv import load_dotenv
import subprocess
from django.db.models import Q  
from rest_framework.exceptions import ValidationError

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
    CashRegister,
    SystemAlert
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
    MarketPriceSerializer,
    SystemAlertSerializer
)


load_dotenv()


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

INSTRUCCIONES_SISTEMA = """
Eres 'CowBot', el asistente de soporte técnico exclusivo del 'Sistema de Gestión de la finca Flor de Maria'.
Tu ÚNICO propósito es ayudar al usuario a entender los módulos del sistema y resolver errores. No respondas preguntas fuera de este contexto.

Conocimiento de la Arquitectura del Sistema:
- El sistema utiliza "Borrado Lógico" (archiva u oculta los registros en lugar de borrarlos físicamente) para que la contabilidad y el Kardex nunca se desajusten.
- Para Cerrar Sesión (Logout), el usuario debe usar el botón en la parte inferior del menú lateral.

Conocimiento de la Arquitectura del Sistema:
- El sistema utiliza "Borrado Lógico" (archiva u oculta los registros en lugar de borrarlos físicamente) para que la contabilidad y el Kardex nunca se desajusten.
- Para Cerrar Sesión (Logout), el usuario debe usar el botón en la parte inferior del menú lateral.
- Trazabilidad Unitaria: Cada animal tiene un perfil QR que calcula su ROI (Retorno de Inversión) restando los costos médicos y de compra frente a los ingresos generados por su leche o su ganancia de peso (Apreciación del Activo).

Los módulos del sistema (Sidebar) son:
1. Dashboard: Panel principal con KPIs (Total Assets, Income, Expenses).
2. Livestock (Ganado): Catálogo de animales. Muestra la hoja de vida, historial de pesajes, vacunas y rentabilidad financiera individual.
3. Feeding (Alimentación): Asignación de raciones a grupos. Descuenta automáticamente del inventario.
4. Health (Salud): Control de peso y vacunas (exigen 180 días de espera entre dosis fuertes). El costo de la medicina se suma a la inversión del animal.
5. Production (Producción): Ordeño de leche. Automatizado: cada litro registrado suma stock al Inventario y aumenta el Capital Total de la finca.
6. Sales (Ventas): Registro de ventas. Ingresa dinero a Finanzas.
7. Finances (Finanzas): Flujo de caja, cálculo de pérdidas por animales muertos/robados y cuadros de Costo-Beneficio (ROI) por productos vendidos.
8. Inventory (Inventario): Kardex automatizado (Entradas y Salidas). Alimenta y descuenta stock real.
9. Outflow (Salidas): Bajas por muerte, robo o escape. Genera una "Pérdida Financiera" en reportes.
10. Reports (Reportes): Estudio de generación de informes oficiales en PDF (Ejecutivos, Financieros, Salud, Leche e Inventario) con gráficas.
11. Settings (Configuración): Panel de Seguridad (Copias de Seguridad / Backups manuales y automáticos).

Tus reglas de comportamiento:
- Si el usuario pregunta "cómo hago para..." o "por qué no me deja...", explícale el paso a paso de forma clara.
- Responde siempre de forma MUY BREVE y al grano. Un detallito no más. Máximo 2 o 3 líneas cortas.
- Usa un tono amigable pero profesional y si el usuario habla inglés, responde en inglés.
- No es obligatorio en cada mensaje, pero simula que eres una vaca técnica. Usa un "MOOOOO" ocasionalmente o haz alguna broma de vacas.
"""

class LivestockViewSet(viewsets.ModelViewSet):
    queryset = Livestock.objects.all() 
    serializer_class = LivestockSerializer 

    @action(detail=True, methods=['get'])
    def trazabilidad_financiera(self, request, pk=None):
        try:
            animal = self.get_object()
            
            # --- 1. HISTORIAL DE PESOS (El secreto para saber cuánto costó vs cuánto vale hoy) ---
            # Buscamos el primer y el último pesaje registrado
            primer_pesaje = WeightControl.objects.filter(animal=animal, estado=1).order_by('fecha').first()
            ultimo_pesaje = WeightControl.objects.filter(animal=animal, estado=1).order_by('-fecha').first()

            peso_inicial = float(primer_pesaje.peso) if primer_pesaje else float(animal.peso)
            peso_actual = float(ultimo_pesaje.peso) if ultimo_pesaje else float(animal.peso)

            # Asumimos precio del kilo en pie (puedes jalarlo de MarketPrice si lo tienes)
            precio_kilo_pie = 60.0 

            # --- 2. LO QUE NOS HA COSTADO EL ANIMAL (INVERSIÓN REAL) ---
            # Si el usuario no puso costo_compra manual, calculamos cuánto costó cuando llegó por su peso inicial
            inversion_inicial = float(animal.costo_compra) if animal.costo_compra else (peso_inicial * precio_kilo_pie)
            
            # Gastos Médicos
            historial_salud = HealthAction.objects.filter(animal=animal, estado=1)
            gasto_salud = 0
            for sanidad in historial_salud:
                try:
                    producto = Products.objects.get(id=sanidad.tipo_evento)
                    import re
                    dosis_limpia = re.findall(r"[-+]?\d*\.\d+|\d+", str(sanidad.dosis))
                    dosis_num = float(dosis_limpia[0]) if dosis_limpia else 0
                    gasto_salud += (dosis_num * float(producto.precio_actual))
                except Exception:
                    pass
            
            inversion_total = inversion_inicial + gasto_salud

            # --- 3. VALORIZACIÓN DEL ACTIVO (Lo que vale el animal vivo HOY) ---
            valor_mercado_actual = peso_actual * precio_kilo_pie

            # --- 4. RENTABILIDAD SEGÚN SEXO ---
            if animal.sexo == 'Hembra' or animal.sexo == 'Vaca':
                # La hembra genera valor por partida doble: Se pone gorda (carne) y da leche
                producciones = MilkProduction.objects.filter(animal=animal, estado=1)
                total_leche = sum(float(p.liters_produced) for p in producciones)
                
                prod_leche = Products.objects.filter(nombre__icontains='Leche').first()
                precio_leche = float(prod_leche.precio_actual) if prod_leche else 0
                
                ingreso_leche = total_leche * precio_leche
                
                # GANANCIA = (Valor de la vaca hoy + Leche) - (Lo que costó la vaca antes + Vacunas)
                ingreso_bruto_total = valor_mercado_actual + ingreso_leche
                margen_neto = ingreso_bruto_total - inversion_total
                
                datos_roi = {
                    'modelo': 'Producción y Engorde (Hembra)',
                    'metrica_clave': f"{total_leche} L | {peso_actual} KG",
                    'ingreso_bruto': ingreso_bruto_total,
                    'inversion_total': inversion_total,
                    'margen_neto': margen_neto,
                    'rentabilidad': round((margen_neto / inversion_total * 100), 2) if inversion_total > 0 else 0
                }
            else:
                # El macho solo genera valor engordando
                ingreso_bruto_total = valor_mercado_actual
                margen_neto = ingreso_bruto_total - inversion_total
                
                datos_roi = {
                    'modelo': 'Engorde / Carne (Macho)',
                    'metrica_clave': f"{peso_actual} KG (Peso actual)",
                    'ingreso_bruto': ingreso_bruto_total, 
                    'inversion_total': inversion_total,
                    'margen_neto': margen_neto,
                    'rentabilidad': round((margen_neto / inversion_total * 100), 2) if inversion_total > 0 else 0
                }

            return Response({
                'id': animal.id,
                'identificador': animal.nombre or f"Chapa {animal.chapa}",
                'raza': animal.raza,
                'inversion_desglose': {
                    'inicial': inversion_inicial,
                    'salud': gasto_salud
                },
                'finanzas': datos_roi
            })

        except Exception as e:
            return Response({'error': str(e)}, status=500)

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
           queryset = queryset.filter(
                Q(nombre__icontains=search) | Q(chapa__icontains=search)
            ) 

        return queryset

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.filter(estado=1)
    serializer_class = BatchSerializer


class MarketPriceViewSet(viewsets.ModelViewSet):
        queryset = MarketPrice.objects.filter(estado=1)
        serializer_class = MarketPriceSerializer

class FeedingLogViewSet(viewsets.ModelViewSet):
    queryset = FeedingLog.objects.filter(estado=1).order_by('-date', '-id')
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
        queryset = HealthAction.objects.filter(estado=1).order_by('-fecha')
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
        queryset = WeightControl.objects.filter(estado=1).order_by('-fecha')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset
    

class MilkProductionViewSet(viewsets.ModelViewSet):
    serializer_class = MilkProductionSerializer

    def get_queryset(self):
        queryset = MilkProduction.objects.filter(estado=1).order_by('-date')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            # Buscamos el producto ANTES de guardar la ordeña
            producto_leche = Products.objects.filter(nombre__icontains='Leche').first()
            
            # 🔥 Si no existe, explotamos el proceso y le avisamos a React
            if not producto_leche:
                raise ValidationError({"error": "No se encontró el producto 'Leche' en el inventario. Créalo primero en el módulo de Productos antes de registrar ordeñas."})
            
            # Si sí existe, guardamos todo normal
            registro = serializer.save()
            
            # Registramos el movimiento
            InventoryMovement.objects.create(
                producto=producto_leche,
                tipo_movimiento='Entrada',
                cantidad=registro.liters_produced,
                costo_unitario=0, # La producción interna no te cuesta al momento de registrarla
                motivo='Producción Diaria',
                observaciones=f'Ordeño registrado el {registro.date}'
            )
            
            # Sumamos los litros al stock real
            producto_leche.stock += registro.liters_produced
            producto_leche.save()

class SalesViewSet(viewsets.ModelViewSet):
    queryset = Sales.objects.filter(estado=1).order_by('-sale_date', '-id')
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
    queryset = Client.objects.filter(estado=1).order_by('-id')
    serializer_class = ClientSerializer

class ProductsViewSet(viewsets.ModelViewSet):
    queryset = Products.objects.filter(estado=1).order_by('-id')
    serializer_class = ProductSerializer

class SalesDetailsViewSet(viewsets.ModelViewSet):
    queryset = SalesDetails.objects.filter(estado=1).order_by('-id')
    serializer_class = SalesDetailSerializer


class SalidaViewSet(viewsets.ModelViewSet):
    queryset = Salida.objects.filter(estado=1).order_by('-fecha_salida', '-id')
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
    queryset = InventoryMovement.objects.filter(estado=1).order_by('-fecha_movimiento')
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
                estado=1,
                tipo_movimiento='Entrada', 
                motivo__icontains='Compra'
            ).aggregate(total=Sum(F('cantidad') * F('costo_unitario')))['total'] or 0.0
            
            gastos_totales = float(gastos_totales)

         
            ingresos_totales = InventoryMovement.objects.filter(
                estado=1,
                tipo_movimiento='Salida',
                motivo__icontains='Venta'
            ).aggregate(total=Sum(F('cantidad') * F('producto__precio_actual')))['total'] or 0.0
            
            ingresos_totales = float(ingresos_totales)

            dinero_en_caja = saldo_inicial + ingresos_totales - gastos_totales

            inventario_ganado_vivo = sum(float(animal.valor_estimado) for animal in Livestock.objects.filter(estado=1))

            inventario_bodega = Products.objects.filter(estado=1).aggregate(
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

            ultimos_movimientos = InventoryMovement.objects.filter(estado=1).order_by('-fecha_movimiento')[:5]
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
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ReportGeneratorView(APIView):
    def get(self, request):
        try:
            desde_str = request.GET.get('desde')
            hasta_str = request.GET.get('hasta')
            
            if not desde_str or not hasta_str:
                return Response({'error': 'Faltan parámetros'}, status=status.HTTP_400_BAD_REQUEST)

            desde = datetime.strptime(desde_str, '%Y-%m-%d')
            hasta = datetime.strptime(hasta_str, '%Y-%m-%d') + timedelta(days=1) - timedelta(seconds=1)

            # --- 1. CÁLCULO DE INGRESOS Y EGRESOS (CORREGIDO) ---
            # Excluimos 'Producción' y multiplicamos cantidad * costo
            movimientos_entrada = InventoryMovement.objects.filter(
                tipo_movimiento='Entrada', fecha_movimiento__range=[desde, hasta]
            ).exclude(motivo__icontains='Producción')
            gastos = float(movimientos_entrada.aggregate(total=Sum(F('cantidad') * F('costo_unitario')))['total'] or 0.0)
            
            # Ingresos solo por Ventas
            movimientos_salida = InventoryMovement.objects.filter(
                tipo_movimiento='Salida', fecha_movimiento__range=[desde, hasta], motivo__icontains='Venta'
            )
            ingresos_ventas = float(movimientos_salida.aggregate(total=Sum(F('cantidad') * F('producto__precio_actual')))['total'] or 0.0)

            # --- 2. CÁLCULO DE PÉRDIDAS ANIMALES ---
            try:
                salidas_qs = Salida.objects.filter(fecha__range=[desde, hasta]).exclude(motivo__icontains='Venta')
                tabla_bajas = []
                total_perdidas_valor = 0.0
                
                for salida in salidas_qs:
                    valor = float(getattr(salida.animal, 'costo_compra', getattr(salida.animal, 'valor_estimado', 0)) or 0)
                    total_perdidas_valor += valor
                    identificador = getattr(salida.animal, 'nombre', getattr(salida.animal, 'chapa', f"ID: {salida.animal.id}"))
                    
                    tabla_bajas.append({
                        'chapa_nombre': identificador,
                        'motivo': salida.motivo,
                        'fecha': salida.fecha.strftime('%Y-%m-%d'),
                        'perdida': valor
                    })
                cantidad_perdidas = salidas_qs.count()
            except Exception:
                animales_perdidos = Livestock.objects.filter(estado=0)
                total_perdidas_valor = sum(float(animal.valor_estimado or 0) for animal in animales_perdidos)
                cantidad_perdidas = animales_perdidos.count()
                tabla_bajas = []

            # --- 3. ANÁLISIS COSTO-BENEFICIO (ROI PRODUCTOS) ---
            try:
                ventas_productos = SalesDetails.objects.filter(
                    venta__sale_date__range=[desde, hasta], 
                    tipo_item='Producto', 
                    estado=1
                ).values('producto__id', 'producto__nombre', 'producto__unidad_medida').annotate(
                    total_vendido=Sum('cantidad'),
                    ingresos_totales=Sum('subtotal')
                )

                tabla_roi_productos = []
                for venta in ventas_productos:
                    prod_id = venta['producto__id']
                    nombre = venta['producto__nombre']
                    unidad = venta['producto__unidad_medida']
                    vendido = float(venta['total_vendido'] or 0)
                    ingresos = float(venta['ingresos_totales'] or 0)

                    movimientos_entrada_roi = InventoryMovement.objects.filter(
                        producto_id=prod_id, tipo_movimiento='Entrada', estado=1, fecha_movimiento__lte=hasta
                    ).aggregate(costo_promedio=Avg('costo_unitario'))

                    costo_unitario_promedio = float(movimientos_entrada_roi['costo_promedio'] or 0)
                    costo_total_estimado = costo_unitario_promedio * vendido
                    ganancia_neta = ingresos - costo_total_estimado
                    margen_porcentaje = ((ganancia_neta / costo_total_estimado) * 100) if costo_total_estimado > 0 else 100.0

                    tabla_roi_productos.append({
                        'producto': nombre,
                        'unidad': unidad,
                        'cantidad_vendida': vendido,
                        'ingresos': ingresos,
                        'costos': costo_total_estimado,
                        'margen': ganancia_neta,
                        'rentabilidad': round(margen_porcentaje, 2)
                    })
                
                tabla_roi_productos = sorted(tabla_roi_productos, key=lambda x: x['margen'], reverse=True)
            except Exception:
                tabla_roi_productos = []

            # --- B. ROI Ganado ---
            try:
                ventas_ganado_qs = SalesDetails.objects.filter(venta__sale_date__range=[desde, hasta], tipo_item='Ganado')
                ingreso_ganado = sum(float(v.subtotal) for v in ventas_ganado_qs)
                margen_ganado = ingreso_ganado - gastos 
                
                tabla_roi_ganado = [{
                    'ingresos': ingreso_ganado,
                    'gastos': gastos,
                    'margen': margen_ganado,
                    'estado': 'Ganancia' if margen_ganado >= 0 else 'Pérdida'
                }]
            except Exception:
                tabla_roi_ganado = []

            # --- 5. PRODUCCIÓN DE LECHE Y VALORACIÓN ---
            dias_rango = max(1, (hasta - desde).days)
            semanas_rango = max(1, dias_rango / 7)

            producciones_qs = MilkProduction.objects.filter(date__range=[desde, hasta])
            total_leche = float(producciones_qs.aggregate(total=Sum('liters_produced'))['total'] or 0.0)
            promedio_semanal = round(total_leche / semanas_rango, 2)

           
            producto_leche = Products.objects.filter(nombre__icontains='Leche').first()
            precio_leche = float(producto_leche.precio_actual) if producto_leche else 0.0
            valor_leche_producida = total_leche * precio_leche

            prod_diaria = producciones_qs.values('date').annotate(total_litros=Sum('liters_produced')).order_by('date')
            grafica_produccion = [{'fecha': item['date'].strftime('%d %b'), 'litros': float(item['total_litros'])} for item in prod_diaria]

            tabla_produccion = []
            for p in producciones_qs.order_by('-date'):
                identificador_vaca = getattr(p.animal, 'nombre', getattr(p.animal, 'chapa', f"ID: {p.animal.id}"))
                tabla_produccion.append({'fecha': p.date.strftime('%Y-%m-%d'), 'vaca': f"Vaca {identificador_vaca}", 'litros': float(p.liters_produced)})

            # --- 4. CÁLCULO DEL CAPITAL TOTAL ---
            caja_obj = CashRegister.objects.order_by('-fecha_registro').first()
            saldo_inicial = float(caja_obj.saldo_inicial) if caja_obj else 0.0
            
            dinero_en_caja = saldo_inicial + ingresos_ventas - gastos
            inventario_ganado_vivo = sum(float(animal.valor_estimado or 0) for animal in Livestock.objects.filter(estado=1))
            inventario_bodega = float(Products.objects.aggregate(total=Sum(F('stock') * F('precio_actual')))['total'] or 0.0)
            
            # Sumamos la leche al capital global del periodo
            capital_total = dinero_en_caja + inventario_ganado_vivo + inventario_bodega

            # --- 6. SANIDAD Y PESAJE ---
            sanidad_qs = HealthAction.objects.filter(fecha__range=[desde, hasta]).order_by('-fecha')
            tabla_sanidad = [{'fecha': s.fecha.strftime('%Y-%m-%d'), 'vaca': f"Vaca {getattr(s.animal, 'nombre', s.animal.id)}", 'evento': s.tipo_evento, 'dosis': s.dosis} for s in sanidad_qs]

            peso_qs = WeightControl.objects.filter(fecha__range=[desde, hasta]).order_by('-fecha')
            tabla_peso = [{'fecha': w.fecha.strftime('%Y-%m-%d'), 'vaca': f"Vaca {getattr(w.animal, 'nombre', w.animal.id)}", 'peso': float(w.peso)} for w in peso_qs]

            peso_diario = peso_qs.values('fecha').annotate(promedio_peso=Avg('peso')).order_by('fecha')
            grafica_peso = [{'fecha': item['fecha'].strftime('%d %b'), 'peso': round(float(item['promedio_peso']), 2)} for item in peso_diario]
            
            crecimiento_pct = 0.0
            if len(grafica_peso) > 1 and grafica_peso[0]['peso'] > 0:
                crecimiento_pct = round(((grafica_peso[-1]['peso'] - grafica_peso[0]['peso']) / grafica_peso[0]['peso']) * 100, 2)

            # --- 7. INVENTARIO ---
            movimientos_qs = InventoryMovement.objects.filter(fecha_movimiento__range=[desde, hasta]).order_by('fecha_movimiento')
            tabla_movimientos = []
            inventario_diario = {}
            total_entradas_qty = total_salidas_qty = 0

            for m in movimientos_qs:
                fecha_str = m.fecha_movimiento.strftime('%d %b')
                cant = float(m.cantidad)
                if fecha_str not in inventario_diario:
                    inventario_diario[fecha_str] = {'fecha': fecha_str, 'Entradas': 0, 'Salidas': 0}
                
                if m.tipo_movimiento == 'Entrada':
                    inventario_diario[fecha_str]['Entradas'] += cant
                    total_entradas_qty += cant
                else:
                    inventario_diario[fecha_str]['Salidas'] += cant
                    total_salidas_qty += cant
                    
                tabla_movimientos.append({'fecha': m.fecha_movimiento.strftime('%Y-%m-%d'), 'producto': m.producto.nombre, 'tipo': m.tipo_movimiento, 'cantidad': cant, 'motivo': m.motivo})
                
            grafica_inventario = list(inventario_diario.values())
            tabla_movimientos.reverse()

            productos_qs = Products.objects.all().order_by('categoria', 'nombre')
            tabla_productos = [{'nombre': p.nombre, 'categoria': p.categoria, 'stock': float(p.stock), 'unidad': p.unidad_medida, 'precio': float(p.precio_actual)} for p in productos_qs]

            # --- 8. EMPAQUETAR JSON ---
            ingresos_totales = ingresos_ventas + valor_leche_producida

            detalle_ingresos = [
                {'concepto': 'Ventas Efectivas (Inventario)', 'monto': ingresos_ventas}, 
                {'concepto': 'Valor Producción Leche (En Bodega)', 'monto': valor_leche_producida},
            ]
            
            detalle_egresos = [
                {'concepto': 'Gastos Operativos y Compras', 'monto': gastos},
            ]

            report_data = {
                'periodo': {'desde': desde_str, 'hasta': hasta_str},
                'kpis': {
                    'ganancia_neta': ingresos_totales - gastos - total_perdidas_valor,
                    'ingresos_brutos': ingresos_totales,
                    'gastos_operativos': gastos,
                    'capital_total': capital_total,
                    'perdidas_animales': total_perdidas_valor,
                    'cantidad_perdidas': cantidad_perdidas,
                    'total_animales': Livestock.objects.filter(estado=1).count(),
                    'produccion_leche': total_leche, 
                    'valor_leche_producida': valor_leche_producida,
                    'promedio_semanal_leche': promedio_semanal,
                    'rentabilidad': round(((ingresos_totales - gastos) / ingresos_totales * 100), 1) if ingresos_totales > 0 else 0.0,
                    'tratamientos_aplicados': sanidad_qs.count(),
                    'crecimiento_peso_pct': crecimiento_pct,
                    'inventario_entradas': total_entradas_qty,
                    'inventario_salidas': total_salidas_qty
                },
                'tablas': {
                    'ingresos': detalle_ingresos,
                    'egresos': detalle_egresos,
                    'bajas_detalle': tabla_bajas,         
                    'roi_productos': tabla_roi_productos,         
                    'roi_ganado': tabla_roi_ganado,       
                    'produccion_detalle': tabla_produccion,
                    'sanidad_detalle': tabla_sanidad,
                    'peso_detalle': tabla_peso,
                    'movimientos_detalle': tabla_movimientos,
                    'productos_activos': tabla_productos
                },
                'graficas': {
                    'produccion_leche': grafica_produccion,
                    'progreso_peso': grafica_peso,
                    'flujo_inventario': grafica_inventario
                },
                'alertas': []
            }

            return Response(report_data, status=status.HTTP_200_OK)

        except Exception as e:
            print("\nERROR GENERANDO REPORTE:")
            print(repr(e))
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)\
            
'''Pruebas de implmentacion del chat bot de maxima calydahhh'''
@api_view(['POST'])
def recibir_mensaje_chat(request):
    mensaje = request.data.get('mensaje', '')

    if not mensaje:
        return Response({"error": "No message sent"}, status=status.HTTP_400_BAD_REQUEST)

    if len(mensaje) > 300:
        return Response({"Reply": "The message is very long. Please be more concise and tell me your specific question."})

    try:
        model = genai.GenerativeModel(
            'gemini-2.5-flash',
            system_instruction=INSTRUCCIONES_SISTEMA
        )
        
        respuesta_ia = model.generate_content(mensaje)
        
        return Response({"respuesta": respuesta_ia.text}, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error en la API de Gemini: {e}")
        return Response({"error": "There was a connection problem with the support server."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    


@api_view(['POST'])
def generar_backup_manual(request):
    try:
        if os.name == 'nt': 
            ruta_script = r"C:\FincaBackups\automate_backup.bat"
        else:
            ruta_script = "/home/softtty2028/FincaBackups/automate_backup.sh"

        if not os.path.exists(ruta_script):
            return Response(
                {"error": f"No se encontró el script de backup en: {ruta_script}"}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        subprocess.run([ruta_script], check=True)
        
        return Response({"mensaje": "Copia de seguridad generada con éxito."}, status=status.HTTP_200_OK)
        
    except subprocess.CalledProcessError as e:
        return Response({"error": f"El script de backup falló al ejecutarse: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        return Response({"error": f"Error crítico al generar backup: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class SystemAlertViewSet(viewsets.ModelViewSet):
    queryset = SystemAlert.objects.filter(estado=1).order_by('-fecha_creacion')
    serializer_class = SystemAlertSerializer