import { Activity, Dumbbell, Footprints, Target, Users, Zap } from "lucide-react";
import { PageHero } from "../components/common";

export function LifeView() {
  const metrics = [
    { label: "Pasos", value: "8.642", goal: "de 10.000", icon: Footprints },
    { label: "Actividad", value: "64", goal: "minutos", icon: Zap },
    { label: "Entrenos", value: "4", goal: "esta semana", icon: Dumbbell },
    { label: "Planes activos", value: "3", goal: "con otras personas", icon: Users },
  ];
  return <div className="view-page"><PageHero eyebrow="CONECTA VIDA · PRO" title="Tu vida, en movimiento" text="Actividad, bienestar, objetivos y planes sociales conectados." icon={<Activity />} /><div className="metric-grid">{metrics.map(({ label, value, goal, icon: Icon }) => <article className="metric-card" key={label}><span><Icon /></span><small>{label}</small><strong>{value}</strong><p>{goal}</p><div><i /></div></article>)}</div><div className="life-dashboard"><article className="weekly-chart"><div><span>ACTIVIDAD SEMANAL</span><h2>18,7 km recorridos</h2><p>Un 24% más que la semana pasada.</p></div><div className="bars">{[42, 68, 54, 88, 72, 96, 65].map((height, index) => <span key={index}><i style={{ height: `${height}%` }} /><small>{"LMXJVSD"[index]}</small></span>)}</div></article><article className="challenge-card"><span><Target /></span><small>RETO ACTIVO</small><h2>Semana imparable</h2><p>Completa 5 actividades con otras personas.</p><strong>4 de 5</strong><div><i /></div></article></div></div>;
}
