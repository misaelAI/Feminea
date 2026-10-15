import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Baby,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flower2,
  Heart,
  Leaf,
  Printer,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type PeriodEntry = { id: string; start: string; end: string };
type SymptomEntry = { id: string; date: string; items: string[]; intensity: number; notes: string };
type HealthData = { periods: PeriodEntry[]; symptoms: SymptomEntry[]; cycleLength: number; dueDate: string };

const STORAGE_KEY = "feminea-health-journal-v1";
const FEEDBACK_URL = "https://docs.google.com/forms/d/e/1FAIpQLSf_im9QrUODLDGVkkKqEnVIy-aQOAqyAELWYqksfk8DHv8evQ/viewform?usp=publish-editor";
const initialData: HealthData = { periods: [], symptoms: [], cycleLength: 28, dueDate: "" };
const symptomOptions = ["Cólicos", "Dolor de cabeza", "Cansancio", "Hinchazón", "Dolor de espalda", "Sensibilidad en los senos", "Cambios de ánimo", "Flujo", "Manchado", "Sueño", "Náuseas", "Otro"];
const weekdays = ["L", "M", "X", "J", "V", "S", "D"];

function todayString() {
  return toDateInput(new Date());
}
function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function fromDateInput(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}
function shiftDate(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}
function dayDifference(later: Date, earlier: Date) {
  const a = Date.UTC(later.getFullYear(), later.getMonth(), later.getDate());
  const b = Date.UTC(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((a - b) / 86_400_000);
}
function prettyDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es", options ?? { day: "numeric", month: "long", year: "numeric" }).format(fromDateInput(value));
}
function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function readHealthData(): HealthData {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<HealthData> | null;
    if (!parsed) return initialData;
    return {
      periods: Array.isArray(parsed.periods) ? parsed.periods : [],
      symptoms: Array.isArray(parsed.symptoms) ? parsed.symptoms : [],
      cycleLength: Number.isFinite(parsed.cycleLength) ? Number(parsed.cycleLength) : 28,
      dueDate: typeof parsed.dueDate === "string" ? parsed.dueDate : "",
    };
  } catch {
    return initialData;
  }
}

const quickLinks: { id: string; label: string; detail: string; icon: LucideIcon; tone: string }[] = [
  { id: "calendario", label: "Saber cuándo me llegará el periodo", detail: "Registra tus fechas y mira una estimación.", icon: CalendarDays, tone: "pink" },
  { id: "cuerpo", label: "Comprender mejor mi cuerpo", detail: "Conoce las fases, a tu ritmo y sin mitos.", icon: Flower2, tone: "lavender" },
  { id: "sintomas", label: "Hacer un seguimiento de los síntomas", detail: "Anota cómo te sientes día a día.", icon: Activity, tone: "peach" },
  { id: "consulta", label: "Listar síntomas para los médicos", detail: "Lleva tus notas a una consulta.", icon: ClipboardList, tone: "lavender" },
  { id: "fertilidad", label: "Quedar en embarazo", detail: "Entiende el momento fértil y sus límites.", icon: Heart, tone: "pink" },
  { id: "embarazo", label: "Monitorear mi embarazo", detail: "Infórmate sobre el control prenatal.", icon: Baby, tone: "peach" },
];

function Logo() {
  return (
    <a className="brand" href="#inicio" aria-label="Feminea, ir al inicio">
      <img className="brand-wordmark" src="/feminea-wordmark.jpg" alt="" />
    </a>
  );
}

function TopicCloseButton({ open, onClick }: { open: boolean; onClick: () => void }) {
  return open ? <button className="topic-close" type="button" onClick={onClick} aria-label="Cerrar esta sección"><X size={19} /></button> : null;
}

