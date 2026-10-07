# Modelador y Validador de Estructura Salarial (EquiWage Analytics)

## Descripción del Proyecto
Software de escritorio para Recursos Humanos diseñado para auditar la equidad salarial interna y la competitividad externa. Permite importar datos de nómina, detectar desviaciones frente a bandas de mercado y simular escenarios presupuestales de nivelación en tiempo real.

## Requisitos Funcionales (RF)
* **RF-001 - Importar Empleados:** El sistema debe permitir cargar un archivo (CSV/Excel) con la nómina actual (ID, Nombre, Cargo, Salario Actual).
* **RF-002 - Importar Bandas Salariales:** El sistema debe permitir cargar o ingresar manualmente los rangos de mercado (Mínimo, Mediana, Máximo) por cada nivel de cargo.
* **RF-003 - Detectar Brechas de Mercado:** El sistema debe identificar y listar automáticamente a los empleados cuyo salario actual esté por debajo del límite mínimo de su banda salarial.
* **RF-004 - Detectar Inequidad Interna:** El sistema debe identificar y listar a los empleados con el mismo cargo que tengan una diferencia salarial superior al 10% entre ellos.
* **RF-005 - Simular Nivelación:** El sistema debe calcular y mostrar el costo total exacto que requeriría subir el sueldo de los empleados afectados al límite mínimo o a la mediana de su banda.
* **RF-006 - Visualizar Curva Salarial:** El sistema debe mostrar un gráfico de dispersión (scatter plot) donde el eje X sea el nivel del cargo, el eje Y el salario, incluyendo las líneas de las bandas y los empleados como puntos.
* **RF-007 - Exportar Reporte:** El sistema debe exportar un resumen de las brechas detectadas y el costo de la simulación en formato PDF y Excel.
* **RF-008 - Guardar Sesión Local:** El sistema debe permitir guardar el estado actual del análisis en un archivo de proyecto local para poder retomarlo al volver a abrir la aplicación.

## Requisitos No Funcionales (RNF)
* **RNF-001 - Privacidad Local:** El sistema no debe requerir conexión a internet para procesar los datos; todo cálculo y almacenamiento se realizará en la máquina local del usuario.
* **RNF-002 - Tiempo de Respuesta:** La actualización del costo en el simulador de nivelación (RF-005) y la recarga de gráficos (RF-006) deben ejecutarse en menos de 1 segundo tras cualquier ajuste.
* **RNF-003 - Tolerancia a Errores de Formato:** El sistema debe rechazar archivos de importación que no contengan las columnas obligatorias, mostrando un mensaje que indique exactamente qué columna falta.
* **RNF-004 - Sistema Operativo:** El software debe generar un ejecutable instalable compatible con Windows 10/11.
