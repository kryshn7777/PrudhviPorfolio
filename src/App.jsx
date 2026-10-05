import { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useProgress } from '@react-three/drei';
import SurfaceLine from './SurfaceLine.jsx';
import Viewer from './Viewer.jsx';
import { PARTS, LINE, MORE_PROJECTS } from './parts.js';
import { scroll } from './scroll.js';

const EMAIL = 'prudhvimunaganti@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/prudhvimunaganti';
const CV = `${import.meta.env.BASE_URL}Prudhvi-Munaganti-CV.pdf`;

const LAST = LINE.length + 1;   // stage 0 intro, 1..6 parts, 7 finale

// From the CV
const TOOLS = ['CATIA V5', 'Autodesk Alias AutoStudio 2027', 'Autodesk Inventor', 'Fusion 360', 'Siemens NX', 'Siemens Simcenter (familiar)'];
const COMPETENCIES = [
  'Reverse engineering from STL mesh and 3D scan data',
  'Surface reconstruction and reverse-engineered CAD modelling',
  'CATIA V5: STL import, axis alignment, 3D curve creation, surfacing, solid conversion',
  'Alias AutoStudio: curve creation, patch planning, surface construction, Class-A fundamentals (developing)',
  'Reflection analysis, deviation analysis, surface and curve continuity checks',
  'Familiarity with Siemens Simcenter for digital twin applications',
  'Strong spatial reasoning, geometric accuracy and independent problem-solving',
  'Cross-functional teamwork and communication',
];

function Loading() {
  const { active } = useProgress();
  return active ? <div className="loading" role="status">Loading model…</div> : null;
}

