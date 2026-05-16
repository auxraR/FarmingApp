from django.db import models

class Livestock(models.Model):
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
    estado = models.IntegerField(db_column='Estado', default=1)

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
    schedule = models.CharField(max_length=20, db_column='Schedule')
    observations = models.TextField(db_column='Observations', null=True)
    producto = models.ForeignKey('Products', models.DO_NOTHING, db_column='ID_producto', null=True)
    quantity_kg = models.DecimalField(db_column='Quantity_kg', max_digits=10, decimal_places=2)
    

    class Meta:
        managed = False
        db_table = 'Feeding_Log'
    

class HealthAction(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_accion')
    animal = models.ForeignKey(Livestock, on_delete=models.CASCADE, db_column='ID_ganado')
    tipo_evento = models.CharField(max_length=100, db_column='Tipo_evento')
    dosis = models.CharField(max_length=50, db_column='Dosis')
    fecha = models.DateField(db_column='Fecha')
    observaciones = models.TextField(db_column='Observaciones', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'Acciones_sanitarias'

class WeightControl(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_pesaje')
    animal = models.ForeignKey(Livestock, on_delete=models.CASCADE, db_column='ID_ganado')
    peso = models.DecimalField(max_digits=10, decimal_places=2, db_column='Peso')
    fecha = models.DateField(db_column='Fecha')

    class Meta:
        managed = False  
        db_table = 'Control_pesaje'


class MilkProduction(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_ordeño')
    animal = models.ForeignKey(Livestock, on_delete=models.CASCADE, db_column='ID_ganado')
    liters_produced = models.DecimalField(max_digits=10, decimal_places=2, db_column='Litros_producidos')
    date = models.DateTimeField(auto_now_add=True, db_column='Fecha')

    class Meta:
        managed = False
        db_table = 'Produccion_leche'
        ordering = ['-date']

    def __str__(self):
        return f"Milking of Animal #{self.animal_id} on {self.date}"

class Client(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_cliente')
    nombre = models.CharField(max_length=100, db_column='Nombre')
    apellido = models.CharField(max_length=100, db_column='Apellido')
    direccion = models.CharField(max_length=255, db_column='Direccion', null=True, blank=True)
    telefono = models.CharField(max_length=20, db_column='Telefono', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'Clientes'

class Products(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_producto')
    nombre = models.CharField(max_length=100, db_column='Nombre')
    unidad_medida = models.CharField(max_length=50, db_column='Unidad_medida') 
    precio_actual = models.DecimalField(max_digits=10, decimal_places=2, db_column='Precio_actual')
    stock = models.DecimalField(max_digits=10, decimal_places=2, db_column='Stock')
    categoria = models.CharField(max_length=50, db_column='Categoria', default='Venta')

    class Meta:
        managed = False
        db_table = 'Productos'

class Sales(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_venta')
    client = models.ForeignKey(Client, on_delete=models.DO_NOTHING, db_column='ID_cliente')
    sale_date = models.DateTimeField(auto_now_add=True, db_column='Fecha_venta')
    total = models.DecimalField(max_digits=12, decimal_places=2, db_column='Total')
    status = models.CharField(max_length=50, db_column='Estado', default='Completada')

    class Meta:
        managed = False
        db_table = 'Ventas'

class SalesDetails(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_detalle')
    venta = models.ForeignKey(Sales, related_name='detalles', on_delete=models.CASCADE, db_column='ID_venta')
    tipo_item = models.CharField(max_length=50, db_column='Tipo_item') # 'Producto' o 'Ganado'
    producto = models.ForeignKey(Products, null=True, blank=True, on_delete=models.DO_NOTHING, db_column='ID_producto')
    ganado = models.ForeignKey('Livestock', null=True, blank=True, on_delete=models.DO_NOTHING, db_column='ID_ganado')
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, db_column='Cantidad')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, db_column='Subtotal')
    observaciones = models.CharField(max_length=255, null=True, blank=True, db_column='Observaciones')

    class Meta:
        managed = False
        db_table = 'Detalle_venta'



class Salida(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_salida')
    ganado = models.ForeignKey(Livestock, on_delete=models.DO_NOTHING, db_column='ID_ganado')
    fecha_salida = models.DateField(db_column='Fecha_salida', auto_now_add=True)
    motivo_salida = models.CharField(max_length=50, db_column='Motivo_salida')
    observaciones = models.CharField(max_length=255, db_column='Observaciones', null=True, blank=True)
    venta = models.ForeignKey('Sales', on_delete=models.DO_NOTHING, db_column='ID_venta', null=True, blank=True)

    class Meta:
        managed = False
        db_table = 'Salidas'


class InventoryMovement(models.Model):
    id = models.AutoField(primary_key=True, db_column='ID_movimiento')
    producto = models.ForeignKey('Products', on_delete=models.CASCADE, db_column='ID_producto')
    tipo_movimiento = models.CharField(max_length=20, db_column='Tipo_movimiento') # 'Entrada' o 'Salida'
    cantidad = models.DecimalField(max_digits=10, decimal_places=2, db_column='Cantidad')
    costo_unitario = models.DecimalField(max_digits=10, decimal_places=2, db_column='Costo_Unitario', null=True, blank=True)
    fecha_movimiento = models.DateTimeField(auto_now_add=True, db_column='Fecha_movimiento')
    motivo = models.CharField(max_length=100, db_column='Motivo')
    observaciones = models.CharField(max_length=255, db_column='Observaciones', null=True, blank=True)

    class Meta:
        managed = False 
        db_table = 'Movimientos_Inventario'