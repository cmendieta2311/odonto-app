# Facturación y Pagos

Este módulo centraliza todas las operaciones financieras de la clínica.

> [!NOTE]
> Actualmente el sistema emite **Recibos de Dinero** como comprobante de pago. La emisión de **Facturas Legales** (electrónicas o preimpresas) está en desarrollo y estará disponible próximamente.

## 1. Documentos Emitidos
En la sección **"Documentos Emitidos"** verás el historial de todos los recibos y comprobantes generados.
*   **Estado**: Identifica rápidamente si un documento está *Pagado* (Verde), *Pendiente* (Amarillo) o *Cancelado* (Gris).
*   **Acciones**:
    *   **Registrar Cobro**: Haz clic en el icono de billetes (verde) para registrar un pago sobre un saldo pendiente.
    *   **Ver Detalle**: Accede a la vista completa del recibo para imprimirlo o descargarlo.

## 2. Registrar Cobros
La pantalla de **"Registro de Pagos"** está diseñada para cobrar tratamientos complejos o múltiples cuotas a la vez.

1.  **Buscar Paciente**: Ingresa el nombre o documento.
2.  **Ver Deuda**: El sistema mostrará automáticamente el "Saldo Total Pendiente" y desglosará los tratamientos y cuotas (si hay financiación).
3.  **Seleccionar qué pagar**:
    *   Puedes marcar tratamientos completos.
    *   O desplegar un plan y seleccionar cuotas individuales.
    *   ¡Incluso puedes ingresar un pago parcial! (Ej: El paciente debe 500.000 pero entrega 200.000 a cuenta).
4.  **Confirmar**: Ingresa el monto recibido, el método de pago (Efectivo, Tarjeta, QR) y guarda. El sistema generará un recibo automáticamente.

## 3. Gestión de Caja
El control de flujo de dinero diario se realiza en el **Dashboard de Caja**.

### Flujo Diario
1.  **Apertura**: Al inicio del día, debes hacer clic en **"Abrir Caja"** e indicar el saldo inicial (cambio) con el que empiezas.
2.  **Movimientos**:
    *   Los cobros a pacientes se registran automáticamente como *Ingresos*.
    *   Si necesitas sacar dinero (ej: comprar insumos de limpieza), usa el botón **"Registrar Movimiento"** > Tipo **"Egreso"**.
3.  **Cierre**: Al finalizar la jornada, selecciona **"Cerrar Caja"**. El sistema calculará cuánto dinero debería haber (Saldo Inicial + Ingresos - Egresos). Debes contar el dinero físico e ingresarlo para verificar si hay faltantes o sobrantes.

### Reportes
*   **Exportar del día**: Genera un PDF con el resumen de todos los movimientos de la jornada, ideal para rendición de cuentas.
*   **Historial**: Consulta cierres de días anteriores.
