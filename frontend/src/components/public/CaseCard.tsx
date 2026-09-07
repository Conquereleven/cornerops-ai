export interface CaseStudy {
  industry: string;
  title: string;
  problem: string;
  solution: string;
  modules: string[];
  status: 'Built' | 'Pilot' | 'In development' | 'Internal platform';
}

export function CaseCard({ study, index }: { study: CaseStudy; index: number }) {
  return <article className="studio-case">
    <div className="studio-case-top"><span>{study.industry}</span><span className="studio-status">{study.status}</span></div>
    <div className="studio-case-art" aria-hidden="true"><span>0{index + 1}</span><div className="studio-system-lines"><i/><i/><i/></div></div>
    <h3>{study.title}</h3>
    <dl><dt>Problem</dt><dd>{study.problem}</dd><dt>Solution</dt><dd>{study.solution}</dd></dl>
    <ul className="studio-tags" aria-label="Modules">{study.modules.map(module => <li key={module}>{module}</li>)}</ul>
  </article>;
}
