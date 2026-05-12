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
    Salida
)

class LivestockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livestock
        fields = '__all__' 



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