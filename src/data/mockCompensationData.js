/**
 * Datos iniciales realistas para EquiWage Analytics.
 * Se cargan en memoria (RAM) sin conexión a internet, respetando la
 * privacidad salarial: nada sale de la máquina del usuario.
 */

export const DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'HR', 'Finance'];

/** Niveles de cargo L1 a L8 con su banda de mercado (P25 / P50 / P75). */
export const MOCK_SALARY_BANDS = [
  { level: 1, min: 45000, median: 55000, max: 65000 },
  { level: 2, min: 58000, median: 70000, max: 82000 },
  { level: 3, min: 72000, median: 86000, max: 100000 },
  { level: 4, min: 88000, median: 104000, max: 122000 },
  { level: 5, min: 108000, median: 126000, max: 148000 },
  { level: 6, min: 132000, median: 154000, max: 180000 },
  { level: 7, min: 160000, median: 184000, max: 214000 },
  { level: 8, min: 190000, median: 220000, max: 260000 },
];

/** Primer lote de nómina de ejemplo, ya cruzada contra las bandas. */
export const MOCK_EMPLOYEES = [
  { id: 'EMP-001', name: 'Maya Chen', role: 'Senior Product Designer', department: 'Product', level: 5, currentSalary: 103000 },
  { id: 'EMP-002', name: 'Daniel Brooks', role: 'Software Engineer II', department: 'Engineering', level: 4, currentSalary: 88400 },
  { id: 'EMP-003', name: 'Priya Nair', role: 'Marketing Manager', department: 'Marketing', level: 5, currentSalary: 110000 },
  { id: 'EMP-004', name: 'Jordan Ellis', role: 'Financial Analyst', department: 'Finance', level: 3, currentSalary: 77400 },
  { id: 'EMP-005', name: 'Sofia Martinez', role: 'People Operations Lead', department: 'HR', level: 5, currentSalary: 113600 },
  { id: 'EMP-006', name: 'Liam O’Connor', role: 'Staff Engineer', department: 'Engineering', level: 6, currentSalary: 149000 },
  { id: 'EMP-007', name: 'Aisha Rahman', role: 'Account Executive', department: 'Sales', level: 3, currentSalary: 69000 },
  { id: 'EMP-008', name: 'Noah Kim', role: 'Product Manager', department: 'Product', level: 5, currentSalary: 128000 },
  { id: 'EMP-009', name: 'Emma Wilson', role: 'Recruiter', department: 'HR', level: 2, currentSalary: 61500 },
  { id: 'EMP-010', name: 'Lucas Hayes', role: 'Software Engineer II', department: 'Engineering', level: 4, currentSalary: 97000 },
  { id: 'EMP-011', name: 'Olivia Braun', role: 'Senior Software Engineer', department: 'Engineering', level: 5, currentSalary: 121000 },
  { id: 'EMP-012', name: 'Ethan Cole', role: 'Sales Manager', department: 'Sales', level: 6, currentSalary: 138000 },
  { id: 'EMP-013', name: 'Chloe Adeyemi', role: 'Brand Designer', department: 'Marketing', level: 3, currentSalary: 81000 },
  { id: 'EMP-014', name: 'Mateo Silva', role: 'Engineering Manager', department: 'Engineering', level: 7, currentSalary: 168000 },
  { id: 'EMP-015', name: 'Hannah Petrov', role: 'Financial Controller', department: 'Finance', level: 6, currentSalary: 151000 },
  { id: 'EMP-016', name: 'Ryan Foster', role: 'Support Specialist', department: 'Sales', level: 1, currentSalary: 41000 },
  { id: 'EMP-017', name: 'Isabella Rossi', role: 'VP of Product', department: 'Product', level: 8, currentSalary: 205000 },
  { id: 'EMP-018', name: 'Kwame Mensah', role: 'Staff Engineer', department: 'Engineering', level: 6, currentSalary: 160000 },
  { id: 'EMP-019', name: 'Grace Lindqvist', role: 'Head of People', department: 'HR', level: 7, currentSalary: 171000 },
  { id: 'EMP-020', name: 'Diego Herrera', role: 'Account Executive', department: 'Sales', level: 3, currentSalary: 75500 },
  { id: 'EMP-021', name: 'Amara Okafor', role: 'Data Analyst', department: 'Finance', level: 4, currentSalary: 92000 },
  { id: 'EMP-022', name: 'Felix Andersen', role: 'Product Analyst', department: 'Product', level: 3, currentSalary: 88000 },
  { id: 'EMP-023', name: 'Nadia Hassan', role: 'Content Strategist', department: 'Marketing', level: 4, currentSalary: 99500 },
  { id: 'EMP-024', name: 'Owen Bennett', role: 'Support Specialist', department: 'Sales', level: 1, currentSalary: 47500 },
];

/** Umbral de inequidad interna definido por política de RRHH (> 10%). */
export const INEQUITY_THRESHOLD = 0.1;
