import React, { useState, useEffect } from 'react';
import { Card } from '../components/atoms/Card';
import { Button } from '../components/atoms/Button';
import { Badge } from '../components/atoms/Badge';
import { useAuth } from '../context/AuthContext';
import { useCompensation, formatCurrency } from '../context/CompensationContext';
import { useLanguage } from '../context/LanguageContext';
import {
  User,
  Mail,
  Briefcase,
  Building,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Key,
  FileText,
  Sliders,
  Calendar,
  Lock,
  Check,
  Edit3,
  Save,
  Award,
  Sparkles,
  Download,
  LogOut,
  AlertCircle,
  Database,
  History,
  CheckCheck,
} from 'lucide-react';

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { employees, bands, metrics } = useCompensation();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState('info'); // 'info' | 'permissions' | 'activity' | 'security'
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Form State initialized with user data or defaults
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || '',
    department: user?.department || '',
    location: user?.location || '',
    timezone: user?.timezone || 'UTC-5 (América/Bogotá)',
    phone: user?.phone || '',
    employeeId: user?.id ? `EQW-${user.id.slice(0, 5).toUpperCase()}` : 'EQW-USR-M',
    license: user?.license || '',
  });

  // Synchronize form state whenever user profile changes in context
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || '',
        role: user.role || '',
        department: user.department || '',
        location: user.location || '',
        timezone: user.timezone || 'UTC-5 (América/Bogotá)',
        phone: user.phone || '',
        employeeId: user.id ? `EQW-${user.id.slice(0, 5).toUpperCase()}` : 'EQW-USR-M',
        license: user.license || '',
      });
    }
  }, [user, isEditing]);

  // Password change state
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  const permissionsList = language === 'es' ? [
    {
      title: 'Modelado y Simulación Presupuestal',
      desc: 'Ajuste en tiempo real de percentiles P25, P50 y P75 sin alterar nómina activa.',
      granted: true,
    },
    {
      title: 'Aprobación de Nivelaciones Salariales',
      desc: 'Autoridad para congelar escenarios presupuestales y enviarlos a la Junta Directiva.',
      granted: true,
    },
    {
      title: 'Auditoría de Brecha Salarial de Género (Ley 1496)',
      desc: 'Inspección de paridad salarial por cargo con alertas tempranas ante disparidades >5%.',
      granted: true,
    },
    {
      title: 'Importación y Gestión de Nómina Confidencial',
      desc: 'Carga de archivos Excel/CSV de colaboradores y normalización de salarios.',
      granted: true,
    },
    {
      title: 'Exportación de Auditorías Ejecutivas (PDF & Excel)',
      desc: 'Generación local de informes con firma digital y marca de auditoría interna.',
      granted: true,
    },
    {
      title: 'Gestión de Respaldo y Almacenamiento Local',
      desc: 'Control sobre respaldos, purga de sesiones y políticas de retención de datos salariales.',
      granted: true,
    },
  ] : [
    {
      title: 'Budget Modeling & Simulation',
      desc: 'Real-time adjustment of P25, P50, and P75 percentiles without altering active payroll.',
      granted: true,
    },
    {
      title: 'Approval of Salary Alignments',
      desc: 'Authority to commit budget scenarios and submit them to executive leadership.',
      granted: true,
    },
    {
      title: 'Gender Pay Gap Audit (Equal Pay Compliance)',
      desc: 'Pay parity inspection by role with early warnings for disparities exceeding 5%.',
      granted: true,
    },
    {
      title: 'Confidential Payroll Import & Management',
      desc: 'Upload of employee Excel/CSV files and salary normalization.',
      granted: true,
    },
    {
      title: 'Executive Audit Reports Export (PDF & Excel)',
      desc: 'Local generation of reports with digital signature and internal audit badge.',
      granted: true,
    },
    {
      title: 'Local Storage & Backup Management',
      desc: 'Control over backups, session purge, and compensation data retention policies.',
      granted: true,
    },
  ];

  const activitiesList = language === 'es' ? [
    {
      time: 'Hoy, hace 25 min',
      action: 'Simulación Presupuestal Ejecutada',
      detail: 'Se modeló escenario de nivelación a Min-Band (P25) para 14 empleados con brecha negativa.',
      badge: 'Simulador',
      variant: 'primary',
    },
    {
      time: 'Hoy, 18:40',
      action: 'Informe Ejecutivo de Nómina Exportado',
      detail: 'Generación de archivo PDF oficial de auditoría salarial para el Comité de Remuneraciones.',
      badge: 'Informes',
      variant: 'success',
    },
    {
      time: 'Ayer, 16:15',
      action: 'Calibración de Banda Salarial L4',
      detail: 'Actualización del percentil P50 a $14,500,000 COP para el cargo Senior Software Engineer.',
      badge: 'Bandas',
      variant: 'warning',
    },
    {
      time: '04 Nov 2026, 11:20',
      action: 'Dataset de Nómina Q4 Importado',
      detail: 'Carga masiva de 124 colaboradores y validación automática de campos requeridos sin errores.',
      badge: 'Empleados',
      variant: 'info',
    },
    {
      time: '01 Nov 2026, 09:00',
      action: 'Inicio de Sesión de Auditoría Verificado',
      detail: 'Autenticación exitosa del analista en la sesión local protegida.',
      badge: 'Seguridad',
      variant: 'legal',
    },
  ] : [
    {
      time: 'Today, 25 mins ago',
      action: 'Budget Simulation Executed',
      detail: 'Modeled alignment scenario to Min-Band (P25) for 14 employees with negative gap.',
      badge: 'Simulator',
      variant: 'primary',
    },
    {
      time: 'Today, 18:40',
      action: 'Executive Compensation Report Exported',
      detail: 'Generated official salary audit PDF for the Compensation Committee.',
      badge: 'Reports',
      variant: 'success',
    },
    {
      time: 'Yesterday, 16:15',
      action: 'Salary Band L4 Calibration',
      detail: 'Updated P50 percentile to $14,500,000 COP for Senior Software Engineer.',
      badge: 'Bands',
      variant: 'warning',
    },
    {
      time: 'Nov 04, 2026, 11:20',
      action: 'Q4 Payroll Dataset Imported',
      detail: 'Batch upload of 124 employees and automatic validation of required fields.',
      badge: 'Employees',
      variant: 'info',
    },
    {
      time: 'Nov 01, 2026, 09:00',
      action: 'Audit Session Verified',
      detail: 'Successful authentication of analyst in protected local session.',
      badge: 'Security',
      variant: 'legal',
    },
  ];

  const displayInitials = user?.initials || formData.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'JZ';

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (updateProfile) {
      await updateProfile({
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        location: formData.location,
        timezone: formData.timezone,
        phone: formData.phone,
        license: formData.license,
      });
    }
    setIsEditing(false);
    setSaveStatus(t('profile.profileSavedSuccess'));
    setTimeout(() => setSaveStatus(null), 4000);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwordState.currentPassword) {
      setPasswordFeedback({ type: 'error', text: language === 'es' ? 'Por favor ingresa tu contraseña actual.' : 'Please enter your current password.' });
      return;
    }
    if (passwordState.newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: t('profile.passwordLengthError') });
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      setPasswordFeedback({ type: 'error', text: language === 'es' ? 'Las nuevas contraseñas no coinciden.' : 'New passwords do not match.' });
      return;
    }

    setPasswordFeedback({ type: 'success', text: t('profile.passwordSuccess') });
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordFeedback(null), 4500);
  };

  const handleExportAuditCredential = () => {
    const credentialData = {
      user: formData.fullName,
      email: formData.email,
      role: formData.role,
      department: formData.department,
      license: formData.license,
      issuedAt: new Date().toISOString(),
      governance: 'Ley 1496 de 2011 & Equal Pay Audit Standards',
      environment: 'EquiWage Analytics Local Protected Session',
    };
    const blob = new Blob([JSON.stringify(credentialData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credencial-auditor-${formData.username}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* ═══════════════════════════════════════════
          Hero Profile Card with Glass Finish
          ═══════════════════════════════════════════ */}
      <Card className="p-6 sm:p-8 bg-white/70 dark:bg-[#181920]/85 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-lg relative overflow-hidden">
        {/* Warm Ambient Glow Flare in Background */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-orange-500/25 to-amber-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 min-w-0">
            {/* Glowing Big Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-primary via-orange-500 to-amber-400 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-xl shadow-orange-500/30 border-2 border-white/30 backdrop-blur-md">
                {displayInitials}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#16100E] flex items-center justify-center text-white shadow-sm"
                title={language === 'es' ? 'Sesión local activa y verificada' : 'Active and verified local session'}
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            </div>

            {/* User Core Identification */}
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-content-main tracking-tight truncate">
                  {formData.fullName}
                </h1>
                <Badge variant="successOutline" className="gap-1.5 text-xs font-semibold py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {language === 'es' ? 'Auditor Activo' : 'Active Auditor'}
                </Badge>
                <Badge variant="default" className="text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {formData.employeeId}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-content-muted font-medium">
                {formData.role ? (
                  <span className="flex items-center gap-1.5 text-content-main font-semibold">
                    <Briefcase className="w-4 h-4 text-primary shrink-0" />
                    {formData.role}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-content-muted/70 italic text-xs">
                    <Briefcase className="w-4 h-4 text-content-muted/50 shrink-0" />
                    {language === 'es' ? 'Sin cargo asignado' : 'No title assigned'}
                  </span>
                )}
                {formData.department ? (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-content-muted shrink-0" />
                    {formData.department}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-content-muted/70 italic text-xs">
                    <Building className="w-4 h-4 text-content-muted/50 shrink-0" />
                    {language === 'es' ? 'Sin departamento' : 'No department'}
                  </span>
                )}
                {formData.location ? (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-content-muted shrink-0" />
                    {formData.location}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-content-muted/70 italic text-xs">
                    <MapPin className="w-4 h-4 text-content-muted/50 shrink-0" />
                    {language === 'es' ? 'Ubicación no especificada' : 'No location specified'}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-content-muted">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-content-muted" />
                  {formData.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-content-muted" />
                  {formData.timezone}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full lg:w-auto shrink-0 pt-2 lg:pt-0">
            {isEditing ? (
              <>
                <Button
                  variant="primary"
                  className="gap-2 flex-1 sm:flex-initial shadow-md shadow-primary/25"
                  onClick={handleSaveProfile}
                >
                  <Save className="w-4 h-4" />
                  {t('profile.saveProfile')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 sm:flex-initial"
                  onClick={() => setIsEditing(false)}
                >
                  {t('common.cancel')}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  className="gap-2 flex-1 sm:flex-initial shadow-md shadow-primary/25"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4" />
                  {t('profile.editInfo')}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 flex-1 sm:flex-initial"
                  onClick={handleExportAuditCredential}
                  title={t('profile.credentialTooltip')}
                >
                  <Download className="w-4 h-4" />
                  {t('profile.credential')}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Global Save Feedback Alert */}
        {saveStatus && (
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{saveStatus}</span>
          </div>
        )}
      </Card>

      {/* ═══════════════════════════════════════════
          Quick KPIs Row — Compensation Governance
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex items-center gap-4 bg-white/60 dark:bg-[#181920]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/15 text-primary flex items-center justify-center shrink-0 border border-orange-500/20">
            <Sliders className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-content-muted font-medium truncate">{t('profile.simulationsRun')}</p>
            <p className="text-xl font-extrabold text-content-main tracking-tight mt-0.5">{t('profile.simulationsCount')}</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {t('profile.lastSessionToday')}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white/60 dark:bg-[#181920]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-content-muted font-medium truncate">{t('profile.auditedEmployees')}</p>
            <p className="text-xl font-extrabold text-content-main tracking-tight mt-0.5">
              {employees.length > 0 ? employees.length : 124} {t('profile.activeEmployees')}
            </p>
            <p className="text-[11px] text-content-muted font-medium mt-0.5">
              {t('profile.inBands', { count: bands.length > 0 ? bands.length : 8 })}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white/60 dark:bg-[#181920]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-content-muted font-medium truncate">{t('profile.equityIndex')}</p>
            <p className="text-xl font-extrabold text-content-main tracking-tight mt-0.5">
              {metrics?.alignmentRate ? `${metrics.alignmentRate}%` : '94.8%'}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              {t('profile.legalCompliance')}
            </p>
          </div>
        </Card>

        <Card className="p-5 flex items-center gap-4 bg-white/60 dark:bg-[#181920]/70 backdrop-blur-xl border border-white/40 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Database className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-content-muted font-medium truncate">{t('profile.dataSecurity')}</p>
            <p className="text-xl font-extrabold text-content-main tracking-tight mt-0.5">{t('profile.localSecurity')}</p>
            <p className="text-[11px] text-content-muted font-medium mt-0.5">{t('profile.localVault')}</p>
          </div>
        </Card>
      </div>

      {/* ═══════════════════════════════════════════
          Tabs Navigation for Detailed Sections
          ═══════════════════════════════════════════ */}
      <div className="flex border-b border-border/80 dark:border-white/10 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'info', label: t('profile.tab.info'), icon: User },
          { id: 'permissions', label: t('profile.tab.permissions'), icon: ShieldCheck },
          { id: 'activity', label: t('profile.tab.activity'), icon: History },
          { id: 'security', label: t('profile.tab.security'), icon: Lock },
        ].map(({ id, label, icon: TabIcon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-md shadow-primary/25'
                  : 'text-content-muted hover:text-content-main hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════
          TAB 1: Información Profesional y Personal
          ═══════════════════════════════════════════ */}
      {activeTab === 'info' && (
        <Card className="p-6 sm:p-8 bg-white/70 dark:bg-[#181920]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
            <div>
              <h2 className="text-lg font-bold text-content-main tracking-tight">
                {t('profile.infoTitle')}
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                {t('profile.infoSubtitle')}
              </p>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-3.5 h-3.5" />
                {t('common.edit')}
              </Button>
            )}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.fullName')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-medium text-sm">
                    {formData.fullName}
                  </p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.username')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-mono text-sm">
                    @{formData.username}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.email')}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-medium text-sm flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary shrink-0" />
                    {formData.email}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.role')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.role}
                    placeholder={language === 'es' ? 'Ej: Analista de Compensaciones' : 'e.g. Compensation Analyst'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-medium text-sm flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary shrink-0" />
                    {formData.role || (
                      <span className="text-content-muted/60 italic font-normal">
                        {language === 'es' ? 'Sin cargo asignado (haz clic en editar para agregar)' : 'No title assigned (click edit to add)'}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.department')}
                </label>
                {isEditing ? (
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="">{language === 'es' ? '-- Seleccionar departamento --' : '-- Select department --'}</option>
                    <option value="HR">{language === 'es' ? 'Recursos Humanos (HR)' : 'Human Resources (HR)'}</option>
                    <option value="People & Total Rewards">{language === 'es' ? 'People & Total Rewards (Compensación Total)' : 'People & Total Rewards'}</option>
                    <option value="Compensation & Benefits">{language === 'es' ? 'Compensaciones y Beneficios' : 'Compensation & Benefits'}</option>
                    <option value="Finance & Payroll">{language === 'es' ? 'Finanzas y Nómina' : 'Finance & Payroll'}</option>
                    <option value="Executive Management">{language === 'es' ? 'Dirección Ejecutiva' : 'Executive Management'}</option>
                  </select>
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-medium text-sm flex items-center gap-2">
                    <Building className="w-4 h-4 text-content-muted shrink-0" />
                    {formData.department || (
                      <span className="text-content-muted/60 italic font-normal">
                        {language === 'es' ? 'Sin departamento seleccionado' : 'No department selected'}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.location')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location}
                    placeholder={language === 'es' ? 'Ej: Bogotá, Colombia • Sede Central' : 'e.g. New York, USA • HQ'}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-medium text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-content-muted shrink-0" />
                    {formData.location || (
                      <span className="text-content-muted/60 italic font-normal">
                        {language === 'es' ? 'No especificada' : 'Not specified'}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.phone')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.phone}
                    placeholder={language === 'es' ? 'Ej: +57 (312) 849-2031' : 'e.g. +1 (555) 234-5678'}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-medium text-sm flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary shrink-0" />
                    {formData.phone || (
                      <span className="text-content-muted/60 italic font-normal">
                        {language === 'es' ? 'No registrado' : 'Not registered'}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Professional License */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.license')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.license}
                    placeholder={language === 'es' ? 'Ej: CPHR-CO-2024-9128' : 'e.g. CPHR-US-2024-9128'}
                    onChange={(e) => handleInputChange('license', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                ) : (
                  <p className="px-3.5 py-2.5 rounded-xl bg-surface-light/60 dark:bg-white/[0.03] border border-border/40 text-content-main font-mono text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    {formData.license || (
                      <span className="text-content-muted/60 italic font-sans font-normal">
                        {language === 'es' ? 'Sin licencia registrada' : 'No license registered'}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                  {t('common.cancel')}
                </Button>
                <Button variant="primary" type="submit" className="gap-2 shadow-md shadow-primary/30">
                  <Save className="w-4 h-4" />
                  {t('common.saveChanges')}
                </Button>
              </div>
            )}
          </form>
        </Card>
      )}

      {/* ═══════════════════════════════════════════
          TAB 2: Roles y Permisos de Compensación
          ═══════════════════════════════════════════ */}
      {activeTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 sm:p-8 bg-white/70 dark:bg-[#181920]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-content-main tracking-tight">
                  {language === 'es' ? 'Matriz de Autorización y Permisos' : 'Authorization & Permissions Matrix'}
                </h2>
                <p className="text-xs text-content-muted mt-0.5">
                  {language === 'es' ? 'Capacidades asignadas a tu cuenta bajo la política corporativa de Total Rewards.' : 'Capabilities assigned to your account under corporate Total Rewards policy.'}
                </p>
              </div>
              <Badge variant="successOutline" className="gap-1.5 py-1 px-3">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                {language === 'es' ? 'Nivel 4: Super Admin' : 'Level 4: Super Admin'}
              </Badge>
            </div>

            <div className="space-y-3.5">
              {permissionsList.map(({ title, desc, granted }) => (
                <div
                  key={title}
                  className="p-4 rounded-2xl bg-surface-light/40 dark:bg-white/[0.03] border border-border/50 flex items-start gap-4 hover:border-primary/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/25">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-content-main">{title}</p>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{t('profile.enabled')}</span>
                    </div>
                    <p className="text-xs text-content-muted mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Compliance & Standards Card */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/70 dark:bg-[#181920]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-4 border border-amber-500/20">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-content-main mb-1.5">
                {t('profile.certTitle')}
              </h3>
              <p className="text-xs text-content-muted leading-relaxed mb-4">
                {t('profile.certDesc')}
              </p>
              <div className="space-y-2.5 text-xs text-content-muted pt-2 border-t border-border/60">
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'es' ? 'Ley 1496 de 2011 (Igualdad Salarial)' : 'Law 1496 of 2011 (Equal Pay Act)'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'es' ? 'Convenio OIT 100 sobre Igualdad de Remuneración' : 'ILO Convention 100 on Equal Remuneration'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'es' ? 'Directiva UE 2023/970 sobre Transparencia Retributiva' : 'EU Directive 2023/970 on Pay Transparency'}</span>
                </p>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-primary/10 via-orange-500/5 to-transparent border border-primary/20">
              <h4 className="text-xs font-bold text-primary tracking-widest uppercase mb-1">
                {t('profile.governanceTitle')}
              </h4>
              <p className="text-xs text-content-muted leading-relaxed">
                {t('profile.governanceDesc')}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          TAB 3: Registro de Actividad y Auditorías
          ═══════════════════════════════════════════ */}
      {activeTab === 'activity' && (
        <Card className="p-6 sm:p-8 bg-white/70 dark:bg-[#181920]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/60">
            <div>
              <h2 className="text-lg font-bold text-content-main tracking-tight">
                {t('profile.activityTitle')}
              </h2>
              <p className="text-xs text-content-muted mt-0.5">
                {t('profile.activitySubtitle')}
              </p>
            </div>
            <Badge variant="default" className="text-xs font-medium">
              {t('profile.recentEvents', { count: 5 })}
            </Badge>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60 dark:before:bg-white/10">
            {activitiesList.map(({ time, action, detail, badge, variant }) => (
              <div key={action} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full bg-primary border-2 border-white dark:border-[#16100E] shadow-sm shadow-primary/50 group-hover:scale-125 transition-transform" />

                <div className="p-4 rounded-2xl bg-surface-light/40 dark:bg-white/[0.03] backdrop-blur-md border border-border/50 hover:border-primary/30 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold text-content-main">{action}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant={variant} className="text-[10px] font-bold px-2.5 py-0.5 shadow-sm">
                        {badge}
                      </Badge>
                      <span className="text-xs text-content-muted">{time}</span>
                    </div>
                  </div>
                  <p className="text-xs text-content-muted leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ═══════════════════════════════════════════
          TAB 4: Seguridad y Bóveda Local
          ═══════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="max-w-2xl">
          {/* Change Password Card */}
          <Card className="p-6 sm:p-8 bg-white/70 dark:bg-[#181920]/80 backdrop-blur-2xl border border-white/50 dark:border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-content-main">{t('profile.passwordTitle')}</h3>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 mt-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.currentPassword')}
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passwordState.currentPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.newPassword')}
                </label>
                <input
                  type="password"
                  placeholder={language === 'es' ? 'Mínimo 6 caracteres' : 'Minimum 6 characters'}
                  value={passwordState.newPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-content-main uppercase tracking-wider">
                  {t('profile.confirmPassword')}
                </label>
                <input
                  type="password"
                  placeholder={language === 'es' ? 'Repite la contraseña' : 'Repeat password'}
                  value={passwordState.confirmPassword}
                  onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border dark:border-white/10 bg-surface text-content-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    passwordFeedback.type === 'error'
                      ? 'bg-red-500/15 border border-red-500/30 text-red-500'
                      : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-500'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordFeedback.text}</span>
                </div>
              )}

              <Button variant="primary" type="submit" className="w-full gap-2 shadow-md shadow-primary/25 mt-2">
                <Lock className="w-4 h-4" />
                {t('profile.updateCredentials')}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
