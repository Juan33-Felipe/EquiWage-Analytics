# EquiWage Analytics — Contexto Integral del Proyecto

> **Documento de Contexto y Especificación Técnica del Sistema**  
> **Plataforma:** EquiWage Analytics  
> **Versión:** 1.0.0 (Monorepo Operativo)  
> **Área de Aplicación:** Compensaciones y Beneficios (C&B), Recursos Humanos, Finanzas y Cumplimiento Legal

---

## 1. Resumen Ejecutivo y Propósito

**EquiWage Analytics** es una plataforma de software de escritorio y entorno local (*Local-First*) concebida para que equipos de **Recursos Humanos, Analistas de Compensación y Directores Financieros** puedan auditar con rigor matemático la **equidad salarial interna** y la **competitividad salarial externa** frente al mercado, garantizando el **cumplimiento estricto del salario mínimo legal** y permitiendo modelar escenarios presupuestales de nivelación en tiempo real.

### El Problema que Resuelve
1. **Inequidad Salarial Interna:** Disparidades injustificadas entre empleados que desempeñan el mismo rol en el mismo nivel jerárquico, lo que genera desmotivación, rotación de talento y riesgos legales/laborales.
2. **Desalineación frente al Mercado:** Salarios que quedan rezagados respecto a las bandas de mercado (por debajo del percentil 25 o la mediana), comprometiendo la atracción y retención del talento clave.
3. **Infracciones de Salario Mínimo Legal:** Empleados cuyo salario base fijo se encuentra por debajo de la legislación estatutaria vigente por país, exponiendo a la empresa a multas y sanciones regulatorias.
4. **Hojas de Cálculo Frágiles y Desactualizadas:** La gestión tradicional de compensaciones suele depender de archivos Excel con fórmulas complejas propensas a errores humanos y cálculos manuales lentos.
5. **Riesgos de Privacidad con Datos Sensibles:** Los datos salariales son confidenciales; enviarlos sin anonimización a servicios en la nube de IA o procesarlos en servidores externos vulnera normativas de protección de datos (como GDPR o leyes locales de privacidad laboral).

### La Solución de EquiWage Analytics
* **Auditoría Determinista en Tiempo Real (< 1 ms):** Cálculos 100% algorítmicos sin delegar matemáticas a modelos de inteligencia artificial, evitando cualquier riesgo de alucinación o imprecisión en cifras monetarias.
* **Arquitectura Local-First:** El procesamiento de datos y la persistencia relacional residen íntegramente en la máquina del usuario mediante SQLite embebido, funcionando con o sin conexión a internet.
* **Capa Estricta de Anonimización de Datos:** Los diagnósticos ejecutivos con IA reciben únicamente métricas estadísticas agregadas, eliminando por completo nombres, identificadores personales (PII) y registros individuales.
* **Simulador Presupuestal Interactivo:** Modelado instantáneo de costos de nivelación hacia el mínimo de banda o la mediana, simulación de inflación proyectada de mercado (0% a 25%), micro-ajustes individuales 1 a 1 y generación de órdenes de ejecución de nómina para el departamento contable.

---

## 2. Arquitectura Global del Monorepo

El repositorio está estructurado como un **Monorepo gestionado con NPM Workspaces**, compuesto por tres paquetes principales:

```text
equiwage-analytics/
├── package.json              # Configuración raíz de NPM Workspaces y orquestación de scripts
├── context.md                # Contexto integral del proyecto (este archivo)
├── plan_funcionalidades.md   # Hoja de ruta de funcionalidades operativas
├── README.md                 # Documentación general de bienvenida
├── packages/
│   └── shared/               # (@equiwage/shared) Contratos TypeScript, validaciones, esquemas y constantes
└── apps/
    ├── backend/              # (@equiwage/backend) Servidor local en Node.js + TypeScript + SQLite + AI
    └── frontend/             # (@equiwage/frontend) Interfaz de usuario SPA en React 19 + Vite + Tailwind CSS
```

