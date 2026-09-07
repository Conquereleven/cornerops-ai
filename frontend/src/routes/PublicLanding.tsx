import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CaseCard, type CaseStudy } from '../components/public/CaseCard';
import '../styles/public.css';

const cases: CaseStudy[] = [
  { industry: 'Commerce & distribution', title: 'Specialty food distributor', status: 'Internal platform', problem: 'Catalog, stock and commercial decisions live in separate workflows.', solution: 'An operating layer that brings product readiness, inventory signals and priorities into view.', modules: ['Catalog intelligence', 'Inventory watch', 'Work queues'] },
  { industry: 'B2B operations', title: 'From quote to delivery', status: 'In development', problem: 'Quotes, orders and fulfillment handoffs are difficult to follow as one process.', solution: 'A Commerce OS workstream connecting commercial records, exceptions and approval checkpoints.', modules: ['Quote preparation', 'Order tracking', 'Daily close'] },
  { industry: 'Founder operations', title: 'CornerOps operating platform', status: 'Internal platform', problem: 'Founders need to know what needs a decision without checking every tool.', solution: 'A daily brief, prioritized work queue and approval center built around operational evidence.', modules: ['Founder Daily', 'Approvals', 'Intelligence'] },
];
const solutions = [
  ['AI agents', 'Read, prepare and recommend. Give your team useful assistance with clear approval boundaries.'],
  ['Workflow automation', 'Move information and tasks between teams without repeated copying, chasing or re-entry.'],
  ['Internal operating systems', 'Bring the workflows that make your business different into software designed around them.'],
  ['Commerce systems', 'Connect catalog, orders, stock and quoting so the next step is easier to see.'],
  ['WhatsApp & CRM automation', 'Turn conversations into structured enquiries, follow-ups and customer context.'],
  ['Dashboards & intelligence', 'Make scattered business data useful for daily decisions and exception handling.'],
  ['APIs & integrations', 'Connect your existing tools with reliable data flows and explicit ownership.'],
];
const process = [['Discover', 'Find the bottleneck. Understand the people, tools and decisions around it.'], ['Design', 'Define the workflow, user experience and what success will look like.'], ['Build', 'Ship a focused system your team can test with real work.'], ['Integrate', 'Connect the stack, agree the controls and support the handover.'], ['Improve', 'Review what happens in practice and refine the system.']];

