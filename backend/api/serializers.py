from rest_framework import serializers

from .models import (
    Livestock,
    Batch,
    FeedingLog,
    HealthAction,
    WeightControl,
    MilkProduction,
    Client,
    Products,
    Sales,
    SalesDetails,
    Salida,
    InventoryMovement,
    MarketPrice
)

class LivestockSerializer(serializers.ModelSerializer):
    valor_estimado = serializers.SerializerMethodField()
    batch_name = serializers.SerializerMethodField()
    categoria_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Livestock
        fields = '__all__' 
    def get_valor_estimado(self, obj):
        if getattr(obj, 'valor_manual', None):
            return float(obj.valor_manual)
        if getattr(obj, 'peso', None) and getattr(obj, 'categoria', None):
            precio_kilo = float(getattr(obj.categoria, 'precio', getattr(obj.categoria, 'precio_kg', 0)))
            resultado = float(obj.peso) * precio_kilo
            return "{:,.2f}".format(resultado)
            
        return 0.0

    def get_batch_name(self, obj):
        if getattr(obj, 'batch', None):
            return getattr(obj.batch, 'name', 'No Group')
        return 'No Group'

    def get_categoria_nombre(self, obj):
        if getattr(obj, 'categoria', None):
            return getattr(obj.categoria, 'categoria', 'Unassigned')
        return 'Unassigned'

class MarketPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketPrice
        fields= '__all__'

class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

class FeedingLogSerializer(serializers.ModelSerializer):  
    batch_name = serializers.ReadOnlyField(source='batch.name')

    class Meta:
        model = FeedingLog
        fields = '__all__'


class HealthActionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HealthAction
        fields = '__all__'


class WeightControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = WeightControl
        fields = '__all__'

class MilkProductionSerializer(serializers.ModelSerializer):
    animal_name = serializers.CharField(source='animal.nombre', read_only=True)
    
    class Meta:
        model = MilkProduction
        fields = ['id', 'animal', 'animal_name', 'liters_produced', 'date']


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Products
        fields = '__all__'


class SalesDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesDetails
        fields = ['tipo_item', 'producto', 'ganado', 'cantidad', 'subtotal', 'observaciones']

class SalesSerializer(serializers.ModelSerializer):
    detalles = SalesDetailSerializer(many=True)

    class Meta:
        model = Sales
        fields = ['id', 'client', 'sale_date', 'total', 'status', 'detalles']

    def create(self, validated_data):
        detalles_data = validated_data.pop('detalles')
        
        venta = Sales.objects.create(**validated_data)
        
        for detalle in detalles_data:
            SalesDetails.objects.create(venta=venta, **detalle)
            
            if detalle.get('tipo_item') == 'Ganado' and detalle.get('ganado'):
                animal = detalle['ganado']
                animal.estado = 0 
                animal.save()
                
            if detalle.get('tipo_item') == 'Producto' and detalle.get('producto'):
                cantidad_vendida = detalle.get('cantidad', 1)
                subtotal = detalle.get('subtotal', 0)
            
                precio_unitario = subtotal / cantidad_vendida if cantidad_vendida > 0 else 0
                
                InventoryMovement.objects.create(
                    producto=detalle['producto'],
                    tipo_movimiento='Salida',
                    cantidad=cantidad_vendida,
                    costo_unitario=precio_unitario,
                    motivo='Venta',
                    observaciones=f'Venta Factura #{venta.id}'
                )

        return venta
    
class SalidaSerializer(serializers.ModelSerializer):
    animal_nombre = serializers.ReadOnlyField(source='ganado.nombre')
    animal_id_tag = serializers.ReadOnlyField(source='ganado.id')

    class Meta:
        model = Salida
        fields = [
            'id', 'ganado', 'animal_nombre', 'animal_id_tag', 
            'fecha_salida', 'motivo_salida', 'observaciones', 'venta'
        ]

class InventoryMovementSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.ReadOnlyField(source='producto.nombre')
    unidad_medida = serializers.ReadOnlyField(source='producto.unidad_medida')

    class Meta:
        model = InventoryMovement
        fields = '__all__'