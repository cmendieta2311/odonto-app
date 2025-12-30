Actuá como un arquitecto de software senior especializado en sistemas médicos y contables.

Necesito diseñar un sistema de gestión para un consultorio odontológico que trabaja con:
- Catálogo amplio de servicios odontológicos
- Presupuestos detallados
- Tratamientos financiados
- Facturación por cobranza

STACK OBLIGATORIO:
- Frontend: Angular 20 (standalone components, signals, Angular Material)
- Backend: NestJS (arquitectura modular, DTOs, ValidationPipe)
- Base de datos: PostgreSQL
- ORM: Prisma o TypeORM
- Autenticación: JWT
- Roles: ADMIN, RECEPCION, ODONTOLOGO

MODELO DE NEGOCIO REAL:
La clínica posee un catálogo de servicios odontológicos organizados por categorías
(ej.: operatoria dental, ortodoncia, prótesis, cirugía, laboratorio, etc.), cada servicio tiene:
- Código
- Descripción
- Precio
- Tipo (consultorio / laboratorio / tercerizado)

FLUJO FUNCIONAL OBLIGATORIO:

1. PRESUPUESTO (QUOTE)
- Se crea un presupuesto seleccionando uno o varios servicios del catálogo
- Cada presupuesto tiene múltiples ítems (servicio, precio, cantidad)
- El presupuesto puede incluir opciones de financiación
- Estados: DRAFT, APPROVED, REJECTED, CONVERTED
- NO genera impacto contable

2. PROFORMA (OPCIONAL - DOCUMENTO INFORMATIVO)
- Es un documento preliminar, informativo, SIN obligación legal
- Muestra las condiciones estimadas de un tratamiento/financiamiento
- Se puede generar desde un presupuesto para mostrar al paciente
- NO tiene impacto contable
- NO es obligatorio en el flujo

3. CONTRATO (CONTRACT)
- Si el paciente acepta el presupuesto, se genera un contrato FIRMADO
- El contrato define:
  - Total del tratamiento
  - Forma de pago (contado o crédito)
  - Cantidad de cuotas (si es crédito)
  - Fecha de inicio
- Al crear el contrato, automáticamente se genera el PLAN DE PAGOS (CreditSchedule)
- El contrato marca el presupuesto como CONVERTED
- NO se factura al firmar contrato

4. PLAN DE PAGOS (CREDIT_SCHEDULE)
- Se genera automáticamente al crear un contrato con financiación
- Cada cuota tiene:
  - Fecha de vencimiento
  - Monto
  - Estado (PENDING, PAID, OVERDUE)
- Representa las CUENTAS A COBRAR internas
- NO es un documento fiscal

5. TRATAMIENTO (SERVICE_PERFORMED)
- Se registran los servicios realizados al paciente
- Vinculados al contrato
- Control de qué servicios del presupuesto ya fueron ejecutados

6. PAGOS (PAYMENT)
- El paciente realiza pagos que se aplican contra el plan de pagos:
  - Pago de cuota mensual
  - Pagos parciales
  - Adelantos
- Cada pago actualiza el estado de las cuotas en el plan de pagos
- Cada pago se registra individualmente

7. FACTURA / RECIBO (INVOICE)
- Por cada pago registrado se genera:
  - Factura o recibo fiscal
- La factura está asociada a:
  - Un pago específico
  - Un contrato
- Es el ÚNICO documento con impacto contable
- Cancela/aplica contra las cuentas a cobrar

REGLAS CONTABLES CLAVE:
- Nunca generar factura sin pago
- Un pago genera una sola factura o recibo
- El total facturado no puede superar el total del contrato
- Los servicios no generan facturación directa

ENTIDADES OBLIGATORIAS:
- Patient
- ServiceCategory
- Service
- Quote
- QuoteItem
- Contract
- Proforma
- ProformaItem
- CreditSchedule (cuotas)
- Payment
- InvoiceOrReceipt
- ServicePerformed

ENTREGABLES ESPERADOS:
1. Modelo entidad-relación
2. Diseño de base de datos PostgreSQL
3. Arquitectura NestJS por módulos
4. Endpoints REST principales
5. Flujo transaccional pago → factura
6. Ejemplos de código
7. Buenas prácticas contables