export function PublicLanding() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let disposed = false;
    let scope: { revert: () => void } | undefined;
    const reduce = () => { if (preference?.matches) { scope?.revert(); element.dataset.motion = 'reduced'; } };
    preference?.addEventListener('change', reduce);
    if (!preference || preference.matches) element.dataset.motion = preference ? 'reduced' : 'static';
    else void import('animejs').then(({ animate, createScope, stagger }) => {
      if (disposed || preference.matches) return;
      scope = createScope({ root: element }).add(() => {
        animate('.co-public-hero-copy > *, .studio-hero-art', { opacity: [0, 1], y: [18, 0], duration: 700, delay: stagger(75), ease: 'out(4)' });
      });
      element.dataset.motion = 'ready';
    }).catch(() => { if (!disposed) element.dataset.motion = 'static'; });
    return () => { disposed = true; scope?.revert(); preference?.removeEventListener('change', reduce); };
  }, []);

  return <main className="co-public cg-root studio" ref={root}>
    <a className="studio-skip" href="#main-content">Skip to content</a>
    <header className="co-public-nav" aria-label="CornerOps public navigation">
      <Link className="co-public-brand" to="/" aria-label="CornerOps home"><span className="co-public-brand-mark">C</span><span><strong>CornerOps</strong><small>AI systems studio</small></span></Link>
      <nav aria-label="Main"><a href="#solutions">Solutions</a><a href="#work">Our work</a><a href="#contact">Let’s talk <ArrowUpRight size={14}/></a><Link className="co-public-signin" to="/login">Sign in</Link></nav>
    </header>
    <section className="co-public-hero" id="main-content" aria-labelledby="co-public-title">
      <div className="co-public-hero-copy"><span className="co-public-eyebrow">AI agency / systems studio</span><h1 id="co-public-title">AI systems that make businesses <em>run better.</em></h1><p>We design and build AI systems, automation and custom software for sales, commerce, customer operations and back office.</p><div className="co-public-actions"><a className="co-public-primary" href="#contact">Talk to CornerOps <ArrowUpRight size={17}/></a><a className="co-public-secondary" href="#work">See our work <ArrowRight size={17}/></a></div><div className="co-public-trustline">Built around your business. Connected to your stack.</div></div>
      <div className="studio-hero-art" aria-label="From fragmented work to a connected operating system"><div className="studio-art-label">FROM FRICTION TO FLOW</div><div className="studio-inputs"><span>Conversations</span><span>Orders</span><span>Data</span></div><div className="studio-orbit"><div className="studio-core">C<span>CornerOps</span></div></div><div className="studio-output">Connected systems <ArrowRight size={16}/> Clear next steps</div><small>AI + software + operational thinking</small></div>
    </section>
    <div className="studio-industry-strip"><span>BUILT FOR</span><p>Retail · Distributors · Hospitality · Real estate · Professional services · Founder-led businesses</p></div>
    <section className="co-public-section studio-problems" id="problems"><div className="co-public-section-heading"><span className="co-public-eyebrow">01 / What we fix</span><h2>Good teams.<br/>Unnecessary friction.</h2><p>When the business grows, manual work grows with it. We build systems around the places where time, context and opportunities get lost.</p></div><ul>{['WhatsApp chaos', 'Manual order entry', 'Fragmented tools', 'Missed leads', 'Repetitive admin', 'Slow quoting & invoicing', 'Inventory blind spots', 'Disconnected customer data'].map((item, i) => <li key={item}><span>0{i + 1}</span>{item}<ArrowUpRight size={17}/></li>)}</ul></section>
    <section className="co-public-section" id="solutions"><div className="co-public-section-heading"><span className="co-public-eyebrow">02 / Solutions</span><h2>From one bottleneck<br/>to a better way of working.</h2><p>A focused automation or an entire operating system. The right scope starts with the problem.</p></div><div className="studio-solutions">{solutions.map(([title, copy], i) => <article key={title}><span className="studio-number">0{i + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="co-public-section" id="work"><div className="co-public-section-heading"><span className="co-public-eyebrow">03 / Selected work</span><h2>Systems taking shape.<br/>Real operational problems.</h2><p>A selection of internal platforms and work in development. Each project is labelled by its current stage.</p></div><div className="studio-cases">{cases.map((study, index) => <CaseCard key={study.title} study={study} index={index}/>)}</div></section>
    <section className="co-public-section" id="process"><div className="co-public-section-heading"><span className="co-public-eyebrow">04 / How we work</span><h2>Close to the operation.<br/>Through to the build.</h2></div><ol className="studio-process">{process.map(([title, copy], i) => <li key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{copy}</p></li>)}</ol></section>
    <section className="co-public-governance" id="why"><div><span className="co-public-eyebrow">05 / Why CornerOps</span><h2>Engineering meets<br/>operational thinking.</h2><p>We connect AI, product design and software engineering to the details of how your business actually works.</p></div><div className="studio-principles"><article><h3>Systems that ship.</h3><p>Working software, usable workflows and a clear handover are the deliverables.</p></article><article><h3>AI with a clear role.</h3><p>Automate routine work. Keep consequential actions behind human approval.</p></article><article><h3>Your stack, connected.</h3><p>Build on the tools your team already uses, with integrations that keep context moving.</p></article></div></section>
    <section className="co-public-section studio-capabilities"><span className="co-public-eyebrow">The capabilities behind the work</span><p>Strategy. UX & product. AI agents. APIs & integrations. Automation. Dashboards. Custom software.</p><small>Our internal platform and Commerce OS provide reusable foundations for the systems we build.</small></section>
    <section className="co-public-cta" id="contact"><span className="co-public-eyebrow">Let’s build something useful</span><h2>Have an operation you know should work better?<br/>Let’s fix it.</h2><p>Bring us one workflow that takes too much time. We’ll help you identify what to build first.</p><div className="co-public-actions studio-contact-actions"><a className="co-public-primary" href="mailto:joel.escudero12@gmail.com">Email us<span>joel.escudero12@gmail.com</span></a><a className="co-public-secondary" href="https://wa.me/971555633651" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp at +971 55 563 3651 (opens in a new tab)">Chat on WhatsApp<span>+971 55 563 3651</span></a></div></section>
    <footer className="co-public-footer"><Link to="/" aria-label="CornerOps home">© CornerOps — AI systems studio</Link><div><a href="#contact">Contact</a><a href="#work">Selected work</a><Link to="/login">Sign in</Link></div></footer>
  </main>;
}
