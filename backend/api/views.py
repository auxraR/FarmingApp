from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Livestock, Batch, FeedingLog, HealthAction
from .serializers import LivestockSerializer, BatchSerializer, FeedingLogSerializer, HealthActionSerializer

class LivestockViewSet(viewsets.ModelViewSet):
    queryset = Livestock.objects.all().order_by('-id')
    serializer_class = LivestockSerializer
    
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    
    search_fields = ['id', 'nombre']


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

class FeedingLogViewSet(viewsets.ModelViewSet):
    queryset = FeedingLog.objects.all().order_by('-date', '-id')
    serializer_class = FeedingLogSerializer

class HealthActionViewSet(viewsets.ModelViewSet):
    # Esto permite filtrar las acciones por animal desde la URL
    serializer_class = HealthActionSerializer

    def get_queryset(self):
        queryset = HealthAction.objects.all().order_by('-fecha')
        animal_id = self.request.query_params.get('animal_id', None)
        if animal_id is not None:
            queryset = queryset.filter(animal_id=animal_id)
        return queryset