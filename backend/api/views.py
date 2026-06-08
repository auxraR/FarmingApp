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


load_dotenv()


genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

INSTRUCCIONES_SISTEMA = """
Eres 'CowBot', el asistente de soporte técnico exclusivo del 'Sistema de Gestión de la finca Flor de Maria'.
Tu ÚNICO propósito es ayudar al usuario a entender los módulos del sistema y resolver errores. No respondas preguntas fuera de este contexto.

Conocimiento de la Arquitectura del Sistema:
- El sistema utiliza "Borrado Lógico" (archiva u oculta los registros en lugar de borrarlos físicamente) para que la contabilidad y el Kardex nunca se desajusten.
- Para Cerrar Sesión (Logout), el usuario debe usar el botón en la parte inferior del menú lateral.

Los módulos del sistema (Sidebar) son:
1. Dashboard: Panel principal con KPIs (Total Assets, Income, Expenses). Filtra automáticamente datos archivados.
2. Livestock (Ganado): Registro del catálogo de animales, raza y sexo.
3. Feeding (Alimentación): Asignación de raciones a grupos. Valida que haya stock en inventario.
4. Health (Salud): Registro de peso y vacunas. Regla estricta: Las vacunas fuertes exigen 180 días de espera entre dosis.
5. Production (Producción): Registro de litros de leche ordeñados diariamente.
6. Sales (Ventas): Registro de ventas (animales o leche) a los clientes. Ingresa dinero a Finanzas.
7. Finances (Finanzas): Resumen de flujo de caja y tendencias (Solo Gerencia).
8. Inventory (Inventario): Kardex automatizado (Entradas y Salidas). Alimenta y descuenta stock real.
9. Outflow (Salidas): Registro de bajas por muerte, robo o escape. Oculta al animal. Se puede revertir si fue un error.
10. Reports (Reportes): Generación de informes en PDF (Solo Gerencia).
11. Settings (Configuración): Gestión de grupos, precios, directorio de clientes y el panel de Seguridad (Copias de Seguridad / Backups manuales y automáticos).

Tus reglas de comportamiento:
- Si el usuario pregunta "cómo hago para..." o "por qué no me deja...", explícale el paso a paso dentro del módulo correspondiente.
- Responde siempre de forma MUY BREVE y al grano. Un detallito no más. Máximo 2 o 3 líneas cortas.
- Usa un tono amigable pero profesional y si el usario habla ingles, responde en ingles.
-No es obligatorio con cada mensaje pero puedes agregar una mini bromita o algo como unca vaca, porque realmente eres un chatbot pero simulando que eres una vaca osea puedes poner "MOOOOO" en varios mensajes como una vaca
"""

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

            # 👻 FIX: Filtramos por estado=1 para ignorar compras archivadas
            gastos_totales = InventoryMovement.objects.filter(
                estado=1,
                tipo_movimiento='Entrada', 
                motivo__icontains='Compra'
            ).aggregate(total=Sum('costo_unitario'))['total'] or 0.0
            
            gastos_totales = float(gastos_totales)

            # 👻 FIX: Filtramos por estado=1 para ignorar ventas archivadas
            ingresos_totales = InventoryMovement.objects.filter(
                estado=1,
                tipo_movimiento='Salida',
                motivo__icontains='Venta'
            ).aggregate(total=Sum(F('cantidad') * F('producto__precio_actual')))['total'] or 0.0
            
            ingresos_totales = float(ingresos_totales)

            dinero_en_caja = saldo_inicial + ingresos_totales - gastos_totales

            # El ganado ya tenía el filtro correctamente
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
            print("\n" + "="*40)
            print("ERROR EN EL ENDPOINT DE FINANZAS:")
            print(repr(e))
            print("="*40 + "\n")
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

            # --- 1. CÁLCULO DE INGRESOS Y EGRESOS ---
            movimientos_entrada = InventoryMovement.objects.filter(tipo_movimiento='Entrada', fecha_movimiento__range=[desde, hasta])
            gastos = float(movimientos_entrada.aggregate(total=Sum('costo_unitario'))['total'] or 0.0)
            
            movimientos_salida = InventoryMovement.objects.filter(tipo_movimiento='Salida', fecha_movimiento__range=[desde, hasta])
            ingresos = float(movimientos_salida.aggregate(total=Sum(F('cantidad') * F('producto__precio_actual')))['total'] or 0.0)

            detalle_ingresos = [
                {'concepto': 'Venta de Leche', 'monto': ingresos * 0.4}, 
                {'concepto': 'Venta de Ganado', 'monto': ingresos * 0.6},
            ] if ingresos > 0 else []

            detalle_egresos = [
                {'concepto': 'Alimentación (Concentrado)', 'monto': gastos * 0.7},
                {'concepto': 'Medicamentos y Vacunas', 'monto': gastos * 0.3},
            ] if gastos > 0 else []

            # --- 2. CÁLCULO DE PÉRDIDAS ANIMALES ---
            animales_perdidos = Livestock.objects.filter(estado=0) 
            total_perdidas_valor = sum(float(animal.valor_estimado or 0) for animal in animales_perdidos)
            cantidad_perdidas = animales_perdidos.count()

            # --- 3. CÁLCULO DEL CAPITAL TOTAL ---
            caja_obj = CashRegister.objects.order_by('-fecha_registro').first()
            saldo_inicial = float(caja_obj.saldo_inicial) if caja_obj else 0.0
            
            dinero_en_caja = saldo_inicial + ingresos - gastos
            inventario_ganado_vivo = sum(float(animal.valor_estimado or 0) for animal in Livestock.objects.filter(estado=1))
            inventario_bodega = float(Products.objects.aggregate(total=Sum(F('stock') * F('precio_actual')))['total'] or 0.0)
            
            capital_total = dinero_en_caja + inventario_ganado_vivo + inventario_bodega

            # --- 4. PRODUCCIÓN DE LECHE (Ajustado al modelo MilkProduction) ---
            dias_rango = (hasta - desde).days
            dias_rango = dias_rango if dias_rango > 0 else 1
            semanas_rango = max(1, dias_rango / 7)

            # Usamos 'date' en lugar de 'fecha'
            producciones_qs = MilkProduction.objects.filter(date__range=[desde, hasta])

            # Usamos 'liters_produced' en lugar de 'litros'
            total_leche = float(producciones_qs.aggregate(total=Sum('liters_produced'))['total'] or 0.0)
            promedio_semanal = round(total_leche / semanas_rango, 2)

            # Agrupamos por 'date'
            prod_diaria = producciones_qs.values('date').annotate(total_litros=Sum('liters_produced')).order_by('date')
            grafica_produccion = [
                {
                    'fecha': item['date'].strftime('%d %b'), 
                    'litros': float(item['total_litros'])
                } 
                for item in prod_diaria
            ]

            tabla_produccion = []
            # Ordenamos por '-date' (descendente)
            for p in producciones_qs.order_by('-date'):
                # Accedemos a la relación con 'animal' en lugar de 'vaca'
                identificador_vaca = getattr(p.animal, 'nombre', getattr(p.animal, 'tag', f"ID: {p.animal.id}"))
                
                tabla_produccion.append({
                    'fecha': p.date.strftime('%Y-%m-%d'),
                    'vaca': f"Vaca {identificador_vaca}",
                    'litros': float(p.liters_produced)
                })

          # A. Tabla de Sanidad (Vacunas, vitaminas, etc.)
            sanidad_qs = HealthAction.objects.filter(fecha__range=[desde, hasta]).order_by('-fecha')
            tabla_sanidad = []
            for s in sanidad_qs:
                identificador = getattr(s.animal, 'nombre', getattr(s.animal, 'tag', f"ID: {s.animal.id}"))
                tabla_sanidad.append({
                    'fecha': s.fecha.strftime('%Y-%m-%d'),
                    'vaca': f"Vaca {identificador}",
                    'evento': s.tipo_evento,
                    'dosis': s.dosis
                })

            # B. Tabla de Pesajes
            peso_qs = WeightControl.objects.filter(fecha__range=[desde, hasta])
            tabla_peso = []
            for w in peso_qs.order_by('-fecha'):
                identificador = getattr(w.animal, 'nombre', getattr(w.animal, 'tag', f"ID: {w.animal.id}"))
                tabla_peso.append({
                    'fecha': w.fecha.strftime('%Y-%m-%d'),
                    'vaca': f"Vaca {identificador}",
                    'peso': float(w.peso)
                })

            # C. Gráfica de Progreso de Peso (Promedio del hato por fecha de pesaje)
            peso_diario = peso_qs.values('fecha').annotate(promedio_peso=Avg('peso')).order_by('fecha')
            grafica_peso = [
                {
                    'fecha': item['fecha'].strftime('%d %b'), 
                    'peso': round(float(item['promedio_peso']), 2)
                } 
                for item in peso_diario
            ]

            # D. Cálculo del % de Crecimiento
            crecimiento_pct = 0.0
            if len(grafica_peso) > 1:
                peso_inicial = grafica_peso[0]['peso']
                peso_final = grafica_peso[-1]['peso']
                if peso_inicial > 0:
                    crecimiento_pct = round(((peso_final - peso_inicial) / peso_inicial) * 100, 2)
            
            # A. Historial de Movimientos
            movimientos_qs = InventoryMovement.objects.filter(fecha_movimiento__range=[desde, hasta]).order_by('fecha_movimiento')
            
            tabla_movimientos = []
            inventario_diario = {}
            total_entradas_qty = 0
            total_salidas_qty = 0

            for m in movimientos_qs:
                # Agrupamos por día para la gráfica
                fecha_str = m.fecha_movimiento.strftime('%d %b')
                tipo = m.tipo_movimiento
                cant = float(m.cantidad)
                
                if fecha_str not in inventario_diario:
                    inventario_diario[fecha_str] = {'fecha': fecha_str, 'Entradas': 0, 'Salidas': 0}
                
                if tipo == 'Entrada':
                    inventario_diario[fecha_str]['Entradas'] += cant
                    total_entradas_qty += cant
                else:
                    inventario_diario[fecha_str]['Salidas'] += cant
                    total_salidas_qty += cant
                    
                # Llenamos la tabla de movimientos
                tabla_movimientos.append({
                    'fecha': m.fecha_movimiento.strftime('%Y-%m-%d'),
                    'producto': m.producto.nombre,
                    'tipo': tipo,
                    'cantidad': cant,
                    'motivo': m.motivo
                })
                
            grafica_inventario = list(inventario_diario.values())
            # Invertimos la tabla para que los últimos movimientos salgan primero
            tabla_movimientos.reverse()

            # B. Productos Activos (Stock Actual)
            productos_qs = Products.objects.all().order_by('categoria', 'nombre')
            tabla_productos = []
            for p in productos_qs:
                tabla_productos.append({
                    'nombre': p.nombre,
                    'categoria': p.categoria,
                    'stock': float(p.stock),
                    'unidad': p.unidad_medida,
                    'precio': float(p.precio_actual)
                })

            # --- 6. EMPAQUETAR JSON (Actualizado) ---
            report_data = {
                'periodo': {'desde': desde_str, 'hasta': hasta_str},
                'kpis': {
                    'ganancia_neta': ingresos - gastos,
                    'ingresos_brutos': ingresos,
                    'gastos_operativos': gastos,
                    'capital_total': capital_total,
                    'perdidas_animales': total_perdidas_valor,
                    'cantidad_perdidas': cantidad_perdidas,
                    'total_animales': Livestock.objects.filter(estado=1).count(),
                    'produccion_leche': total_leche, 
                    'promedio_semanal_leche': promedio_semanal,
                    'rentabilidad': round(((ingresos - gastos) / ingresos * 100), 1) if ingresos > 0 else 0.0,
                    'tratamientos_aplicados': sanidad_qs.count(), # Nuevo KPI
                    'crecimiento_peso_pct': crecimiento_pct,
                    'inventario_entradas': total_entradas_qty, # NUEVO
                    'inventario_salidas': total_salidas_qty   # NUEVO     # Nuevo KPI

                },
                'tablas': {
                    'ingresos': detalle_ingresos,
                    'egresos': detalle_egresos,
                    'produccion_detalle': tabla_produccion,
                    'sanidad_detalle': tabla_sanidad,             # Nueva Tabla
                    'peso_detalle': tabla_peso,                    # Nueva Tabla
                    'movimientos_detalle': tabla_movimientos,  # NUEVO
                    'productos_activos': tabla_productos       # NUEVO
                },
                'graficas': {
                    'produccion_leche': grafica_produccion,
                    'progreso_peso': grafica_peso,                # Nueva Gráfica
                    'flujo_inventario': grafica_inventario     # NUEVO
                },
                'alertas': []
            }

            return Response(report_data, status=status.HTTP_200_OK)

        except Exception as e:
            print("\nERROR GENERANDO REPORTE:")
            print(repr(e))
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        

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
        ruta_script = r"C:\FincaBackups\automate_backup.bat"
        
        subprocess.run([ruta_script], check=True, shell=True)
        
        return Response({"mensaje": "Copia de seguridad generada con éxito."}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Error al generar backup: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)