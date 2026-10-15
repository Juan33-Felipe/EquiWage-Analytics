import * as XLSX from 'xlsx';

/**
 * Lectura y validación de archivos de nómina / bandas salariales.
 * Todo el procesamiento ocurre en el navegador (100% local, sin subir datos).
 */

/** Columnas obligatorias de la nómina, en lenguaje claro para RRHH. */
export const REQUIRED_PAYROLL_COLUMNS = ['ID', 'Nombre', 'Cargo', 'Nivel', 'Salario Actual'];

/** Normaliza encabezados: sin tildes, minúsculas y sin espacios extra. */
function normalizeKey(key = '') {
  return String(key)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

/** Lee el archivo como matriz de objetos (encabezado -> valor). */
export async function readTabularFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

/**
 * Valida que existan las columnas obligatorias.
 * Devuelve las faltantes en lenguaje amigable.
 */
export function findMissingColumns(rows) {
  if (!rows.length) return REQUIRED_PAYROLL_COLUMNS;
  const present = Object.keys(rows[0]).map(normalizeKey);
  return REQUIRED_PAYROLL_COLUMNS.filter(
    (column) => !present.includes(normalizeKey(column))
  );
}

/** Convierte filas crudas en empleados normalizados. */
export function rowsToEmployees(rows) {
  return rows
    .map((row, index) => {
      const lookup = {};
      Object.entries(row).forEach(([key, value]) => {
        lookup[normalizeKey(key)] = value;
      });
      const level = Number(lookup['nivel']) || 1;
      const salary = Number(String(lookup['salario actual']).replace(/[^0-9.-]/g, '')) || 0;
      return {
        id: String(lookup['id'] || `ROW-${index + 1}`),
        name: String(lookup['nombre'] || 'Unnamed employee'),
        role: String(lookup['cargo'] || 'Unassigned role'),
        department: String(lookup['departamento'] || lookup['department'] || 'Unassigned'),
        level,
        currentSalary: salary,
      };
    })
    .filter((employee) => employee.currentSalary > 0);
}

/**
 * Valida y transforma un archivo de nómina.
 * @returns {{ok: boolean, employees?: Array, missing?: Array, rowCount?: number, error?: string}}
 */
export async function parsePayrollFile(file) {
  if (!file) return { ok: false, error: 'No file selected.' };
  try {
    const rows = await readTabularFile(file);
    if (!rows.length) {
      return { ok: false, error: 'The file is empty or has no readable rows.' };
    }
    const missing = findMissingColumns(rows);
    if (missing.length) {
      return { ok: false, missing };
    }
    const employees = rowsToEmployees(rows);
    return { ok: true, employees, rowCount: employees.length };
  } catch {
    return { ok: false, error: 'We could not read this file. Please export it as .CSV or .XLSX.' };
  }
}

/**
 * Valida y transforma un archivo de bandas salariales del mercado.
 * Espera columnas de nivel y los rangos P25 / P50 / P75.
 */
export async function parseBandsFile(file) {
  if (!file) return { ok: false, error: 'No file selected.' };
  try {
    const rows = await readTabularFile(file);
    if (!rows.length) {
      return { ok: false, error: 'The file is empty or has no readable rows.' };
    }
    const bands = rows
      .map((row) => {
        const lookup = {};
        Object.entries(row).forEach(([key, value]) => {
          lookup[normalizeKey(key)] = value;
        });
        const pick = (...keys) => {
          for (const key of keys) {
            if (lookup[normalizeKey(key)] !== undefined && lookup[normalizeKey(key)] !== '') {
              return Number(String(lookup[normalizeKey(key)]).replace(/[^0-9.-]/g, ''));
            }
          }
          return NaN;
        };
        return {
          level: pick('Nivel', 'Level', 'Nivel de Cargo'),
          min: pick('Minimo P25', 'Min', 'P25', 'Minimo'),
          median: pick('Mediana P50', 'Median', 'P50', 'Mediana'),
          max: pick('Maximo P75', 'Max', 'P75', 'Maximo'),
        };
      })
      .filter((band) => [band.level, band.min, band.median, band.max].every(Number.isFinite));

    if (!bands.length) {
      return { ok: false, error: 'We could not find salary ranges in this file.' };
    }
    return { ok: true, bands, rowCount: bands.length };
  } catch {
    return { ok: false, error: 'We could not read this file. Please export it as .CSV or .XLSX.' };
  }
}
