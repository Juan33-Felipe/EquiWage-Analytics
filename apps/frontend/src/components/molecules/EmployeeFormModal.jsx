import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Edit3, AlertCircle, Check } from 'lucide-react';
import { Button } from '../atoms/Button';
import { DEPARTMENTS } from '@equiwage/shared';

export function EmployeeFormModal({ isOpen, onClose, onSave, initialEmployee = null }) {
  const isEditing = Boolean(initialEmployee);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: '',
    department: 'Engineering',
    level: 1,
    currentSalary: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialEmployee) {
      setFormData({
        id: initialEmployee.id || '',
        name: initialEmployee.name || '',
        role: initialEmployee.role || '',
        department: initialEmployee.department || 'Engineering',
        level: Number(initialEmployee.level) || 1,
        currentSalary: initialEmployee.currentSalary !== undefined ? String(initialEmployee.currentSalary) : '',
      });
    } else {
      // Suggest next employee id
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setFormData({
        id: `EMP-${randomSuffix}`,
        name: '',
        role: '',
        department: 'Engineering',
        level: 1,
        currentSalary: '',
      });
    }
    setErrors({});
  }, [initialEmployee, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.id?.trim()) errs.id = 'Employee ID is required';
    if (!formData.name?.trim()) errs.name = 'Full name is required';
    if (!formData.role?.trim()) errs.role = 'Role / Job title is required';
    if (!formData.department?.trim()) errs.department = 'Department is required';
    const salaryNum = Number(formData.currentSalary);
    if (!formData.currentSalary || isNaN(salaryNum) || salaryNum <= 0) {
      errs.currentSalary = 'Base salary must be a positive number';
    }
    const levelNum = Number(formData.level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 8) {
      errs.level = 'Level must be between 1 and 8';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        id: formData.id.trim(),
        name: formData.name.trim(),
        role: formData.role.trim(),
        department: formData.department.trim(),
        level: Number(formData.level),
        currentSalary: Number(formData.currentSalary),
      };
      const result = await onSave(payload, isEditing);
      if (result?.ok) {
        onClose();
      } else if (result?.error) {
        setErrors({ submit: result.error });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg bg-surface dark:bg-dark-surface rounded-2xl shadow-soft border border-slate-100 dark:border-dark-border p-6 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-primary flex items-center justify-center shadow-sm">
                {isEditing ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-content-main dark:text-dark-text tracking-tight">
                  {isEditing ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                </h3>
                <p className="text-xs text-content-muted dark:text-dark-muted">
                  {isEditing
                    ? 'Actualiza los datos del empleado y recalcula auditoría en tiempo real.'
                    : 'Añade un empleado al registro local de nómina.'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-content-muted hover:text-content-main hover:bg-slate-100 dark:hover:bg-dark-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errors.submit && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errors.submit}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Employee ID */}
              <div>
                <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                  ID Empleado
                </label>
                <input
                  type="text"
                  value={formData.id}
                  disabled={isEditing}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                  placeholder="EMP-001"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono transition-all ${
                    isEditing
                      ? 'bg-slate-100 dark:bg-dark-border/40 text-content-muted cursor-not-allowed border-slate-200 dark:border-dark-border'
                      : 'bg-surface dark:bg-dark-surface border-slate-200 dark:border-dark-border text-content-main dark:text-dark-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  } ${errors.id ? 'border-rose-400 focus:ring-rose-200' : ''}`}
                />
                {errors.id && <p className="text-[11px] text-rose-500 mt-1">{errors.id}</p>}
              </div>

              {/* Level */}
              <div>
                <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                  Nivel de Puesto (L1 - L8)
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Nivel {lvl} (L{lvl})
                    </option>
                  ))}
                </select>
                {errors.level && <p className="text-[11px] text-rose-500 mt-1">{errors.level}</p>}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                Nombre Completo
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej. Juan Pérez"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                  errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-dark-border'
                }`}
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            {/* Role & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                  Cargo / Rol
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Ej. Software Engineer"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.role ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-dark-border'
                  }`}
                />
                {errors.role && <p className="text-[11px] text-rose-500 mt-1">{errors.role}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                  Departamento
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Current Fixed Base Salary */}
            <div>
              <label className="block text-xs font-semibold text-content-main dark:text-dark-text mb-1.5">
                Salario Base Fijo Anual (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted dark:text-dark-muted font-semibold text-sm">
                  $
                </span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.currentSalary}
                  onChange={(e) => setFormData({ ...formData, currentSalary: e.target.value })}
                  placeholder="55000"
                  className={`w-full pl-8 pr-3.5 py-2.5 rounded-xl border bg-surface dark:bg-dark-surface text-content-main dark:text-dark-text text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                    errors.currentSalary ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 dark:border-dark-border'
                  }`}
                />
              </div>
              <p className="text-[11px] text-content-muted dark:text-dark-muted mt-1">
                La auditoría y el cumplimiento legal validan estrictamente el salario base fijo.
              </p>
              {errors.currentSalary && <p className="text-[11px] text-rose-500 mt-1">{errors.currentSalary}</p>}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-dark-border flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" className="gap-2" disabled={isSubmitting}>
                <Check className="w-4 h-4" />
                {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Registrar Empleado'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
