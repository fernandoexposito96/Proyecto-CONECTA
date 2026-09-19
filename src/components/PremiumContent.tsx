import { ChevronRight } from 'lucide-react';
import { premiumBenefits } from '../views/settings/settingsCatalog';

export function PremiumContent({requested,onRequest}:{requested:boolean;onRequest:()=>void}){
  return <>
    <div className="premium-hero-card"><div className="premium-card-visual"><div className="premium-card-chip"/><div className="premium-card-brand">CONECTA</div></div><div className="premium-hero-copy"><h2>Vive más experiencias</h2><p>Conecta Premium te da acceso a más oportunidades para hacer planes y conocer gente increíble.</p></div></div>
    <div className="premium-benefits-list">{premiumBenefits.map(([number,title,subtitle])=><div key={number} className="premium-benefit-row"><span className="premium-number">{number}</span><div><strong>{title}</strong><small>{subtitle}</small></div></div>)}</div>
    <button className="premium-main-cta" onClick={()=>onRequest()}>{requested?'Solicitud iniciada':'Hazte Premium'} <ChevronRight/></button>
    {requested&&<p className="settings-success">Perfecto. El siguiente paso será conectar aquí el pago real cuando activemos esa función.</p>}
    <p className="premium-footnote">Desde 4,99 €/mes · Cancela cuando quieras</p>
  </>;
}