function Caption({ stage }) {
  if (stage === 0) {
    return (
      <div className="caption intro">
        <h1>Prudhvi Munaganti</h1>
        <p className="lede">Mechanical design engineer: automotive exterior design and surface modelling.</p>
        <p>I reconstruct car body surfaces from STL scan data in CATIA V5 and am building Class-A fundamentals in Autodesk Alias. Based in Berlin, looking for a Master's internship. Scroll to watch six projects go from scan mesh to finished surface.</p>
        <div className="actions">
          <a className="button primary" href="#work">See projects</a>
          <a className="button" href={CV} download>Download CV (PDF)</a>
        </div>
      </div>
    );
  }
  if (stage === LAST) {
    return (
      <div className="caption">
        <h2>Mesh in, Class-A out</h2>
        <p>Each project below has its own 3D viewer. Switch between mesh, surface, zebra and paint to inspect it.</p>
        <div className="actions"><a className="button primary" href="#work">Inspect the projects</a></div>
      </div>
    );
  }
  const c = LINE[stage - 1];
  return (
    <div className="caption">
      <div className="count">Project {stage} of {LINE.length}, {c.tool}</div>
      <h2>{c.name}</h2>
      <p>{c.text}</p>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState(0);
  const [reached, setReached] = useState(1);   // highest line slot allowed to load
  const line = useRef();

  useEffect(() => {
    const onScroll = () => {
      const r = line.current.getBoundingClientRect();
      const t = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight)));
      scroll.s = t * LAST;
      setStage(Math.round(scroll.s));
      setReached((n) => Math.max(n, Math.ceil(scroll.s) + 1));
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
  }, []);

  return (
    <>
      <header className="nav">
        <a className="name" href="#top">Prudhvi Munaganti</a>
        <nav aria-label="Sections">
          <a href="#work">Projects</a>
          <a href="#about">About</a>
          <a href="#skills">Skills</a>
          <a href="#contact">Contact</a>
          <a className="cv" href={CV} download>CV</a>
        </nav>
      </header>

      <main id="top">
        <section className="line" ref={line} style={{ height: `${(LAST + 1) * 100}vh` }} aria-label="Surface line: six projects from scan mesh to paint">
          <div className="sticky">
            <Canvas className="stage" dpr={[1, 2]} gl={{ localClippingEnabled: true }} camera={{ fov: 35, position: [0, 5.6, 9.6] }} aria-hidden="true">
              <SurfaceLine reached={reached} />
            </Canvas>
            <div key={stage} className="caption-wrap" aria-live="polite"><Caption stage={stage} /></div>
            <ol className="progress" aria-hidden="true">
              {LINE.map((_, i) => <li key={i} className={i < stage ? 'done' : ''} />)}
            </ol>
            <a className="skip" href="#work">Skip to projects</a>
            <Loading />
          </div>
        </section>

        <section id="work" className="section">
          <h2>Surfacing projects</h2>
          <p className="intro-text">Surfaces reverse-engineered from scan and mesh data, rebuilt to Class-A standard: curve quality, surface continuity and reflection analysis.</p>
          <div className="grid">
            {PARTS.map((p) => (
              <article key={p.file} className="project">
                <Viewer p={p} />
                <h3>{p.name}</h3>
                <div className="tool">{p.tool}</div>
                <p>{p.text}</p>
              </article>
            ))}
          </div>

          <h3 className="sub">Also in progress</h3>
          <ul className="more">
            {MORE_PROJECTS.map((m) => (
              <li key={m.name}>
                <h4>{m.name}</h4>
                <div className="tool">{m.tool}</div>
                <p>{m.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="about" className="section split">
          <h2>About</h2>
          <div>
            <p className="lede">Mechanical engineer with two years of hands-on experience in design and production, now studying for a Master's in Berlin.</p>
            <p>Over the past year I built self-directed expertise in automotive reverse engineering, taking STL scan data through to finished CAD surfaces in CATIA V5. I am now extending this into Autodesk Alias AutoStudio to develop Class-A surfacing fundamentals: curve quality, patch layout, surface continuity and reflection analysis. I built this portfolio independently, alongside my studies, as preparation for a first professional role in automotive exterior design.</p>
            <p>English: proficient. German: basic, actively improving.</p>

            <h3>Experience</h3>
            <div className="entry">
              <div className="entry-head"><h4>Designer, Quality and Production Engineer</h4><span>Aug 2023 – Mar 2025</span></div>
              <div className="tool">Turbo Engineering Services, Hyderabad, India</div>
              <ul className="bullets">
                <li>Mechanical component design in CATIA and Autodesk Inventor: part models and technical drawings for production.</li>
                <li>Quality checks on manufactured parts to keep output consistent with workshop standards.</li>
                <li>Worked across design, assembly and production, following components from CAD model to finished part.</li>
                <li>Day-to-day production support in a lean, efficiency-focused workshop.</li>
              </ul>
            </div>
            <div className="entry">
              <div className="entry-head"><h4>Independent automotive surfacing & reverse engineering</h4><span>Alongside studies</span></div>
              <ul className="bullets">
                <li>Reconstructed full-vehicle and body-panel surfaces from STL scans in CATIA V5: axis alignment, 3D curves, patch-based and multi-section surfacing.</li>
                <li>Airtight, gap-free closed surface models validated with deviation analysis and prepared for solid generation.</li>
                <li>Structured patch layouts with continuous surface flow across wheel arches, headlights and character lines.</li>
                <li>Custom reference curves instead of pure mesh tracing, to capture the underlying design intent.</li>
              </ul>
            </div>

            <h3>Education</h3>
            <div className="entry">
              <div className="entry-head"><h4>M.Eng. Engineering and Sustainable Technology Management</h4><span>Currently enrolled</span></div>
              <div className="tool">SRH University of Applied Sciences, Berlin</div>
              <p>Focus: Industry 4.0, automation, robotics and 3D manufacturing. The programme includes a mandatory internship.</p>
            </div>
            <div className="entry">
              <div className="entry-head"><h4>B.E. Mechanical Engineering</h4><span>Jun 2019 – Mar 2023</span></div>
              <div className="tool">Velagapudi Ramakrishna Siddhartha Engineering College, Vijayawada, India</div>
            </div>

            <h3>Certification</h3>
            <p>National Cadet Corps (NCC) Certificate: leadership and discipline.</p>
          </div>
        </section>

        <section id="skills" className="section split">
          <h2>Skills</h2>
          <div>
            <h3>Tools</h3>
            <ul className="tags">{TOOLS.map((t) => <li key={t}>{t}</li>)}</ul>
            <h3>Core competencies</h3>
            <ul className="list">{COMPETENCIES.map((w) => <li key={w}>{w}</li>)}</ul>
          </div>
        </section>

        <section id="contact" className="section contact">
          <h2>Looking for a Master's internship</h2>
          <p>A mandatory internship for my Master's, ideally in automotive exterior design, CAD or surface modelling, where I can keep developing under experienced surfacing engineers. Based in Berlin.</p>
          <div className="actions">
            <a className="button primary" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <a className="button" href={LINKEDIN} target="_blank" rel="noreferrer">LinkedIn</a>
            <a className="button" href={CV} download>Download CV (PDF)</a>
          </div>
        </section>
      </main>

      <footer className="footer">© {new Date().getFullYear()} Prudhvi Munaganti</footer>
    </>
  );
}
