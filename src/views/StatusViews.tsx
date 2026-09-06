import { Activity, Dumbbell, Footprints, Target, Users, Zap } from "lucide-react";
import { PageHero } from "../components/common";
import { DEMO_LIFE_ACTIVITY, type LifeMetricKey } from "../data/lifeActivity";

const metricIcons: Record<LifeMetricKey, typeof Footprints> = {
  steps: Footprints,
  activeMinutes: Zap,
  workouts: Dumbbell,
  socialPlans: Users,
};

export function LifeView() {
  const snapshot = DEMO_LIFE_ACTIVITY;

  return (
    <div className="view-page">
      <PageHero
        eyebrow="CONECTA VIDA · PRO"
        title="Tu vida, en movimiento"
        text="Actividad, bienestar, objetivos y planes sociales conectados."
        icon={<Activity />}
      />
      <div className="metric-grid">
        {snapshot.metrics.map(({ key, label, value, goal }) => {
          const Icon = metricIcons[key];
          return (
            <article className="metric-card" key={key}>
              <span><Icon /></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <p>{goal}</p>
              <div><i /></div>
            </article>
          );
        })}
      </div>
      <div className="life-dashboard">
        <article className="weekly-chart">
          <div>
            <span>ACTIVIDAD SEMANAL</span>
            <h2>{snapshot.weeklyDistance}</h2>
            <p>{snapshot.weeklyComparison}</p>
          </div>
          <div className="bars">
            {snapshot.weeklyBars.map((height, index) => (
              <span key={index}>
                <i style={{ height: `${height}%` }} />
                <small>{"LMXJVSD"[index]}</small>
              </span>
            ))}
          </div>
        </article>
        <article className="challenge-card">
          <span><Target /></span>
          <small>{snapshot.challenge.eyebrow}</small>
          <h2>{snapshot.challenge.title}</h2>
          <p>{snapshot.challenge.description}</p>
          <strong>{snapshot.challenge.progress}</strong>
          <div><i /></div>
        </article>
      </div>
    </div>
  );
}
