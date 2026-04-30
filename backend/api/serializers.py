from rest_framework import serializers
from .models import Livestock, Batch, FeedingLog, HealthAction, WeightControl

class LivestockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Livestock
        fields = '__all__' 



class BatchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Batch
        fields = '__all__'

class FeedingLogSerializer(serializers.ModelSerializer):   # Esto es para que en el GET veamos el nombre del lote, no solo el ID
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