### 2.1 Paquete Compartido (`packages/shared`)
El paquete `@equiwage/shared` actúa como la **única fuente de verdad** (*Single Source of Truth*) para tipos de datos, contratos de API, esquemas de validación y constantes de negocio entre el backend y el frontend:
* **Tipos de Dominio (`domain.types.d.ts`):** `Employee`, `EnrichedEmployee`, `SalaryBand`, `LegalComplianceConfig`, `CountryMinimumWageReference`, `ManualAdjustment`, `InflationSimulationParams`, `PayrollActionPlan`, `PayrollActionPlanItem`, `AuditSummaryPayload`.
* **Tipos de API y Respuestas (`api.types.d.ts`):** Estructura uniforme de respuestas HTTP (`ApiResponse<T>`), payloads de importación, simulación y reportes.
* **Tipos de Autenticación (`auth.types.d.ts`):** `User`, `AuthTokenPayload`, `LoginCredentials`, `RegisterData`.
* **Tipos de Inteligencia Artificial (`ai.types.d.ts`):** `AggregatedAuditMetrics`, `AiDiagnosticReport`, `AiDiagnosticPrompt`.
* **Constantes de Negocio (`constants/`):** Departamentos estándar (`Engineering`, `Product`, `Sales`, `Marketing`, `HR`, `Finance`), umbral de inequidad interna (`INEQUITY_THRESHOLD = 0.10` o 10%), niveles de cargo (`L1` a `L8`).
* **Utilidades Compartidas (`utils/`):** Formateadores de moneda (`formatCurrency`), cálculo de iniciales (`getInitials`), y guardias de privacidad (`hasNoPersonalIdentifiers`).

### 2.2 Servidor Backend (`apps/backend`)
Construido sobre **Node.js (ESM)** y **TypeScript**, proporciona una API REST local de alto rendimiento:
* **Framework:** Express.js 4.x con middleware de CORS, logging estructurado y manejador centralizado de errores (`AppError`).
* **Base de Datos Embebida:** SQLite nativo a través de `node:sqlite` (`DatabaseSync`), ejecutado en modo WAL (*Write-Ahead Logging*) con claves foráneas activas y migraciones automáticas.
* **Motores Deterministas (`src/engines/`):**
  * `band-positioning.engine.ts`: Calcula compa-ratio, penetración de banda y brechas contra el límite inferior (P25) y la mediana (P50).
  * `inequity.engine.ts`: Agrupa colaboradores por cargo y nivel para identificar brechas salariales entre pares superiores al 10%.
  * `simulation.engine.ts`: Ejecuta el cálculo presupuestal de nivelación, aplicando primero y obligatoriamente el salario mínimo legal, luego el escalado por inflación proyectada y finalmente los micro-ajustes individuales.
* **Capa de Inteligencia Artificial (`src/ai/`):** Conectores para modelos LLM (Google Gemini / OpenAI compatible) con motor de fallback determinista cuando no hay clave configurada o no hay internet.
* **Servicios de Archivos (`src/services/`):** Procesamiento de hojas de cálculo `.csv` y `.xlsx` (mediante SheetJS y Multer), generación de reportes ejecutivos descargables y exportación/restauración de sesiones de trabajo en formato `.json`.

### 2.3 Aplicación Frontend (`apps/frontend`)
Desarrollada con **React 19** y empaquetada con **Vite**:
* **Diseño y Estética:** Sistema de diseño propio **Warm Enterprise / Soft UI**, con fondos cálidos alabastro (`#F9FAFB`), tarjetas blancas elevadas (`#FFFFFF`), sombras difusas (`shadow-soft`), esquinas redondeadas (`rounded-xl` a `24px`), acento naranja energético (`#F97316`) y soporte nativo para **Modo Oscuro**.
* **Visualización de Datos:** Gráficos interactivos con **Recharts** (diagrama de dispersión salarial contra bandas de mercado, dona de alineación organizacional y barras de impacto presupuestal por departamento).
* **Animaciones y Micro-Interacciones:** **Framer Motion** para transiciones fluidas en modales, paneles laterales (*drawers*) y cambios dinámicos del deslizador de inflación.
* **Arquitectura Atómica:** Componentes organizados en `atoms`, `molecules`, `organisms`, `templates` y `pages`.
* **Internacionalización y Accesibilidad:** Soporte bilingüe completo (Español e Inglés) y navegación accesible.