function SectionHeading({ eyebrow, title, children, id }: { eyebrow: string; title: string; children?: ReactNode; id?: string }) {
  return (
    <div className="section-heading">
      <span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

function SourceLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noreferrer">{children}<ArrowRight size={13} aria-hidden="true" /></a>;
}

export default function Home() {
  const [data, setData] = useState<HealthData>(() => readHealthData());
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [periodMessage, setPeriodMessage] = useState("");
  const [symptomDate, setSymptomDate] = useState(todayString());
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(2);
  const [symptomNotes, setSymptomNotes] = useState("");
  const [symptomMessage, setSymptomMessage] = useState("");
  const [dueInput, setDueInput] = useState(() => readHealthData().dueDate);
  const [dueMessage, setDueMessage] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const topicTriggerRef = useRef<HTMLElement | null>(null);

  function openTopic(id: string) {
    topicTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setActiveTopic(id);
  }

  function closeTopic() {
    const focusTarget = topicTriggerRef.current;
    topicTriggerRef.current = null;
    setActiveTopic(null);
    window.requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
  }

  useEffect(() => {
    if (!activeTopic) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { closeTopic(); return; }
      if (event.key !== "Tab") return;
      const panel = document.getElementById(activeTopic);
      const focusable = Array.from(panel?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
      if (!focusable.length) { event.preventDefault(); return; }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    const focusFrame = window.requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${activeTopic} .topic-close`)?.focus({ preventScroll: true }));
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTopic]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* El navegador puede tener el almacenamiento desactivado. */ }
  }, [data]);

  const sortedPeriods = useMemo(() => [...data.periods].sort((a, b) => b.start.localeCompare(a.start)), [data.periods]);
  const sortedSymptoms = useMemo(() => [...data.symptoms].sort((a, b) => b.date.localeCompare(a.date)), [data.symptoms]);
  const latestPeriod = sortedPeriods[0];
  const nextPeriod = latestPeriod ? shiftDate(fromDateInput(latestPeriod.start), data.cycleLength) : null;
  const expectedOvulation = nextPeriod ? shiftDate(nextPeriod, -14) : null;
  const fertileStart = expectedOvulation ? shiftDate(expectedOvulation, -5) : null;
  const today = fromDateInput(todayString());
  const daysUntilNext = nextPeriod ? dayDifference(nextPeriod, today) : null;

  const calendarCells = useMemo(() => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const offset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
    const count = new Date(year, monthIndex + 1, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: count }, (_, index) => index + 1)];
  }, [month]);

  function isInPeriod(day: Date) {
    return data.periods.some((period) => {
      const start = fromDateInput(period.start);
      const end = period.end ? fromDateInput(period.end) : start;
      return day >= start && day <= end;
    });
  }
  function isPredictedPeriod(day: Date) {
    if (!nextPeriod || !latestPeriod) return false;
    const periodDuration = latestPeriod.end ? Math.max(1, dayDifference(fromDateInput(latestPeriod.end), fromDateInput(latestPeriod.start)) + 1) : 5;
    return day >= nextPeriod && day < shiftDate(nextPeriod, periodDuration);
  }
  function isFertile(day: Date) {
    return Boolean(fertileStart && expectedOvulation && day >= fertileStart && day <= expectedOvulation);
  }
  function selectCalendarDay(day: number) {
    const clicked = new Date(month.getFullYear(), month.getMonth(), day);
    setStartInput(toDateInput(clicked));
    setPeriodMessage(`Fecha seleccionada: ${prettyDate(toDateInput(clicked))}. Puedes añadirla a tu registro.`);
  }

  function savePeriod(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!startInput) { setPeriodMessage("Elige el primer día del sangrado."); return; }
    if (endInput && endInput < startInput) { setPeriodMessage("La fecha de fin no puede ser anterior al inicio."); return; }
    const entry = { id: makeId(), start: startInput, end: endInput };
    setData((current) => ({ ...current, periods: [entry, ...current.periods.filter((item) => item.start !== entry.start)].sort((a, b) => b.start.localeCompare(a.start)) }));
    setPeriodMessage(`Registro guardado para ${prettyDate(startInput)}.`);
    setStartInput(""); setEndInput("");
  }

  function saveSymptoms(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedSymptoms.length) { setSymptomMessage("Selecciona al menos un síntoma para guardar."); return; }
    const entry = { id: makeId(), date: symptomDate, items: selectedSymptoms, intensity, notes: symptomNotes.trim() };
    setData((current) => ({ ...current, symptoms: [entry, ...current.symptoms].sort((a, b) => b.date.localeCompare(a.date)) }));
    setSelectedSymptoms([]); setSymptomNotes(""); setSymptomMessage("Tu nota quedó guardada en este dispositivo.");
  }

  function saveDueDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setData((current) => ({ ...current, dueDate: dueInput }));
    setDueMessage(dueInput ? "Fecha guardada solo en este dispositivo." : "Se quitó la fecha guardada.");
  }

  function clearAllData() {
    if (!window.confirm("¿Quieres borrar de este dispositivo todos los periodos, síntomas y datos de embarazo guardados en Feminea?")) return;
    setData(initialData); setDueInput(""); setPeriodMessage("Se borraron tus datos de este dispositivo.");
    setSymptomMessage(""); setDueMessage("");
  }

  const pregnancyWeeks = data.dueDate ? Math.max(0, Math.floor((280 - dayDifference(fromDateInput(data.dueDate), today)) / 7)) : null;
  const pregnancyDays = data.dueDate ? Math.max(0, (280 - dayDifference(fromDateInput(data.dueDate), today)) % 7) : null;
  const trimester = pregnancyWeeks === null ? null : pregnancyWeeks < 14 ? "primer trimestre" : pregnancyWeeks < 28 ? "segundo trimestre" : "tercer trimestre";

  return (
    <div className="site-shell" id="inicio">
      <div className="top-note"><Sparkles size={14} /> Tu ciclo es tuyo. La información también debería ser clara.</div>
      <header className="site-header">
        <div className="header-inner">
          <Logo />
          <nav className="main-nav" aria-label="Navegación principal">
            <button type="button" onClick={() => openTopic("calendario")}>Mi calendario</button>
            <button type="button" onClick={() => openTopic("cuerpo")}>Conoce tu cuerpo</button>
            <button type="button" onClick={() => openTopic("sintomas")}>Síntomas</button>
            <a href="#fuentes">Fuentes</a>
          </nav>
          <button className="header-cta" type="button" onClick={() => openTopic("calendario")}>Empezar <ArrowRight size={15} /></button>
        </div>
      </header>
      {activeTopic && <div className="topic-backdrop" aria-hidden="true" onClick={closeTopic} />}

      <main>
        <section className="hero content-wrap" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-dot" /> Un espacio amable para conocerte</span>
            <h1 id="hero-title">Tu ciclo no es un misterio.<br /><em>Tu cuerpo te cuenta.</em></h1>
            <p>Entiende lo que pasa, lleva tus fechas y encuentra palabras para hablar de tu salud. Sin vergüenza. Sin adivinar sola.</p>
            <div className="hero-actions">
              <button className="button button-primary" type="button" onClick={() => openTopic("calendario")}>Empezar a conocer <ArrowRight size={17} /></button>
              <a className="text-link" href="#temas">Explorar temas <ArrowDown size={15} /></a>
            </div>
            <div className="hero-trust"><ShieldCheck size={17} /><span>Tu registro permanece en tu dispositivo.</span></div>
          </div>
          <div className="hero-visual">
            <div className="hero-sun" />
            <img src="/manus-storage/async-images/DsIDplVYPDiB2RYIPA7138/image-1.webp" alt="Ilustración suave de un calendario mensual con flores rosadas" />
            <div className="hero-sticker"><span className="sticker-flower"><Flower2 size={19} /></span><span><strong>Una fecha a la vez</strong><small>Tu registro, a tu manera</small></span></div>
            <span className="hero-sparkle sparkle-one">✳</span><span className="hero-sparkle sparkle-two">✧</span>
          </div>
          <a className="scroll-cue" href="#temas" aria-label="Desplazarse a los temas"><span /> DESLIZA PARA EXPLORAR</a>
        </section>

        <section className="topic-section content-wrap" id="temas" aria-labelledby="topic-title">
          <div className="topic-intro"><span className="eyebrow"><span className="eyebrow-dot" /> Empieza por donde quieras</span><h2 id="topic-title">¿Qué necesitas<br /><em>hoy?</em></h2></div>
          <div className="topic-grid">
            {quickLinks.map(({ id, label, detail, icon: Icon, tone }, index) => (
              <button id={`topic-${id}`} className={`topic-card tone-${tone}`} type="button" key={id} style={{ animationDelay: `${index * 70}ms` }} onClick={() => openTopic(id)} aria-haspopup="dialog" aria-controls={id}>
                <span className="topic-icon"><Icon size={21} strokeWidth={1.7} /></span>
                <span className="topic-copy"><strong>{label}</strong><small>{detail}</small></span>
                <ArrowRight className="topic-arrow" size={18} />
              </button>
            ))}
          </div>
        </section>

        <section className={`calendar-section section-band${activeTopic === "calendario" ? " topic-overlay-panel" : ""}`} id="calendario" aria-labelledby="calendar-title" role={activeTopic === "calendario" ? "dialog" : undefined} aria-modal={activeTopic === "calendario" ? true : undefined} tabIndex={activeTopic === "calendario" ? -1 : undefined}>
          <TopicCloseButton open={activeTopic === "calendario"} onClick={closeTopic} />
          <div className="content-wrap">
            <SectionHeading id="calendar-title" eyebrow="01 · Tu espacio personal" title="Un calendario hecho para escucharte.">
              Anota tus fechas, descubre tus patrones y mira una estimación con lo que has registrado. Tu historia no tiene que ser perfecta para empezar.
            </SectionHeading>
            <div className="calendar-layout">
              <div className="calendar-main card-surface">
                <div className="calendar-card-head">
                  <div><span className="micro-label">MI CALENDARIO</span><h3>{new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(month)}</h3></div>
                  <div className="month-controls" aria-label="Cambiar mes">
                    <button type="button" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
                    <button type="button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
                  </div>
                </div>
                <div className="calendar-grid" role="grid" aria-label={`Calendario de ${new Intl.DateTimeFormat("es", { month: "long", year: "numeric" }).format(month)}`}>
                  {weekdays.map((day) => <span className="weekday" role="columnheader" key={day}>{day}</span>)}
                  {calendarCells.map((day, index) => {
                    if (!day) return <span className="calendar-empty" key={`empty-${index}`} />;
                    const date = new Date(month.getFullYear(), month.getMonth(), day);
                    const period = isInPeriod(date);
                    const predicted = !period && isPredictedPeriod(date);
                    const fertile = !period && !predicted && isFertile(date);
                    const isToday = toDateInput(date) === todayString();
                    return <button className={`calendar-day${period ? " is-period" : ""}${predicted ? " is-predicted" : ""}${fertile ? " is-fertile" : ""}${isToday ? " is-today" : ""}`} type="button" role="gridcell" key={day} onClick={() => selectCalendarDay(day)} aria-label={`${prettyDate(toDateInput(date))}${period ? ", menstruación registrada" : predicted ? ", periodo estimado" : fertile ? ", ventana fértil aproximada" : ""}`} title="Seleccionar como primer día del sangrado">
                      <span>{day}</span>{period && <i />}{predicted && <i />}{fertile && <i />}
                    </button>;
                  })}
                </div>
                <div className="calendar-legend"><span><i className="legend-period" /> Registrado</span><span><i className="legend-predicted" /> Estimado</span><span><i className="legend-fertile" /> Ventana fértil aprox.</span></div>
                <p className="calendar-help">Selecciona una fecha del calendario para colocarla como inicio del registro.</p>
              </div>
              <aside className="cycle-aside">
                <div className="forecast-card">
                  <span className="forecast-icon"><CalendarDays size={20} /></span>
                  <span className="micro-label">TU PRÓXIMO PERIODO · ESTIMACIÓN</span>
                  <strong className="forecast-date">{nextPeriod ? prettyDate(toDateInput(nextPeriod), { day: "numeric", month: "long" }) : "Aún sin registro"}</strong>
                  <span className="forecast-sub">{daysUntilNext === null ? "Guarda tu primer día para comenzar." : daysUntilNext >= 0 ? `En unos ${daysUntilNext} ${daysUntilNext === 1 ? "día" : "días"} · puede variar.` : `La fecha estimada pasó hace ${Math.abs(daysUntilNext)} ${Math.abs(daysUntilNext) === 1 ? "día" : "días"}. Los ciclos cambian.`}</span>
                </div>
                <form className="period-form card-surface" onSubmit={savePeriod}>
                  <div className="form-title"><span className="form-symbol"><Flower2 size={18} /></span><div><strong>Registrar mi periodo</strong><small>Solo se guarda en este dispositivo</small></div></div>
                  <label>Primer día del sangrado<input type="date" value={startInput} onChange={(event) => setStartInput(event.target.value)} required /></label>
                  <label>Último día <span className="optional-label">(opcional)</span><input type="date" value={endInput} min={startInput || undefined} onChange={(event) => setEndInput(event.target.value)} /></label>
                  <label>Duración habitual de mi ciclo <span className="optional-label">(días)</span><input type="number" min="15" max="60" value={data.cycleLength} onChange={(event) => setData((current) => ({ ...current, cycleLength: Math.min(60, Math.max(15, Number(event.target.value) || 28)) }))} /></label>
                  <button className="button button-primary form-submit" type="submit">Guardar registro <ArrowRight size={16} /></button>
                  <p className="form-feedback" aria-live="polite">{periodMessage || ""}</p>
                </form>
                <div className="privacy-note"><ShieldCheck size={17} /><span><strong>Privado por diseño</strong> · Tus datos de salud se quedan aquí, en tu navegador.</span></div>
              </aside>
            </div>
            <div className="calendar-footnote"><span>Una estimación no es una promesa.</span> Los ciclos pueden variar por muchas razones. Feminea no diagnostica ni reemplaza un método anticonceptivo.</div>
          </div>
        </section>

        <section className={`learning-section content-wrap${activeTopic === "cuerpo" ? " topic-overlay-panel" : ""}`} id="cuerpo" aria-labelledby="body-title" role={activeTopic === "cuerpo" ? "dialog" : undefined} aria-modal={activeTopic === "cuerpo" ? true : undefined} tabIndex={activeTopic === "cuerpo" ? -1 : undefined}>
          <TopicCloseButton open={activeTopic === "cuerpo"} onClick={closeTopic} />
          <div className="learning-copy">
            <SectionHeading id="body-title" eyebrow="02 · Comprender mejor mi cuerpo" title="Un ciclo tiene fases. Tu experiencia es única.">
              El día 1 es el primer día de sangrado. A partir de ahí, las hormonas acompañan cambios en el útero y los ovarios; no todos los cuerpos siguen un calendario idéntico.
            </SectionHeading>
            <div className="phase-list">
              <div className="phase-row"><span className="phase-number">01</span><span className="phase-dot phase-rose" /><div><strong>Menstruación</strong><p>El útero desprende su revestimiento; aparece el sangrado.</p></div></div>
              <div className="phase-row"><span className="phase-number">02</span><span className="phase-dot phase-peach" /><div><strong>Fase folicular</strong><p>El cuerpo prepara un óvulo y el revestimiento uterino vuelve a crecer.</p></div></div>
              <div className="phase-row"><span className="phase-number">03</span><span className="phase-dot phase-lavender" /><div><strong>Ovulación</strong><p>Se libera un óvulo. El momento puede cambiar incluso entre ciclos.</p></div></div>
              <div className="phase-row"><span className="phase-number">04</span><span className="phase-dot phase-mauve" /><div><strong>Fase lútea</strong><p>El cuerpo se prepara; pueden aparecer cambios físicos o de ánimo.</p></div></div>
            </div>
            <div className="source-inline"><BookOpen size={16} /><span>Información basada en:</span><SourceLink href="https://medlineplus.gov/spanish/menstruation.html">MedlinePlus (Biblioteca Nacional de Medicina, EE. UU.)</SourceLink></div>
          </div>
          <div className="learning-visual"><span className="visual-orbit orbit-one" /><span className="visual-orbit orbit-two" /><img src="/manus-storage/async-images/DsIDplVYPDiB2RYIPA7138/image-2.webp" alt="Ilustración botánica de un útero y flores, símbolo de conocer el propio cuerpo" /><div className="image-caption"><Leaf size={16} /> Aprender también es cuidarte.</div></div>
        </section>

        <section className={`symptom-section section-band${activeTopic === "sintomas" ? " topic-overlay-panel" : ""}`} id="sintomas" aria-labelledby="symptoms-title" role={activeTopic === "sintomas" ? "dialog" : undefined} aria-modal={activeTopic === "sintomas" ? true : undefined} tabIndex={activeTopic === "sintomas" ? -1 : undefined}>
          <TopicCloseButton open={activeTopic === "sintomas"} onClick={closeTopic} />
          <div className="content-wrap">
            <div className="two-col-heading">
              <SectionHeading id="symptoms-title" eyebrow="03 · Hacer un seguimiento de los síntomas" title="Tus síntomas merecen ser escuchados.">
                Un registro puede ayudarte a notar patrones y contar con más claridad lo que sientes. No hace falta encontrar la palabra perfecta.
              </SectionHeading>
              <img className="section-art" src="/manus-storage/async-images/DsIDplVYPDiB2RYIPA7138/image-3.webp" alt="Cuaderno de autocuidado con una taza de té y flores" />
            </div>
            <div className="symptom-layout">
              <form className="symptom-form card-surface" onSubmit={saveSymptoms}>
                <div className="form-title"><span className="form-symbol lavender-symbol"><Activity size={18} /></span><div><strong>¿Cómo te sientes hoy?</strong><small>Marca todo lo que quieras registrar.</small></div></div>
                <label className="inline-label">Fecha<input type="date" value={symptomDate} onChange={(event) => setSymptomDate(event.target.value)} required /></label>
                <div className="symptom-options" aria-label="Síntomas para registrar">
                  {symptomOptions.map((symptom) => <button key={symptom} type="button" className={`symptom-chip${selectedSymptoms.includes(symptom) ? " selected" : ""}`} aria-pressed={selectedSymptoms.includes(symptom)} onClick={() => setSelectedSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom])}>{selectedSymptoms.includes(symptom) && <Check size={13} />}{symptom}</button>)}
                </div>
                <div className="intensity-field"><label htmlFor="intensity">Intensidad</label><div className="intensity-control"><span>Leve</span><input id="intensity" type="range" min="1" max="5" value={intensity} onChange={(event) => setIntensity(Number(event.target.value))} /><span>Intensa</span><strong>{intensity}/5</strong></div></div>
                <label>Nota para mí <span className="optional-label">(opcional)</span><textarea rows={3} maxLength={240} placeholder="¿Qué notaste? ¿Afectó tu día?" value={symptomNotes} onChange={(event) => setSymptomNotes(event.target.value)} /></label>
                <button className="button button-primary" type="submit">Guardar cómo me siento <ArrowRight size={16} /></button>
                <p className="form-feedback" aria-live="polite">{symptomMessage}</p>
              </form>
              <div className="symptom-log">
                <div className="log-heading"><div><span className="micro-label">TU REGISTRO</span><h3>Notas recientes</h3></div><span className="entry-count">{sortedSymptoms.length} {sortedSymptoms.length === 1 ? "nota" : "notas"}</span></div>
                {sortedSymptoms.length === 0 ? <div className="empty-state"><span><Sparkles size={21} /></span><strong>Aquí empieza tu registro.</strong><p>Cuando guardes una nota, aparecerá aquí.</p></div> : <div className="symptom-entries">{sortedSymptoms.slice(0, 8).map((entry) => <article className="symptom-entry" key={entry.id}><div className="entry-date"><span>{prettyDate(entry.date, { day: "numeric" })}</span><small>{prettyDate(entry.date, { month: "short" })}</small></div><div className="entry-body"><strong>{entry.items.join(" · ")}</strong><small>Intensidad {entry.intensity}/5{entry.notes ? ` · ${entry.notes}` : ""}</small></div><button type="button" className="icon-button" aria-label="Eliminar nota" onClick={() => setData((current) => ({ ...current, symptoms: current.symptoms.filter((item) => item.id !== entry.id) }))}><Trash2 size={15} /></button></article>)}</div>}
                <button className="soft-link" type="button" onClick={() => openTopic("consulta")}>Preparar una lista para mi consulta <ArrowRight size={15} /></button>
              </div>
            </div>
          </div>
        </section>

        <section className={`doctor-section content-wrap${activeTopic === "consulta" ? " topic-overlay-panel" : ""}`} id="consulta" aria-labelledby="doctor-title" role={activeTopic === "consulta" ? "dialog" : undefined} aria-modal={activeTopic === "consulta" ? true : undefined} tabIndex={activeTopic === "consulta" ? -1 : undefined}>
          <TopicCloseButton open={activeTopic === "consulta"} onClick={closeTopic} />
          <div className="doctor-art-wrap"><img src="/manus-storage/async-images/4i7vuofNrTFYTSwqZCPL62/image-1.webp" alt="Cuaderno con notas y un bolígrafo para preparar una consulta médica" /><span className="doctor-art-stamp"><Stethoscope size={19} /> Tus notas, tu voz</span></div>
          <div className="doctor-copy">
            <SectionHeading id="doctor-title" eyebrow="04 · Listar síntomas para los médicos" title="Lleva tus preguntas. Ocupa tu espacio.">
              Comparte lo que registraste si te sirve: desde cuándo pasa, qué intensidad tiene y cómo influye en tu día. Tú decides qué contar.
            </SectionHeading>
            <div className="appointment-prompts"><span><Check size={15} /> ¿Cuándo empezó y cuánto dura?</span><span><Check size={15} /> ¿Qué lo mejora o lo empeora?</span><span><Check size={15} /> ¿Afecta tu escuela, trabajo o descanso?</span></div>
            <div className="doctor-record-list">
              <div className="record-list-heading"><ClipboardList size={16} /><strong>Mis notas para compartir</strong><span>{sortedSymptoms.length} {sortedSymptoms.length === 1 ? "registro" : "registros"}</span></div>
              {sortedSymptoms.length === 0 ? <p className="doctor-empty">Todavía no hay síntomas registrados. Cuando anotes cómo te sientes, aparecerán aquí.</p> : <ul>{sortedSymptoms.map((entry) => <li key={entry.id}><strong>{prettyDate(entry.date)}</strong><span>{entry.items.join(" · ")} · Intensidad {entry.intensity}/5{entry.notes ? ` · ${entry.notes}` : ""}</span></li>)}</ul>}
              {sortedPeriods.length > 0 && <p className="doctor-period-note">Último periodo registrado: {prettyDate(sortedPeriods[0].start)}{sortedPeriods[0].end ? ` al ${prettyDate(sortedPeriods[0].end)}` : ""}.</p>}
            </div>
            <div className="doctor-actions"><button className="button button-primary" type="button" onClick={() => window.print()}><Printer size={16} /> Imprimir mi lista</button><span className="microcopy">La impresión incluye solo tus notas guardadas.</span></div>
            <p className="care-alert">Si un síntoma es intenso, nuevo o te preocupa, merece atención profesional. No tienes que esperar a que sea “lo bastante grave”.</p>
          </div>
        </section>

        <section className={`fertility-section section-band${activeTopic === "fertilidad" ? " topic-overlay-panel" : ""}`} id="fertilidad" aria-labelledby="fertility-title" role={activeTopic === "fertilidad" ? "dialog" : undefined} aria-modal={activeTopic === "fertilidad" ? true : undefined} tabIndex={activeTopic === "fertilidad" ? -1 : undefined}>
          <TopicCloseButton open={activeTopic === "fertilidad"} onClick={closeTopic} />
          <div className="content-wrap fertility-layout">
            <div className="fertility-copy">
              <SectionHeading id="fertility-title" eyebrow="05 · Quedar en embarazo" title="Conoce tu ventana fértil. Sin falsas certezas.">
                La ovulación suele ocurrir cerca de 12–16 días antes del siguiente periodo. La ventana fértil abarca varios días y cambia de una persona a otra; una app solo puede hacer una estimación.
              </SectionHeading>
              <div className="fertility-estimate"><span className="fertility-icon"><Heart size={20} /></span><div><span className="micro-label">SEGÚN LO QUE HAS REGISTRADO</span><strong>{fertileStart && expectedOvulation ? `${prettyDate(toDateInput(fertileStart), { day: "numeric", month: "short" })} – ${prettyDate(toDateInput(expectedOvulation), { day: "numeric", month: "short" })}` : "Registra tu ciclo para ver una estimación"}</strong><small>{expectedOvulation ? `Ovulación estimada cerca del ${prettyDate(toDateInput(expectedOvulation), { day: "numeric", month: "long" })}. Puede variar.` : "No es posible predecir la ovulación con precisión solo con fechas."}</small></div></div>
              <p className="safety-callout"><ShieldCheck size={17} /> Este calendario <strong>no es anticonceptivo</strong> ni confirma ovulación. Si buscas un embarazo, puedes consultar con personal de salud; si quieres evitarlo, pregunta por métodos anticonceptivos eficaces.</p>
              <div className="source-inline"><BookOpen size={16} /><span>Lee más:</span><SourceLink href="https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/">NHS · Fertilidad y ciclo menstrual</SourceLink></div>
            </div>
            <div className="fertility-visual"><img src="/manus-storage/async-images/4i7vuofNrTFYTSwqZCPL62/image-2.webp" alt="Ilustración de una semilla que crece entre fases lunares, símbolo de esperanza al planear un embarazo" /><div className="fertility-bubble"><Heart size={16} fill="currentColor" /> A tu ritmo</div></div>
          </div>
        </section>

        <section className={`pregnancy-section content-wrap${activeTopic === "embarazo" ? " topic-overlay-panel" : ""}`} id="embarazo" aria-labelledby="pregnancy-title" role={activeTopic === "embarazo" ? "dialog" : undefined} aria-modal={activeTopic === "embarazo" ? true : undefined} tabIndex={activeTopic === "embarazo" ? -1 : undefined}>
          <TopicCloseButton open={activeTopic === "embarazo"} onClick={closeTopic} />
          <div className="pregnancy-visual"><img src="/manus-storage/async-images/4i7vuofNrTFYTSwqZCPL62/image-3.webp" alt="Ilustración cálida de una persona embarazada acompañada de una rama floral" /><span className="pregnancy-deco">cuidarte<br />también cuenta</span></div>
          <div className="pregnancy-copy">
            <SectionHeading id="pregnancy-title" eyebrow="06 · Monitorear mi embarazo" title="Información para acompañarte, paso a paso.">
              El embarazo y cada cuerpo son distintos. El control prenatal permite que un equipo de salud te acompañe, responda preguntas y revise lo que necesitas.
            </SectionHeading>
            <div className="pregnancy-stage-list"><div><span className="stage-marker">01</span><strong>Primer trimestre</strong><small>Confirma el embarazo y organiza tu primera consulta.</small></div><div><span className="stage-marker">02</span><strong>Segundo trimestre</strong><small>Continúa los controles y conversa sobre cambios y pruebas.</small></div><div><span className="stage-marker">03</span><strong>Tercer trimestre</strong><small>Prepara el nacimiento con apoyo de tu equipo de salud.</small></div></div>
            <form className="due-date-form" onSubmit={saveDueDate}><label htmlFor="due-date">Si ya tienes una fecha probable de parto, puedes anotarla <span className="optional-label">(opcional)</span></label><div className="due-date-controls"><input id="due-date" type="date" value={dueInput} onChange={(event) => setDueInput(event.target.value)} /><button className="button button-secondary" type="submit">Guardar fecha</button></div><p className="form-feedback" aria-live="polite">{dueMessage}</p></form>
            {pregnancyWeeks !== null && <div className="pregnancy-week-card"><span className="week-number">{pregnancyWeeks}<small>sem</small><i>+{pregnancyDays}</i></span><span><strong>Estimación: {trimester}</strong><small>Calculada desde la fecha probable de parto que anotaste. Confírmala con tu equipo prenatal.</small></span></div>}
            <div className="source-inline"><BookOpen size={16} /><span>Información:</span><SourceLink href="https://www.who.int/health-topics/maternal-health">OMS · Salud materna</SourceLink><SourceLink href="https://medlineplus.gov/spanish/prenatalcare.html">MedlinePlus · Atención prenatal</SourceLink></div>
            <p className="urgent-note">Ante sangrado abundante, dolor fuerte, fiebre u otra señal que te preocupe durante el embarazo, contacta de inmediato a tu equipo de salud o a los servicios de urgencias de tu localidad.</p>
          </div>
        </section>

        <section className="source-section section-band" id="fuentes" aria-labelledby="sources-title">
          <div className="content-wrap">
            <SectionHeading id="sources-title" eyebrow="Información revisada · enlaces directos" title="Fuentes confiables. Palabras claras.">
              La salud menstrual es parte de la salud. Consulta estas fuentes públicas y profesionales para ampliar la información.
            </SectionHeading>
            <div className="source-cards">
              <article className="source-card"><span className="source-tag">INTERNACIONAL</span><strong>Organización Mundial de la Salud</strong><p>Salud menstrual, dignidad y atención.</p><SourceLink href="https://www.who.int/news-room/fact-sheets/detail/menstrual-health">Consultar la OMS</SourceLink></article>
              <article className="source-card"><span className="source-tag national-tag">FUENTE NACIONAL · EE. UU.</span><strong>MedlinePlus · Biblioteca Nacional de Medicina</strong><p>Menstruación, síntomas y cuándo pedir ayuda, en español.</p><SourceLink href="https://medlineplus.gov/spanish/menstruation.html">Leer MedlinePlus</SourceLink></article>
              <article className="source-card"><span className="source-tag national-tag">FUENTE NACIONAL · EE. UU.</span><strong>Oficina para la Salud de la Mujer (HHS)</strong><p>Información pública sobre ciclo menstrual y salud.</p><SourceLink href="https://espanol.womenshealth.gov/menstrual-cycle">Visitar womenshealth.gov</SourceLink></article>
              <article className="source-card"><span className="source-tag">REINO UNIDO</span><strong>NHS · Servicio Nacional de Salud</strong><p>Periodos, fertilidad y cambios que conviene consultar.</p><SourceLink href="https://www.nhs.uk/conditions/periods/">Leer la guía del NHS</SourceLink></article>
              <article className="source-card"><span className="source-tag">PROFESIONAL</span><strong>ACOG · Colegio Americano de Obstetras y Ginecólogos</strong><p>Guía para pacientes sobre síntomas premenstruales.</p><SourceLink href="https://www.acog.org/womens-health/faqs/premenstrual-syndrome">Consultar ACOG</SourceLink></article>
              <article className="source-card"><span className="source-tag">INTERNACIONAL</span><strong>OMS · Salud materna</strong><p>Orientación sobre atención durante el embarazo.</p><SourceLink href="https://www.who.int/health-topics/maternal-health">Consultar salud materna</SourceLink></article>
            </div>
            <p className="national-note"><strong>Nota sobre fuentes nacionales:</strong> no indicaste el país para el que se prepara esta página. Por eso identificamos las fuentes públicas nacionales estadounidenses disponibles en español y añadimos organismos internacionales. La guía y los servicios de salud pueden cambiar según tu país; consulta también el ministerio o autoridad sanitaria local.</p>
          </div>
        </section>

        <section className="feedback-banner content-wrap">
          <div className="feedback-flower"><Flower2 size={36} strokeWidth={1.3} /></div>
          <div><span className="eyebrow">Tu opinión hace crecer este espacio</span><h2>¿Nos dejas una reseña?</h2><p>Cuéntanos qué te sirvió y qué podemos explicar mejor.</p></div>
          <a className="button button-primary" href={FEEDBACK_URL} target="_blank" rel="noreferrer">Responder encuesta <ArrowRight size={16} /></a>
        </section>
      </main>

      <footer className="site-footer">
        <div className="content-wrap footer-inner"><div><Logo /><p>Conocer tu ciclo también es cuidar de ti.</p></div><div className="footer-links"><a href="#fuentes">Fuentes de salud</a><a href={FEEDBACK_URL} target="_blank" rel="noreferrer">Dejar una reseña</a><button type="button" onClick={clearAllData}>Borrar mis datos de este dispositivo</button></div><div className="footer-disclaimer">Feminea ofrece información educativa, no diagnóstico ni tratamiento médico. Las predicciones del calendario son orientativas. Si necesitas ayuda, contacta con un profesional de salud.</div></div>
        <div className="footer-bottom"><div className="content-wrap"><span>© {new Date().getFullYear()} Feminea</span><span>Hecho con cuidado <Heart size={13} fill="currentColor" /></span></div></div>
      </footer>
    </div>
  );
}
