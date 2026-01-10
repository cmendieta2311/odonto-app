import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Seed Default Tenant
    await prisma.tenant.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            name: 'Clinica Dental Default',
            description: 'Tenant por defecto',
            status: 'ACTIVE',
        },
    });

    const adminEmail = 'admin@sgodonto.com';
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Administrador',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });
    console.log({ admin });

    // Seed Person Document Types
    const documentTypes = [
        { code: 'CI', name: 'Cédula de Identidad' },
        { code: 'RUC', name: 'Registro Único del Contribuyente' },
        { code: 'PASS', name: 'Pasaporte' },
    ];

    for (const doc of documentTypes) {
        await prisma.personDocumentType.upsert({
            where: {
                tenantId_code: {
                    tenantId: 'default',
                    code: doc.code,
                },
            },
            update: {
                name: doc.name,
            },
            create: {
                tenantId: 'default',
                code: doc.code,
                name: doc.name,
            },
        });
    }

    // Seed Service Areas & Categories
    const catalog = [
        {
            area: 'OPERATORIA DENTAL',
            categories: [
                {
                    name: 'RESTAURACIONES ANTERIORES',
                    services: [
                        { code: '15', name: 'Anterior clase III caries', price: 300000, type: 'CONSULTORIO' },
                        { code: '26', name: 'Anterior clase IV caries', price: 400000, type: 'CONSULTORIO' },
                        { code: '223', name: 'Anterior palatino compleja caries', price: 450000, type: 'CONSULTORIO' },
                        { code: '08', name: 'Anterior caries simple', price: 250000, type: 'CONSULTORIO' },
                        { code: '304', name: 'Restauración estética anterior con resina', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'RESTAURACIONES POSTERIORES (EN CONSULTORIO)',
                    services: [
                        { code: '16', name: 'Posterior molar compleja caries', price: 450000, type: 'CONSULTORIO' },
                        { code: '233', name: 'Posterior molar oclusal simple caries', price: 300000, type: 'CONSULTORIO' },
                        { code: '17', name: 'Caries occlusal compleja PREMOLAR', price: 300000, type: 'CONSULTORIO' },
                        { code: '173', name: 'Caries occlusal simple PREMOLAR', price: 250000, type: 'CONSULTORIO' },
                        { code: '50', name: 'Caries M/D (Clase II)', price: 350000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'RESTAURACIONES POSTERIORES ( LABORATORIO)',
                    services: [
                        { code: '97', name: 'Posterior molar INLAY CARIES CEROMERO (LABORATORIO)', price: 700000, type: 'LABORATORIO' },
                        { code: '52', name: 'Posterior molar INLAY CARIES PORCELANA (LABORATORIO)', price: 1500000, type: 'LABORATORIO' },
                        { code: '66', name: 'Posterior molar ONLAY CARIES CEROMERO (LABORATORIO)', price: 850000, type: 'LABORATORIO' },
                        { code: '49', name: 'Posterior molar ONLAY CARIES PORCELANA', price: 1850000, type: 'LABORATORIO' },
                        { code: '222', name: 'Posterior molar OVERLAY CARIES CERÓMERO', price: 1000000, type: 'LABORATORIO' },
                        { code: '43', name: 'Posterior molar OVERLAY CARIES PORCELANA', price: 2200000, type: 'LABORATORIO' },
                        { code: '172', name: 'Incrustación dientes posteriores cerómero (premolar)', price: 900000, type: 'LABORATORIO' },
                        { code: '42', name: 'Incrustación dientes posteriores porcelana (LABORATORIO)', price: 1200000, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: 'OTRAS RESTAURACIONES',
                    services: [
                        { code: '224', name: 'Obturación cervical', price: 300000, type: 'CONSULTORIO' },
                        { code: '225', name: 'Obturación con ionómero', price: 350000, type: 'CONSULTORIO' },
                        { code: '221', name: 'Reconstrucción de ángulo diente permanente', price: 350000, type: 'CONSULTORIO' },
                        { code: '29', name: 'Carilla anterior con resina (in situ)', price: 0, type: 'CONSULTORIO' },
                        { code: '47', name: 'Carilla porcelana pura PPD', price: 0, type: 'CONSULTORIO' },
                        { code: '28', name: 'Cirugía simple apartir de 2 raíces', price: 300000, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'CIRUGÌA BUCAL',
            categories: [
                {
                    name: 'General',
                    services: [
                        { code: '07', name: 'Cirugía complicada', price: 450000, type: 'CONSULTORIO' },
                        { code: '88', name: 'Resto radicular', price: 200000, type: 'CONSULTORIO' },
                        { code: '56', name: 'Cirugía diente uniradicular', price: 300000, type: 'CONSULTORIO' },
                        { code: 'CB-001', name: 'Exodoncia diente periodontal', price: 0, type: 'CONSULTORIO' },
                        { code: 'CB-002', name: 'Diente Supernumerario (erupcionado)', price: 0, type: 'CONSULTORIO' },
                        { code: 'CB-003', name: 'Diente Supernumerario (sin erupcionar)', price: 0, type: 'CONSULTORIO' },
                        { code: '53', name: 'Cirugía diente retenido (extracción)', price: 0, type: 'CONSULTORIO' },
                        { code: 'CB-004', name: 'Cirugía diente retenido (p/traccionar)', price: 0, type: 'CONSULTORIO' },
                        { code: '189', name: 'Cirugía de corte frenillo labial', price: 0, type: 'CONSULTORIO' },
                        { code: '21', name: 'Cirugía de corte frenillo lingual', price: 0, type: 'CONSULTORIO' },
                        { code: '156', name: 'Toma de muestra para biopsia', price: 0, type: 'CONSULTORIO' },
                        { code: '189-B', name: 'Corte frenillo labial y lingual', price: 0, type: 'CONSULTORIO' },
                        { code: '13', name: 'Gingivectomia con corte', price: 0, type: 'CONSULTORIO' },
                        { code: '188', name: 'Ostectomía', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'TERCEROS MOLARES',
                    services: [
                        { code: '69', name: 'Tercer molar superior sin erupcionar', price: 150000, type: 'CONSULTORIO' },
                        { code: '33', name: 'Tercer molar superior impactado', price: 150000, type: 'CONSULTORIO' },
                        { code: '166', name: 'Tercer molar superior erupcionado', price: 850000, type: 'CONSULTORIO' },
                        { code: '23', name: 'Tercer molar inferior sin erupcionar', price: 1700000, type: 'CONSULTORIO' },
                        { code: '230', name: 'Tercer molar inferior impactado', price: 1700000, type: 'CONSULTORIO' },
                        { code: '75', name: 'Tercer molar inferior erupcionado', price: 950000, type: 'CONSULTORIO' },
                        { code: '44', name: 'Germenectomía', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'ENDODONCIA',
            categories: [
                {
                    name: '1. MANUAL',
                    services: [
                        { code: '144', name: 'Endodoncia dientes anteriores', price: 0, type: 'CONSULTORIO' },
                        { code: '165', name: 'Endodoncia premolares', price: 0, type: 'CONSULTORIO' },
                        { code: '152', name: 'Endodoncia molar', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '1.1. RETRATAMIENTOS (manual)',
                    services: [
                        { code: '110', name: 'Dientes anteriores', price: 0, type: 'CONSULTORIO' },
                        { code: '161', name: 'Premolares', price: 0, type: 'CONSULTORIO' },
                        { code: '102', name: 'Molares', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '2. MECANIZADA',
                    services: [
                        { code: '151', name: 'Endodoncia anterior', price: 500000, type: 'CONSULTORIO' },
                        { code: '333', name: 'Endodoncia premolar', price: 700000, type: 'CONSULTORIO' },
                        { code: '32', name: 'Endodoncia molar', price: 1200000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '2.2. RETRATAMIENTO (MECANIZADA)',
                    services: [
                        { code: '158', name: 'En dientes anteriores', price: 700000, type: 'CONSULTORIO' },
                        { code: '113', name: 'En premolares', price: 900000, type: 'CONSULTORIO' },
                        { code: '115', name: 'En molares', price: 1600000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '3. POS ENDODONCIA',
                    services: [
                        { code: '46', name: 'Blanqueamiento interno', price: 500000, type: 'CONSULTORIO' },
                        { code: '441', name: 'Perno metálico articulado por pieza dentaria', price: 600000, type: 'CONSULTORIO' },
                        { code: '111', name: 'Perno metálico simple por pieza dentaria', price: 400000, type: 'CONSULTORIO' },
                        { code: '555', name: 'Perno fibra de vidrio por pieza dentaria', price: 350000, type: 'CONSULTORIO' },
                        { code: '101', name: 'Endocrown cerómero (LABORATORIO)', price: 1500000, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: 'OTROS',
                    services: [
                        { code: '024', name: 'Urgencia endodontica', price: 400000, type: 'CONSULTORIO' },
                        { code: '155', name: 'Medicación (sin obturación, con provisorio)', price: 250000, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'ORTODONCIA',
            categories: [
                {
                    name: '1.ESTUDIOS PREVIOS',
                    services: [
                        { code: '72', name: 'Modelo de estudio', price: 250000, type: 'CONSULTORIO' },
                        { code: 'ORT-001', name: 'Radiografía panorámica', price: 0, type: 'TERCERIZADO' },
                        { code: 'ORT-002', name: 'Radiografía lateral', price: 0, type: 'TERCERIZADO' },
                    ]
                },
                {
                    name: '2. INSTALACION',
                    services: [
                        { code: '171', name: 'Convencional metálico superior e inferior', price: 2000000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '3.CONVENCIONAL',
                    services: [
                        { code: '55', name: 'Ortodoncia convencional metálico x 12', price: 2000000, type: 'CONSULTORIO' },
                        { code: '02', name: 'Ortodoncia convencional metálico x 24', price: 4000000, type: 'CONSULTORIO' },
                        { code: '444', name: 'Ortodoncia convencional metálico x 36', price: 5400000, type: 'CONSULTORIO' },
                        { code: '24', name: 'Bracket convencional metálico por pieza', price: 30000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '4.AUTOLIGADO',
                    services: [
                        { code: '103', name: 'Ortodoncia autoligado metálico x 12', price: 4000000, type: 'CONSULTORIO' },
                        { code: '104', name: 'Ortodoncia autoligado metálico x 24', price: 7600000, type: 'CONSULTORIO' },
                        { code: '108', name: 'Ortodoncia autoligado metálico x 36', price: 1200000, type: 'CONSULTORIO' },
                        { code: '7', name: 'Bracket autoligado metálico por pieza', price: 100000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '5.ESTETICO',
                    services: [
                        { code: '06', name: 'Ortodoncia convencional bracket estético x12', price: 5200000, type: 'CONSULTORIO' },
                        { code: '4', name: 'Ortodoncia convencional bracket estético x24', price: 10000000, type: 'CONSULTORIO' },
                        { code: '5', name: 'Ortodoncia convencional bracket estético x36', price: 1500000, type: 'CONSULTORIO' },
                        { code: 'ORT-003', name: 'Bracket convencional estético por pieza', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '6.POS ORTODONCIA',
                    services: [
                        { code: '60', name: 'Retiro de bracket superior e inferior', price: 350000, type: 'CONSULTORIO' },
                        { code: '70', name: 'Retiro de bracket superior', price: 200000, type: 'CONSULTORIO' },
                        { code: '67', name: 'Retiro de bracket inferior', price: 200000, type: 'CONSULTORIO' },
                        { code: '83', name: 'Pulido después de ortodoncia', price: 200000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '7.CONTENCION',
                    services: [
                        { code: '174', name: 'Mantenedor placa de acetato rígida (por arcada)', price: 300000, type: 'CONSULTORIO' },
                        { code: '8', name: 'Contención fija inferior', price: 250000, type: 'CONSULTORIO' },
                        { code: '04', name: 'Mantenedor a placa Hawley (por arcada)', price: 400000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: '8.OTROS',
                    services: [
                        { code: '98', name: 'Colocación de tubo c/u', price: 30000, type: 'CONSULTORIO' },
                        { code: '114', name: 'Colocación de banda con tubo vestibular y lingual (c/u)', price: 100000, type: 'CONSULTORIO' },
                        { code: '112', name: 'Barra transpalatina (laboratorio)', price: 0, type: 'LABORATORIO' },
                        { code: '889', name: 'Aparato ortopédico HYRAX', price: 0, type: 'CONSULTORIO' },
                        { code: '238', name: 'Placa Hawley activa', price: 0, type: 'CONSULTORIO' },
                        { code: '556', name: 'Mantenedor de espacio banda ansa', price: 0, type: 'CONSULTORIO' },
                        { code: '661', name: 'Mantenedor de espacio removible', price: 0, type: 'CONSULTORIO' },
                        { code: '169', name: 'Mantenedor lingual/palatino (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '10', name: 'Rejilla palatina para niños (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                    ]
                }
            ]
        },
        {
            area: 'PROTESIS- TRABAJO DE LABORATORIO',
            categories: [
                {
                    name: '1.1.Metálico',
                    services: [
                        { code: '123', name: 'Armazón de cromo cobalto (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '124', name: 'Prótesis cromo cobalto por arcada (LABORATORIO)', price: 200000, type: 'LABORATORIO' },
                        { code: '125', name: 'PPR de cromo diente subsiguiente (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '132', name: 'Gancho por diente prótesis', price: 0, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: '1.2.Prótesis flexible',
                    services: [
                        { code: '128', name: 'Prótesis flexible completa y parcial', price: 300000, type: 'LABORATORIO' },
                        { code: '119', name: 'Prótesis flexible unilateral (un solo diente) C/U', price: 1500000, type: 'LABORATORIO' },
                        { code: '117', name: 'Prótesis flexible unilateral C/U', price: 0, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: '1.3 Prótesis removible de acrílico',
                    services: [
                        { code: '126', name: 'Prótesis parcial acrílico (sin importar la cantidad de dientes) POR ARCADA', price: 1500000, type: 'LABORATORIO' },
                        { code: '11', name: 'Prótesis completa de acrílico POR ARCADA (LABORATORIO)', price: 1800000, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: '2.1.Coronas',
                    services: [
                        { code: '164', name: 'Corona por pieza dentaria CEROMERO (LABORATORIO)', price: 800000, type: 'LABORATORIO' },
                        { code: '41', name: 'Corona por pieza dentaria PORCELANA (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '180', name: 'Corona de porcelana pura por pieza dentaria (LABORATORIO)', price: 250000, type: 'LABORATORIO' },
                        { code: '30', name: 'Corona de porcelana y metal por pieza dentaria (LABORATORIO)', price: 1750000, type: 'LABORATORIO' },
                        { code: '38', name: 'Corona de acrílico por pieza dentaria (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '133', name: 'Corona de acrílico con metal por pieza dentaria (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '888', name: 'Corona de zirconio por pieza dentaria(LABORATORIO)', price: 270000, type: 'LABORATORIO' },
                        { code: '87', name: 'Corona tipo veneer (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: '2.2. Puente',
                    services: [
                        { code: '122', name: 'Pieza de puente porcelana y metal por corona/diente (LABORATORIO)', price: 850000, type: 'LABORATORIO' },
                        { code: '35', name: 'Pieza de puente metal más cerómero por corona/diente (LABORATORIO)', price: 700000, type: 'LABORATORIO' },
                        { code: '09', name: 'Pieza de puente zirconio por corona/diente (LABORATORIO)', price: 1500000, type: 'LABORATORIO' },
                        { code: '121', name: 'Pieza de puente porcelana pura por corona/diente (LABORATORIO)', price: 1250000, type: 'LABORATORIO' },
                        { code: '120', name: 'Puente de meryland dos dientes (metal porcelana)', price: 2650000, type: 'LABORATORIO' },
                        { code: '109', name: 'Puente de meryland un solo diente (metal porcelana)', price: 1500000, type: 'LABORATORIO' },
                        { code: 'PPT-001', name: 'Ejemplo para presupuestar puente de tres piezas', price: 0, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: '2.3.Pernos',
                    services: [
                        { code: '555-L', name: 'Perno fibra de vidrio por pieza dentaria (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '441-L', name: 'Perno metálico articulado por pieza dentaria (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '111-L', name: 'Perno metálico simple por pieza dentaria (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: 'OTROS',
                    services: [
                        { code: '36', name: 'Provisorio dental por pieza dentaria (LABORATORIO)', price: 150000, type: 'LABORATORIO' },
                        { code: '243', name: 'Prótesis provisoria acrílico autocurado (sin importar cantidad de dientes) LABORATORIO', price: 800000, type: 'LABORATORIO' },
                        { code: '134', name: 'Rebasado de prótesis', price: 200000, type: 'LABORATORIO' },
                        { code: '48', name: 'Agregado de un diente prótesis de acrílico', price: 150000, type: 'LABORATORIO' },
                        { code: '131', name: 'Compostura de prótesis compleja (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '127', name: 'Compostura prótesis de acrílico (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '558', name: 'Cubeta individual c/u', price: 0, type: 'LABORATORIO' },
                        { code: '132-L', name: 'Gancho por diente prótesis (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                    ]
                },
                {
                    name: 'CEMENTACION',
                    services: [
                        { code: '91', name: 'Cementado de corona', price: 0, type: 'CONSULTORIO' },
                        { code: '190', name: 'Cementado de perno (metálico o estético)', price: 0, type: 'CONSULTORIO' },
                        { code: '63', name: 'Cementado de provisorio', price: 0, type: 'CONSULTORIO' },
                        { code: '00', name: 'Cementado de perno y corona', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'RETIROS',
                    services: [
                        { code: '011', name: 'Retiro de corona', price: 0, type: 'CONSULTORIO' },
                        { code: 'RT-001', name: 'Retiro de perno', price: 0, type: 'CONSULTORIO' },
                        { code: '73', name: 'Retiro de perno complejo', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'BLANQUEAMIENTO',
            categories: [
                {
                    name: 'General',
                    services: [
                        { code: '77', name: 'Blanqueamiento ambulatorio con placa', price: 0, type: 'CONSULTORIO' },
                        { code: '40', name: 'Blanqueamiento instantáneo en consultorio (2 sesiones)', price: 0, type: 'CONSULTORIO' },
                        { code: '46-B', name: 'Blanqueamiento interno (POS ENDO)', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'GENERALIDAES',
            categories: [
                {
                    name: 'General',
                    services: [
                        { code: '170', name: 'Consulta odontológica clínica general', price: 0, type: 'CONSULTORIO' },
                        { code: '999', name: 'Limpieza de sarro superior e inferior', price: 0, type: 'CONSULTORIO' },
                        { code: '58', name: 'Limpieza periodontal aguda compleja por arcada', price: 0, type: 'CONSULTORIO' },
                        { code: '68', name: 'Profilaxis', price: 0, type: 'CONSULTORIO' },
                        { code: '13-G', name: 'Sellado de fosas y fisuras (anticaries) adultos', price: 0, type: 'CONSULTORIO' },
                        { code: '51', name: 'Fluorización gel /barniz', price: 0, type: 'CONSULTORIO' },
                        { code: '667', name: 'Ferulizacion', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'ODONTOPEDIATRIA',
            categories: [
                {
                    name: 'PREVENCIÓN',
                    services: [
                        { code: '85', name: 'SELLADO DE FOSAS Y FISURAS ANTICARIES (PEDIATRIA)', price: 150000, type: 'CONSULTORIO' },
                        { code: '799', name: 'Fluorización gel/barniz', price: 300000, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'CIRUGIA',
                    services: [
                        { code: '008', name: 'Cirugía de dientes anteriores temporarios (pediatría)', price: 0, type: 'CONSULTORIO' },
                        { code: '335', name: 'Cirugía convencional sin reabsorción (pediatría)', price: 0, type: 'CONSULTORIO' },
                        { code: '76', name: 'Cirugía pediátrica diente móvil (paciente colaborador)', price: 0, type: 'CONSULTORIO' },
                        { code: '45', name: 'Cirugía pediátrica diente móvil PNC (paciente no colaborador)', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'ENDODONCIA',
                    services: [
                        { code: '990', name: 'Hulectomia', price: 0, type: 'CONSULTORIO' },
                        { code: '204', name: 'Pulpotomia anterior', price: 0, type: 'CONSULTORIO' },
                        { code: '205', name: 'Pulpotomia posterior', price: 0, type: 'CONSULTORIO' },
                        { code: '201', name: 'Endodoncia dientes anteriores', price: 0, type: 'CONSULTORIO' },
                        { code: '203', name: 'Endodoncia dientes posteriores', price: 0, type: 'CONSULTORIO' },
                        { code: '305', name: 'Restauración con ionómero fuji 9 (ODONTOPEDIATRA)', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'ESTUDIOS PREVIOS',
            categories: [
                {
                    name: 'EN CONSULTORIO',
                    services: [
                        { code: '39', name: 'Radiografía periapical en consultorio UNA UNIDAD', price: 0, type: 'CONSULTORIO' },
                        { code: '34', name: 'Radiografía periapical en consultorio (a partir de 2 unidades )', price: 0, type: 'CONSULTORIO' },
                    ]
                },
                {
                    name: 'TERCIERIZADOS',
                    services: [
                        { code: 'EP-001', name: 'Radiografía panorámica', price: 0, type: 'TERCERIZADO' },
                        { code: 'EP-002', name: 'Radiografía lateral', price: 0, type: 'TERCERIZADO' },
                        { code: 'EP-003', name: 'Tomografía', price: 0, type: 'TERCERIZADO' },
                    ]
                }
            ]
        },
        {
            area: 'IMPLANTES',
            categories: [
                {
                    name: 'General',
                    services: [
                        { code: '107', name: 'Prótesis protocolo por arcada', price: 0, type: 'CONSULTORIO' },
                        { code: '106', name: 'Implante por pieza dental', price: 0, type: 'CONSULTORIO' },
                        { code: '163', name: 'Pieza de corona sobre implante atornillado porcelana pura (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '162', name: 'Pieza de corona sobre implante atornillado metal porcelana (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '167', name: 'Pieza de corona sobre implante cementado metal porcelana (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '168', name: 'Pieza de corona sobre implante cementado porcelana pura (LABORATORIO)', price: 0, type: 'LABORATORIO' },
                        { code: '105', name: 'Relleno óseo', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        },
        {
            area: 'ODONTOLOGÍA ESTÉTICA',
            categories: [
                {
                    name: 'General',
                    services: [
                        { code: '997', name: 'Carilla de cerómero', price: 0, type: 'CONSULTORIO' },
                        { code: '998', name: 'Carilla y lente de contacto (zirconio)', price: 0, type: 'CONSULTORIO' },
                        { code: '996', name: 'Corona de zirconio', price: 0, type: 'CONSULTORIO' },
                        { code: '995', name: 'Corona metal cerámico', price: 0, type: 'CONSULTORIO' },
                        { code: '994', name: 'Corona metal porcelana', price: 0, type: 'CONSULTORIO' },
                    ]
                }
            ]
        }
    ];

    // Delete existing service areas to properly re-seed if in dev (optional, careful in prod)
    // await prisma.service.deleteMany({});
    // await prisma.serviceCategory.deleteMany({});
    // await prisma.serviceArea.deleteMany({});



    console.log('!!! STARTING FRESH SEED - CLEARING CATALOG !!!');
    // Clear old data to avoid stale entries
    await prisma.service.deleteMany({});
    await prisma.serviceCategory.deleteMany({});
    await prisma.serviceArea.deleteMany({});

    for (const areaData of catalog) {
        const area = await prisma.serviceArea.upsert({
            where: { name: areaData.area },
            update: {},
            create: {
                name: areaData.area,
                tenantId: 'default'
            }
        });

        for (const catData of areaData.categories) {
            const category = await prisma.serviceCategory.upsert({
                where: { name: catData.name },
                update: {
                    areaId: area.id
                },
                create: {
                    name: catData.name,
                    areaId: area.id,
                    tenantId: 'default'
                }
            });

            for (const srvData of catData.services) {
                await prisma.service.upsert({
                    where: { code: srvData.code },
                    update: {
                        name: srvData.name,
                        price: srvData.price,
                        type: srvData.type as any,
                        categoryId: category.id,
                    },
                    create: {
                        name: srvData.name,
                        code: srvData.code,
                        price: srvData.price,
                        type: srvData.type as any,
                        categoryId: category.id,
                        tenantId: 'default'
                    }
                });
            }
        }
    }

    console.log('Seeded Service Catalog (Areas -> Categories -> Services)');


    // Seed System Config
    const configs = [
        {
            key: 'clinic_info',
            value: {
                ruc: '9999999-9',
                email: '',
                phone: '',
                address: '',
                businessName: 'Mi Consultorio',
            },
            description: 'Información general de la clínica',
        },
        {
            key: 'billing_config',
            value: {
                taxRate: 10,
                currency: 'PYG',
                electronicBilling: false,
                allowedInstallments: [1, 3, 6, 12, 24],
                defaultExpirationDays: 7,
                calculateInterest: true,
                interestRate: 10,
            },
            description: 'Configuración de facturación y cobros',
        },
    ];



    for (const config of configs) {
        await prisma.systemConfig.upsert({
            where: {
                tenantId_key: {
                    tenantId: 'default',
                    key: config.key,
                },
            },
            update: {
                value: config.value as any, // Cast to any to avoid JsonValue issues if strict
                description: config.description,
            },
            create: {
                tenantId: 'default',
                key: config.key,
                value: config.value as any,
                description: config.description,
            },
        });
    }
    console.log('Seeded System Configurations');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