---

## 3. Modelo de Datos y Persistencia Local (SQLite)

La base de datos local SQLite se inicializa automáticamente al arrancar el backend mediante migraciones idempotentes (`schema.migrations.ts`). Cuenta con 12 tablas estructuradas:

| Tabla | Propósito y Contenido Clave |
| :--- | :--- |
| `salary_bands` | Bandas de mercado por nivel (`level` L1–L8, `min_salary` P25, `median_salary` P50, `max_salary` P75). |
| `employees` | Nómina activa de colaboradores (`id`, `name`, `role`, `department`, `level`, `current_salary`). |
| `simulation_settings` | Configuración singleton del simulador (`target`, `rollout_quarters`, `departments_json`, `inflation_percent`, `include_legal_compliance`). |
| `legal_compliance_settings` | Parámetros legales activos (`enabled`, `country_code`, `country_name`, `minimum_wage`, `currency`). |
| `reference_countries` | Catálogo de referencia con salarios mínimos por país (LATAM, Norteamérica, Europa). |
| `employee_manual_adjustments` | Micro-simulaciones y aumentos manuales por empleado (`adjustment_type`, `adjustment_value`, `proposed_salary`). |
| `payroll_action_plans` | Historial de planes de acción aprobados con órdenes de ejecución salarial detalladas. |
| `users` | Usuarios y analistas de RRHH locales (`username`, `email`, `full_name`, `password_hash`, `role`, `department`). |
| `verification_codes` | Códigos OTP de 4 dígitos para registro y activación de cuentas locales. |
| `revoked_tokens` | Lista negra (*blocklist*) para invalidación inmediata de tokens JWT al cerrar sesión. |
| `app_metadata` | Pares clave-valor sobre el estado del sistema (`payroll_source`, `schema_version`, etc.). |
| `audit_snapshots` | Instantáneas históricas de auditorías guardadas para comparativa en el tiempo. |

---

## 4. Requisitos del Sistema (RF y RNF)

### 4.1 Requisitos Funcionales (RF)
* **RF-001 — Importar y Gestionar Empleados:** Carga masiva de nómina en formato CSV o Excel, así como gestión activa individual (creación manual `+ Add Employee`, edición de datos y eliminación).
* **RF-002 — Importar y Configurar Bandas Salariales:** Carga e ingreso manual de los límites de mercado (Mínimo P25, Mediana P50, Máximo P75) por cada nivel de puesto.
* **RF-003 — Detección Automática de Brechas de Mercado:** Identificación y listado de colaboradores cuyo salario actual está por debajo del límite mínimo de su banda salarial (con cálculo de déficit en moneda y porcentaje).
* **RF-004 — Detección de Inequidad Interna:** Detección de colaboradores que comparten el mismo cargo y nivel jerárquico pero presentan una dispersión salarial superior al 10% entre sí.
* **RF-005 — Simulación Presupuestal de Nivelación:** Cálculo en tiempo real del costo financiero para nivelar la nómina hacia el mínimo (P25) o la mediana (P50), con desglose departamental y cronograma en 1 a 4 trimestres.
* **RF-006 — Visualización de Curva y Dispersión Salarial:** Diagrama interactivo de dispersión (*scatter plot*) que ubica a cada colaborador en los ejes Nivel vs. Salario, contrastado contra las curvas de las bandas de mercado.
* **RF-007 — Generación y Exportación de Reportes:** Generación de diagnósticos ejecutivos con IA anonimizada y exportación de resúmenes analíticos en formatos Excel (.XLSX) y PDF.
* **RF-008 — Guardado y Restauración de Sesión Local:** Posibilidad de guardar el estado completo del proyecto en un archivo `.json` local para retomarlo en cualquier momento.

