from django.db import models

class Livestock(models.Model):
    # La llave primaria de tu diagrama
    id = models.AutoField(primary_key=True, db_column='ID_ganado')
    
    nombre = models.CharField(max_length=100, db_column='Nombre')
    fecha_nacimiento = models.DateField(db_column='Fecha_nacimiento', null=True, blank=True)
    edad = models.IntegerField(db_column='Edad', null=True, blank=True)
    peso = models.DecimalField(max_digits=7, decimal_places=2, db_column='Peso')
    raza = models.CharField(max_length=50, db_column='Raza')
    sexo = models.CharField(max_length=10, db_column='Sexo')
    id_madre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                                 db_column='ID_madre', related_name='hijos_madre')
    id_padre = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, 
                                 db_column='ID_padre', related_name='hijos_padre')
    
    metodo_obtencion = models.CharField(max_length=50, db_column='Metodo_obtencion', null=True, blank=True)

    class Meta:
        managed = False  
        db_table = 'Ganado'

    def __str__(self):
        return f"{self.nombre} - {self.raza}"


class Batch(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_batch')
    name = models.CharField(max_length=50, db_column='Name')
    description = models.CharField(max_length=200, db_column='Description', null=True)

    class Meta:
        managed = False
        db_table = 'Batch'

class FeedingLog(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_feeding')
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE, db_column='ID_batch')
    date = models.DateField(db_column='Date', auto_now_add=True)
    food_type = models.CharField(max_length=50, db_column='Food_Type')
    quantity_kg = models.DecimalField(max_digits=10, decimal_places=2, db_column='Quantity_kg')
    schedule = models.CharField(max_length=20, db_column='Schedule')
    observations = models.TextField(db_column='Observations', null=True)

    class Meta:
        managed = False
        db_table = 'Feeding_Log'
    

class HealthAction(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_accion')
    # Relación con la tabla Ganado
    animal = models.ForeignKey(Livestock, on_delete=models.CASCADE, db_column='ID_ganado')
    tipo_evento = models.CharField(max_length=100, db_column='Tipo_evento')
    dosis = models.CharField(max_length=50, db_column='Dosis')
    fecha = models.DateField(db_column='Fecha')
    observaciones = models.TextField(db_column='Observaciones', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'Acciones_sanitarias'