### 4.2 Requisitos No Funcionales (RNF)
* **RNF-001 — Privacidad y Soberanía Local:** Todos los datos sensibles se almacenan y procesan en la máquina local del usuario; el sistema opera plenamente sin internet (a excepción de llamadas optativas a la API de IA).
* **RNF-002 — Tiempo de Respuesta Subsegundo (< 1 s):** Los cálculos de auditoría, recálculo de simulaciones y renderizado de gráficos se completan en tiempos inferiores a 1 segundo (~1-2 ms en backend).
* **RNF-003 — Tolerancia a Errores de Formato:** Rechazo estructurado e informativo de archivos de importación que carezcan de columnas obligatorias o tengan formatos numéricos inválidos.
* **RNF-004 — Compatibilidad Multiplataforma / Escritorio:** Arquitectura lista para empaquetado como aplicación de escritorio nativa para Windows 10/11 (compatible con Electron o entornos locales).

---

## 5. Módulos y Funcionalidades Clave

### A. Gestión Activa de Nómina (`/employees`)
* **Directorio Interactivo:** Tabla con filtrado por departamento, búsqueda rápida por nombre o cargo y ordenamiento dinámico.
* **Operaciones CRUD en Tiempo Real:** El analista puede agregar nuevos colaboradores manualmente sin necesidad de volver a importar un archivo completo, así como editar salarios, niveles o departamentos y eliminar registros.
* **Sincronización Instantánea:** Cada modificación dispara el recálculo inmediato de los KPIs de equidad en toda la plataforma.

### B. Módulo de Cumplimiento Legal de Salario Mínimo (Compliance Engine)
* **Validación Estatutaria Estricta:** Evalúa exclusivamente el **salario base fijo** (excluyendo bonos variables o comisiones de ventas).
* **Selector de Países y Valor 100% Editable:** Cuenta con un catálogo predefinido de salarios mínimos de referencia (EE. UU., México, Colombia, España, etc.) y permite al analista ingresar el valor exacto decretado por ley.
* **Severidad Visual Diferenciada:** Mientras que estar por debajo del mercado es una alerta de retención (rojo `#EF4444`), estar por debajo del salario mínimo legal es una **Infracción Legal Crítica** destacada con un distintivo especial (púrpura `#7C3AED` o ámbar legal).
* **Prioridad Absoluta en el Simulador:** El motor asigna presupuesto **primero y de forma obligatoria** para nivelar a los infractores legales al salario mínimo antes de calcular ajustes de mercado P25 o P50.

### C. Simulador Presupuestal e Inflación Futura (`/dashboard/simulator`)
* **Nivelación Macro:** Selección del objetivo presupuestal (llevar a todos al P25 o a la mediana P50), selección de departamentos a incluir y calendarización en 1, 2, 3 o 4 trimestres.
* **Proyector de Inflación de Mercado (0% a +25%):** Un deslizador interactivo incrementa las bandas salariales por el porcentaje proyectado, mostrando en tiempo real cuántos empleados actualmente alineados quedarían desfasados el próximo año si no se ajustan sus sueldos.
* **Micro-Simulaciones Individuales (1 a 1):** Ajuste manual por colaborador (monto fijo `+$` o porcentaje `+%`) visible inmediatamente en el diagrama de dispersión y en el presupuesto general.
* **Desglose de Costo en Métricas Hero:** Separación transparente entre *Costo de Cumplimiento Legal*, *Costo de Nivelación de Bandas* y *Ajustes Manuales Individuales*.

### D. Flujo de Aprobación y Orden de Ejecución de Nómina
* Al completar la simulación, el usuario hace clic en **"Aprobar Ajustes y Generar Orden de Nómina"**.
* El sistema guarda el plan en la base de datos, actualiza opcionalmente los salarios en nómina y genera un archivo descargable (.CSV / .XLSX) con la orden formal para el departamento contable/financiero, detallando: *ID, Nombre, Cargo, Departamento, Nivel, Salario Anterior, Incremento Monetario y Porcentual, Nuevo Salario y Motivo de Ajuste (Cumplimiento Legal, Mínimo P25, Mediana P50 o Ajuste Manual)*.

### E. Curva Salarial y Dispersión (`/dashboard/distribution`)
* Diagrama de dispersión salarial (*scatter plot*) con las curvas de percentiles P25, P50 y P75.
* Identificación táctil de cada empleado: al hacer clic sobre un punto se abre un panel lateral de ajuste individual.
* Filtros por departamento, estado de banda (por debajo, alineado, por encima) y severidad de alerta.

### F. Diagnósticos Asistidos por IA con Anonimización Estricta (`/reports`)
* Generación de análisis narrativos ejecutivos sobre riesgos de rotación, equidad de género/departamental y recomendaciones de compensación.
* **Garantía de Privacidad Total:** Ningún nombre, ID ni dato identificable de los colaboradores se envía al modelo. El backend construye un payload puramente cuantitativo y estadístico.
* **Modo Offline:** Si no se dispone de conexión o API Key de Google Gemini/OpenAI, un generador heurístico local produce un informe ejecutivo determinista de alta calidad.

### G. Autenticación y Control de Acceso Local (`/login`, `/register`)
* Inicio de sesión y registro de analistas con validación mediante código de verificación OTP de 4 dígitos.
* Gestión de sesión segura con tokens JWT revocables almacenados localmente.

---

## 6. Sistema de Diseño y Principios de Interfaz (UI/UX)

La aplicación sigue el paradigma **Warm Enterprise / Soft UI**:
* **Paleta de Colores:**
  * Fondo general: `#F9FAFB` (Alabastro suave cálido).
  * Superficies y Tarjetas: `#FFFFFF` (Blanco puro con bordes sutiles `#F3F4F6`).
  * Acento Primario: `#F97316` (Naranja enérgico corporativo).
  * Alertas de Mercado: `#EF4444` (Rojo carmesí para desalineación P25).
  * Infracciones Legales: `#7C3AED` (Púrpura intenso de severidad regulatoria).
  * Estados Alineados: `#10B981` (Verde esmeralda para compensación equitativa).
  * Modo Oscuro: Fondos gris grafito profundo con contraste equilibrado.
* **Geometría y Tipografía:**
  * Tipografía: `Inter` sans-serif con jerarquía de pesos clara.
  * Bordes redondeados: `rounded-xl` (24px) en tarjetas modales y paneles, `rounded-pill` (9999px) en botones y badges.
  * Elevación: `shadow-soft` difusa sin sombras oscuras duras.
* **Cero Jerga de Ingeniería:** La interfaz no expone términos técnicos de programación ni códigos de requisitos (como `RF-001` o `SQLite WAL`), empleando un lenguaje 100% natural y profesional orientado a analistas de RRHH.
* **Cero Glassmorphism Borroso:** Diseñado con fondos sólidos y legibles que evitan transparencias artificiales o desenfoques molestos.

---

## 7. Estructura de Directorios del Proyecto

```text
equiWage-analytics/
├── package.json                          # Configuración global del monorepo
├── package-lock.json
├── README.md                             # Documentación de bienvenida
├── plan_funcionalidades.md               # Especificación de etapas de desarrollo
├── context.md                            # Contexto integral de la plataforma
├── docs/
│   └── project-context.md                # Especificaciones históricas del proyecto
├── packages/
│   └── shared/                           # Paquete compartido (@equiwage/shared)
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.js / index.d.ts     # Punto de entrada de exportaciones
│           ├── constants/                # Constantes de negocio
│           ├── schemas/                  # Validaciones de esquemas
│           ├── types/                    # Tipos de dominio, API, auth e IA
│           └── utils/                    # Utilidades matemáticas y de formato
└── apps/
    ├── backend/                          # Servidor Express + SQLite (@equiwage/backend)
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── .env / .env.example
    │   ├── data/                         # Base de datos SQLite local (equiwage.db)
    │   └── src/
    │       ├── app.ts / server.ts        # Configuración del servidor HTTP
    │       ├── ai/                       # Conectores LLM, anonimizador y fallback
    │       ├── config/                   # Configuración de variables de entorno y logger
    │       ├── controllers/              # Controladores REST
    │       ├── database/                 # Conexión SQLite, migraciones y seeders
    │       ├── engines/                  # Motores deterministas de auditoría y simulación
    │       ├── middlewares/              # Manejador de errores, CORS y validaciones
    │       ├── models/                   # Modelos de datos
    │       ├── repositories/             # Acceso a datos con sentencias SQL preparadas
    │       ├── routes/                   # Definición de rutas (/api/*)
    │       ├── services/                 # Lógica de importación, reportes y sesiones
    │       └── validators/               # Validadores de entrada de datos
    └── frontend/                         # Interfaz React 19 + Vite (@equiwage/frontend)
        ├── package.json
        ├── vite.config.js
        ├── tailwind.config.js
        ├── index.html
        └── src/
            ├── App.jsx / main.jsx        # Configuración de enrutador y montaje
            ├── components/
            │   ├── atoms/                # Botones, badges, inputs, sliders
            │   ├── molecules/            # Tarjetas KPI, barras de filtro, alertas
            │   ├── organisms/            # Tablas interactivas, gráficos, modales, sidebar
            │   └── templates/            # Layouts y rutas protegidas
            ├── context/                  # AuthContext, CompensationContext, etc.
            ├── hooks/                    # Hooks personalizados (useAiDiagnostics, etc.)
            ├── pages/                    # Vistas principales de la aplicación
            ├── services/                 # Clientes HTTP (Axios / Fetch)
            ├── translations/             # Diccionarios de idiomas (ES/EN)
            └── utils/                    # Funciones auxiliares de estilo y formato
```

---

## 8. Guía de Ejecución y Comandos

### Requisitos Previos
* **Node.js:** Versión 20.x o superior.
* **NPM:** Versión 10.x o superior.

### Instalación de Dependencias
Ejecutar en la raíz del repositorio:
```bash
npm install
```

### Ejecución en Modo Desarrollo
Inicia concurrentemente tanto el servidor backend como la aplicación frontend:
```bash
npm run dev
```
* **Frontend:** accesible en `http://localhost:5173` (o puerto configurado por Vite).
* **Backend:** accesible en `http://127.0.0.1:4000`.

### Comandos Individuales de Paquetes
* `npm run dev:frontend` — Inicia únicamente el entorno Vite del frontend.
* `npm run dev:backend` — Inicia únicamente el servidor Express del backend.
* `npm run build` — Compila todos los paquetes del monorepo (`shared`, `backend`, `frontend`).
* `npm run lint` — Ejecuta las validaciones de estilo y TypeScript en todo el monorepo.
* `npm run db:seed --workspace=@equiwage/backend` — Puebla o reinicia la base de datos SQLite con datos de prueba realistas.

---

## 9. Estado de Desarrollo y Próximos Pasos

La plataforma cuenta con un núcleo funcional completo:
1. **Persistencia y Base de Datos:** Modelo relacional SQLite de 12 tablas completamente migrado y con soporte transaccional.
2. **Motores Analíticos:** Detección de brechas contra el mercado, análisis de inequidad interna entre pares y simulación de nivelación operando en subsegundos.
3. **Cumplimiento Legal:** Identificación de colaboradores por debajo del salario mínimo estatutario con prioridad absoluta en la nivelación.
4. **Interfaz de Usuario:** Dashboard ejecutivo, visualización gráfica con Recharts, panel de simulación de presupuestos y deslizador de inflación futura.
5. **Autenticación y Seguridad:** Flujo de registro, activación por código OTP y sesiones con tokens seguros.
6. **IA Responsable:** Reportes estratégicos con anonimización total de datos salariales.

EquiWage Analytics se consolida como una solución empresarial integral, moderna y segura para la toma de decisiones estratégicas en compensaciones salariales.
