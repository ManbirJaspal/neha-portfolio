// Case studies. Words are Neha's; the eBay boards that shipped as images are re-set here as live text and components.
import { src, VIDEO } from './media.js';
import { Chat, FLOW } from './chat.js';

const fig = (id, alt, r = '16/9', cap = '') => `<figure class="fig" data-zoom="${src(id, 2048)}" tabindex="0" role="button" aria-label="Enlarge image: ${alt}"><img src="${src(id, 2048)}" alt="${alt}" loading="lazy" style="aspect-ratio:${r}">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const head = (c) => `<header class="cs-top"><p class="cs-co">${c.co}</p><h1>${c.title}</h1>
  <div class="cs-hero"><img src="${src(c.hero, 2048)}" alt="${c.heroAlt}" style="aspect-ratio:${c.heroR}"></div>
  <dl class="cs-meta">${c.meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></header>`;
const rows = (list) => `<div class="rows">${list.map(([k, v]) => `<div class="row"><h3>${k}</h3>${v.startsWith('<') ? v : `<p>${v}</p>`}</div>`).join('')}</div>`;

/* ------------------------------------------------------------------ eBay */
const STEPS = [
  ['The opener', 'Grounded in the order: starts with what the agent already knows.', 'The item, price, and order number are front and center from message one. Two clear paths (did you receive it, or do you need help) keep the buyer oriented before intent gets deep.'],
  ['Reason discovery', 'Understand intent', 'Product-aware reason chips surface the most likely issues first. Free text stays available for the cases chips can’t cover. The agent handles both paths through the same LLM.'],
  ['Confirming intent', 'A single check before the flow forks: “just to make sure I understand”', 'Confirm before committing. Reduce false SNAD claims while giving buyers one clear opportunity to correct an inaccurate classification. Conversational UX keeps the experience simple and intuitive.'],
  ['The ask', 'Specific, itemized asks', 'An overall shot and a close-up of the damage. No more guessing what “supporting photo” means.'],
  ['The capture', 'Native camera, kept in the flow', 'Native camera integration, up to three photos, kept in the flow so buyers never have to leave and come back. Ongoing improvisations.'],
  ['The check', 'CV validates each upload against the request', 'When the photo doesn’t show the item or the damage, the agent explains why and offers a clean off-ramp. Ongoing improvisations.'],
  ['The verdict, explained', 'Buyers see why, not just yes or no.', 'A specific reason, “the damaged area isn’t shown in a close-up view”, replaces the black-box decision. Buyers understand the outcome and know exactly what would change it.'],
  ['The soft landing', 'No dead ends: a standard return is always one tap away.', 'The seller receives structured context on what the buyer tried, what the agent classified, and where the evidence fell short. Both sides walk out of the flow with more information than they walked in with.'],
];
const INTER = {
  3: ['Verification', 'Evidence that actually verifies.', 'The old form accepted any photo. The new agent tells buyers what a valid image looks like, and validates each one with computer vision before advancing. LLM conducts checks in the background.'],
  6: ['Verdict', 'Transparent about what qualifies for eMBG.', 'When evidence is thin, the agent names the reason plainly, and routes the case to the seller under standard return policy, so the buyer keeps moving and the seller stays informed.'],
};
const BOARDS = [['93TLAFPoC2haLz6OIqG1Q9rwKA.png', 'Opener screen'], ['nwodQhfab4Ym5rS2uQlm3S3lEE.png', 'Reason discovery screen'], ['WZNYyOlNRgNxByxS2c2G7KkxHg.png', 'Confirming intent screen'], ['gPf5PLkmGyeNLlsuU7VFqgiIRQ.png', 'Evidence ask, capture and check screens'], ['25Zjsa87cDZkvttU0NIy6Dzgi8I.png', 'Verdict screen'], ['U4v5WcJjGxdZ2OstVI2iUnmW8.png', 'Soft landing screen']];

const returns = {
  key: 'returns', short: 'eBay: AI powered returns', next: 'dashboard',
  html: () => `<article class="cs">
  ${head({ co: 'eBay', title: 'AI powered returns: minimizing fraud & SNADs', hero: 'jedtVC1PC9RrT3SwqRzud9V6w.png', heroR: '1632/964', heroAlt: 'Three phones showing the Chat with eBay.ai returns conversation',
    meta: [['Role', 'Product Designer III (Lead)'], ['Timeline', '6 months'], ['Product', 'Post-transactions'], ['Industry', 'E-commerce']] })}

  <section class="split">
    <div class="video-wrap"><video src="${VIDEO}" muted loop playsinline autoplay preload="metadata" aria-label="Screen recording of the returns chat"></video></div>
    <div>
      <h3>Context</h3>
      <p>Led end-to-end design strategy for an <strong>AI powered returns experience</strong> serving <strong>130M+ buyers and 25M+ sellers</strong>. Designed intuitive flows informed by backend <strong>machine learning, computer vision, NLP, and generative AI</strong> to guide users toward the right resolution, projected to drive <strong>$280M+</strong> in GMV.</p>
      <h3 style="margin-top:32px">User problem</h3>
      <p>When a purchase goes wrong, <strong>buyers often struggle to clearly communicate the issue, while sellers are left with vague photos and one-line complaints that provide little actionable insight</strong>. This communication gap leads to misclassified returns, costly manual adjudication, and eroding trust across the marketplace.</p>
      <h3 style="margin-top:32px">Business problem</h3>
      <p>Higher SNAD return volume. Increased operational cost and manual adjudication load. Lower CSAT for both buyers and sellers.</p>
    </div>
  </section>

  <section class="soft split" style="margin-top:clamp(48px,7vw,104px)">
    <div><p class="kick">Before</p><h2>Core experience</h2><p>The core experience lacked effective ways to capture buyer intent and accurate product photos, resulting in a rise in SNAD claims.</p></div>
    <div class="crop" role="img" aria-label="The old return request form: a dropdown reason and a free-text box" style="background-image:url(${src('4KQVAkAvzZLbb5yeGsx4ok0Kfs.png', 2048)});background-size:403% auto;background-position:83.4% 50.7%"></div>
  </section>

  <section>
    <div class="head2"><p class="kick">Problems</p><h2>Unresolved tensions between buyers, sellers, and the platform.</h2></div>
    ${rows([
      ['Ambiguity at the source', 'Listings vary wildly in precision: sizing, condition, color. The description sets a fragile expectation buyers can only verify after they’ve paid.'],
      ['Wrong reason selection', 'People know something’s wrong long before they can name it. A generic dropdown forces a label, and “Not as described” becomes the safe default, misclassifying fit issues and remorse as SNAD.'],
      ['Sellers on the receiving end', 'Sellers receive vague reasons and blurry photos. Fair adjudication is nearly impossible, so trust in eBay’s protection system erodes on their side too.'],
      ['eBay steps in', 'eMBG covers the misclassification, 18 million times a year. A cost the platform pays for a moment upstream nobody helped anyone through.'],
    ])}
  </section>

  <div class="dark"><p class="kick">Challenge</p><p class="statement">Resolution should feel effortless and auto-guided, with transparent reasoning behind every decision, so outcomes land faster and fairer, SNAD returns fall, and trust grows on both sides of the marketplace.</p></div>

  <section>
    <p class="kick">Design principles</p>
    <div class="cols3">
      <div><h3>Understand before asking</h3><p>Use the buyer’s language, selections, order context, and photos to infer intent. Ask only what is necessary, never repeat questions, and make interpretations easy to correct.</p></div>
      <div><h3>Guide, never gate</h3><p>Recommend the clearest next step without forcing users down a rigid path. Preserve free-form input, alternative resolutions, and access to human support.</p></div>
      <div><h3>Match effort to risk</h3><p>Keep straightforward returns lightweight. Introduce additional evidence or verification only when the claim’s value, complexity, or risk justifies it.</p></div>
    </div>
  </section>

  <section>
    <div class="head2"><p class="kick">Systems view</p><h2>SNAD isn’t a moment. It’s the end of chain…</h2></div>
    <div class="soft">
      <div class="loop" id="loop">
        <article><h4>Prevent</h4><h3>Seller represents the item</h3><p>Ambiguous sizing, a single photo, subjective condition language. The expectation is set here.</p><span class="tag">Seller</span><span class="tag">Marketplace</span></article>
        <article><h4>Understand</h4><h3>Buyer hits the gap</h3><p>Reality doesn’t match expectation, and without the words for it, ambiguity collapses into “not as described.”</p><span class="tag">Buyer</span><span class="tag">AI</span></article>
        <article><h4>Resolve</h4><h3>The right resolution is set</h3><p>Intent is classified, evidence matched to risk, and the outcome routed: refund, seller return, or eMBG.</p><span class="tag">AI</span><span class="tag">Policy</span></article>
        <article><h4>Learn</h4><h3>The system learns</h3><p>Resolution signals surface which listings, categories and phrases keep producing returns.</p><span class="tag">AI</span><span class="tag">Marketplace</span></article>
        <div class="loop-back"><span>Insights feed back into how sellers represent items</span></div>
      </div>
      <p style="max-width:44em;color:#3B3758"><strong>The design implication.</strong> Improving the return form addresses only the point of failure. The larger opportunity is to connect signals across the lifecycle: clarify listings upstream, understand buyer intent at the moment of return, determine the right resolution, and feed those insights back into the marketplace.</p>
    </div>
  </section>

  <section>
    <div class="head2"><p class="kick">Timeline</p><h2>Conception to launch…</h2></div>
    <div class="gantt">
      ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map(m => `<span class="m">${m}</span>`).join('')}
      <div class="bar" style="--a:1;--b:4"><small>Jan to Mar</small><b>Discovery & Definition</b><p>Design sprint, PRD, competitive teardown, use-case matrix.</p></div>
      <div class="bar" style="--a:3;--b:7"><small>Mar to Jun</small><b>Exploration & Ideation</b><p>Logic mapping, decision trees, V1 & V2 concepts, and UXR tests. Leadership review.</p></div>
      <div class="bar" style="--a:5;--b:9"><small>May to Aug</small><b>Agentic Experience Design</b><p>eBay.ai chat flows, evidence & CV validation, A/B test ran Jun to Jul.</p></div>
      <span class="ab">A/B test, Jun to Jul</span>
      <div class="bar last" style="--a:7;--b:10"><small>Jul to Sep</small><b>Validation & Launch</b><p>A/B test shareout and leadership sign off. Reiteration, eng handoff, fashion pilot launch.</p></div>
    </div>
  </section>

  <section>
    <div class="row" style="border:0;padding:0"><h3>Process behind the scenes…</h3><p>Led the design sprint to uncover and dissect the problem space, analyze competitor approaches, and deep-dive into the backend architecture, building a shared understanding of LLM constraints and guardrails, computer vision models, validation criteria, policy checks, and system dependencies. Translated these technical capabilities and constraints into tangible front-end experience opportunities and design direction.</p></div>
    ${fig('FRmgAIKrKpzmUMfxp1perbFaEeA.png', 'Collage of sprint boards, decision trees and early chat concepts', '2048/1571')}
  </section>

  <section>
    <p class="kick">Introducing</p>
    <h2>Chat with eBay.ai</h2>
    <p class="lead" style="max-width:32em;margin-top:16px;color:#3B3758">A conversational return experience powered by eBay’s AI agent. The buyer talks, in chips or plain language, and the agent understands, classifies, and requests the evidence the case needs.</p>
    <p class="note">Scroll to walk the flow. The phone is a working recreation; tap the outlined chip to move ahead.</p>
    <div class="flow">
      <div class="flow-stage"><div class="dots" id="flowDots">${STEPS.map(() => '<i></i>').join('')}</div><div id="flowPhone"></div></div>
      <div class="flow-steps">
        ${STEPS.map((s, i) => `${INTER[i] ? `<div class="inter"><p class="kick">${INTER[i][0]}</p><h2>${INTER[i][1]}</h2><p>${INTER[i][2]}</p></div>` : ''}
        <div class="step" data-step="${i}"><span class="num">0${i + 1} ${s[0]}</span><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('')}
      </div>
    </div>
  </section>

  <section>
    <h3>The shipped screens</h3>
    <div class="strip">${BOARDS.map(([id, alt]) => `<button type="button" data-zoom="${src(id, 2048)}" aria-label="Enlarge: ${alt}"><img src="${src(id, 1024)}" alt="${alt}" loading="lazy" style="aspect-ratio:2048/1280;object-fit:cover"></button>`).join('')}</div>
  </section>

  <div class="dark gold"><p class="kick">Measuring success</p>
    <p class="statement">A/B testing validated the experience with a 100% task completion rate, significantly fewer SNAD claims, and fewer than 1% of users contacting customer service.</p>
    <div class="stats"><div><b>135M</b><span>Buyers</span></div><div><b>20M+</b><span>Sellers protected</span></div><div class="hot"><b>2M+</b><span>SNADs</span></div><div><b>Focus cat.</b><span>Pilot category</span></div></div>
    <div class="targets"><span><i>↓</i>SNAD misclassification</span><span><i>↑</i>Claim CSAT from a guided, humanized flow</span><span><i>↓</i>Time-to-resolution & adjudication cost</span></div>
  </div>

  <section>
    <div class="head2"><p class="kick">Trade offs</p><div><h2>Earlier explorations we set aside, for now.</h2><p style="margin-top:16px">Before landing on the eBay.ai chat, we prototyped two other directions: a chip-first structured form (V2), and a hybrid comment + photo flow with troubleshooting nested inside. Both taught us what to keep, and what the AI agent could absorb entirely.</p></div></div>
    <div class="fig-row">${fig('FwvGDTBWJm745gEXfZBND3xOY.png', 'Earlier exploration: chip-first reason and troubleshooting flow', '1798/1204')}${fig('o2i80dgJ4MNWkt4bAew9z0JJnI.png', 'Earlier exploration: design flow map with notes', '1796/828')}</div>
  </section>

  <section>
    <div class="soft"><p class="kick">Project takeaways</p><h2>What building this taught me about AI at platform scale.</h2>
      <div class="cols3">
        <div><h3>The system is the design.</h3><p>At 135M buyers, the taxonomy of reason codes moves more numbers than any screen. Designing the underlying model is designing the product.</p></div>
        <div><h3>Design for the unhappy path</h3><p>Returns are already someone’s bad day. Fair, transparent, exit-anywhere design isn’t a nice-to-have, it’s the entire trust story. Ensure stringent guardrails while training the model.</p></div>
        <div><h3>AI needs a soft landing.</h3><p>The moment the agent can’t confidently decide, it has to hand off cleanly, with context, not with a shrug. That handoff is the product for a big share of cases.</p></div>
      </div>
    </div>
    ${fig('XWiE9aHScNWIFg7lIJjPDRkDAC4.png', 'Neha and the team at the eBay Evo design showcase', '2048/1164')}
  </section>
  </article>`,
  init(root, { gsap, ScrollTrigger, reduce }) {
    const kill = [];
    const chat = new Chat(root.querySelector('#flowPhone'), { onPick: (step, i) => { if (i !== FLOW[step].pick) return; const nx = root.querySelector(`.step[data-step="${step + 1}"]`) || root.querySelector('.step[data-step="0"]'); nx && window.__scrollTo(nx, -innerHeight * .3); } });
    chat.setStep(0, true);
    const dots = [...root.querySelectorAll('#flowDots i')];
    const set = i => { chat.setStep(i); dots.forEach((d, j) => d.classList.toggle('on', j === i)); };
    set(0);
    root.querySelectorAll('.step').forEach(el => kill.push(ScrollTrigger.create({ trigger: el, start: 'top 62%', end: 'bottom 62%', onToggle: s => s.isActive && set(+el.dataset.step) })));
    const arts = [...root.querySelectorAll('#loop article')]; let li = 0, timer = 0;
    const tick = () => { arts.forEach((a, j) => a.classList.toggle('on', j === li)); li = (li + 1) % arts.length; };
    if (reduce) arts.forEach(a => a.classList.add('on'));
    else kill.push(ScrollTrigger.create({ trigger: '#loop', start: 'top 80%', end: 'bottom 10%', onToggle: s => { clearInterval(timer); if (s.isActive) { tick(); timer = setInterval(tick, 1700); } } }));
    if (!reduce) kill.push(gsap.from(root.querySelectorAll('.gantt .bar'), { scaleX: 0, opacity: 0, duration: .9, ease: 'power3.out', stagger: .14, scrollTrigger: { trigger: root.querySelector('.gantt'), start: 'top 78%' } }).scrollTrigger);
    return () => { clearInterval(timer); kill.forEach(k => k && k.kill()); };
  },
};

/* ------------------------------------------------------------ Shoppers: dashboard */
const dashboard = {
  key: 'dashboard', short: 'Shoppers Drug Mart: Dashboard redesign', next: 'ads',
  html: () => `<article class="cs">
  ${head({ co: 'Shoppers Drug Mart', title: 'Dashboard redesign: reimagining the digital refills experience', hero: 'qlUoOiW1HDEBKi74eSPhEgLPoZI.jpg', heroR: '4/3', heroAlt: 'A phone showing the redesigned prescriptions dashboard, leaning on a concrete ledge',
    meta: [['Role', 'Sr. Product Designer'], ['Timeline', '16 weeks'], ['Product', 'Digital Refills'], ['Industry', 'E-commerce']] })}
  <section>${rows([
    ['Role', 'I led the redesign of Shoppers Drug Mart’s legacy prescriptions dashboard, serving 2.5M+ users. I ensured alignment across teams and secured stakeholder buy-in. Given the platform’s complexity and scale, this project required strong cross-functional communication and a user-centered approach to drive impactful improvements.'],
    ['Context', 'As the Shoppers Drug Mart and PC Health portfolio expanded, the dashboard needed to evolve to support new functionalities, ensuring a seamless user experience while accommodating the growing range of services.'],
    ['Background', 'Digital Refills is an online platform (web and app) that allows users to easily manage, auto-refill, renew, transfer, and submit new prescriptions to their local pharmacy.'],
    ['Problem', 'The dashboard’s outdated interface caused frustration amongst users and led to a low user satisfaction score.'],
  ])}</section>

  <div class="dark"><p class="kick">Challenge</p><p class="statement">Redesign the complex dashboard into a seamless and intuitive experience to increase the overall user satisfaction score.</p></div>

  <section>
    <div class="head2"><h2>Pain points</h2><p>Users reported a host of problems using the outdated interface.</p></div>
    <div class="cols2">
      <div class="tile"><span class="n">70%</span><h3>Confusing refill statuses</h3><p>70% of the users reported they misunderstood the status tags.</p></div>
      <div class="tile"><h3>Unintuitive navigation</h3><p>Users struggled to switch user profiles, store locations, submit and transfer prescriptions.</p></div>
      <div class="tile"><h3>Multiple steps to refill</h3><p>Number of steps involved to refill the prescriptions was frustrating for the users.</p></div>
      <div class="tile"><h3>Lack of information on the prescriptions</h3><p>Users expected to view more information pertaining to their prescriptions.</p></div>
    </div>
  </section>

  <section>
    <div class="head2"><h2>Legacy designs, and where they ended up</h2><p>Initially designed with a limited set of features in mind, the legacy prescriptions dashboard struggled to scale alongside evolving user needs. This resulted in scattered navigation and reduced discoverability of key functionalities, leading to a suboptimal user experience.</p></div>
    <div class="compare" id="cmp">
      <img src="${src('fQnYqcn16Swua1Kn3R8m6NgM.png', 2048)}" alt="Legacy prescriptions dashboard on laptop and phone" loading="lazy">
      <div class="after"><img src="${src('bmsLIV5RDxZmLfUDlWdvyF7pOmY.png', 2048)}" alt="Final redesigned dashboard on two phones" loading="lazy"></div>
      <span class="lab l">Legacy</span><span class="lab r">Final solution</span><div class="knob"></div>
      <input type="range" min="0" max="100" value="50" aria-label="Drag to compare the legacy dashboard with the final solution">
    </div>
  </section>

  <section>
    <div class="row" style="border:0;padding:0"><h3>Discovery</h3><div><p>The main objective of the discover phase was to identify and prioritize dashboard information in order to drive design insights and decisions that would offer the best UX possible while providing users access to valuable information.</p><p>I collected prior research documents, survey feedback and conducted usability tests on current designs to uncover user pain points.</p></div></div>
    <div class="fig-row">${fig('gciTM8GBzDC4pDQ8B2WdDGcgbM.png', 'Annotated audit of the current pharmacy details, dashboard and prescription history')}${fig('lH3dVPaVWloDYcp9v1kSkS3F8.png', 'Flow diagram of the prescription journeys')}</div>
  </section>

  <section><h3>Lo-fi mocks</h3>${fig('DIEh6ZQvZJ8vfUcNoegjSyMSeA.png', 'Low fidelity wireframes of the dashboard sections')}</section>

  <section>
    <div class="row" style="border:0;padding:0"><h3>Ideate and design</h3><div><p>The next step involved strategizing and defining the project scope, which led to a brief design sprint with a team of designers. We focused on testing the most favoured concept for further enhancement, aiming to get a head start and align with stakeholders. The project was segmented into a few milestones and smaller, manageable chunks.</p><p>The outcome of the design sprint allowed me to shift gears towards designing with clearer expectations. I integrated status tracking, enhanced dashboard navigation, and improved the overall information architecture to help users perform tasks more easily. Additionally, I tested the status labels as part of the process. It was essential to evaluate the first design iteration to gather early feedback and make necessary design adjustments.</p></div></div>
    <div class="fig-row">${fig('bXGNf2qLiWpxNTXUf2m2UPL70JE.png', 'Annotated mobile designs: profile switch, carousel navigation, upcoming prescriptions and status tracking')}${fig('mPXB195gA6HsWcuLP7YJIfp6yd4.png', 'Desktop designs of the dashboard and all prescriptions view')}</div>
  </section>

  <section><h3>Test & iteration</h3>${fig('hWmTc9rBwWZ0z9xj6w7oWE7eQ.png', 'Iterated mobile screens with notes on navigation, copy and status tiles')}</section>
  <section><h3>Prescription details panel</h3>${fig('BVXuwYZcrTAwsI83HDkLEI46E.png', 'Prescription card opening into a details panel')}</section>
  <section><h3>2 step refill checkout</h3>${fig('RuMsczAkVLDTrAEc8HpjvqvVfk.png', 'Refill checkout in two steps: review, then confirmation')}</section>
  <section><h3>Hand-off specs</h3>${fig('MXzMR5dLRDJH564CrtYWMnV339E.png', 'Component specifications for profile, nav items and status cards', '2048/1368')}</section>

  <section>
    <h2>Impact</h2>
    <div class="stats light"><div><b>80%</b><span>OSAT score</span></div><div><b>8/10</b><span>Ease of use</span></div><div><b>100%</b><span>Task success rate</span></div><div><b>2.5M+</b><span>Dashboard users</span></div></div>
    ${fig('Vq6xPOHt7jjQLL7W9xYt7FiZwuE.png', 'The shipped dashboard on desktop and mobile')}
  </section>
  </article>`,
  init(root) {
    const c = root.querySelector('#cmp'), r = c.querySelector('input');
    const on = () => c.style.setProperty('--p', r.value + '%'); r.addEventListener('input', on); on();
    return () => {};
  },
};

/* ------------------------------------------------------------ Shoppers: ads */
const FORMATS = [
  ['Static ad / promo banner', 'GJXcljw568hiC9g0jXyY7AmEzJg.png', 'Users needed relevant services and products related to their prescriptions but currently have no options available.', 'Introduced static and promo banners triggered contextually based on time and seasonality. For example, a user filling a flu prescription would see a banner promoting flu shots, guiding them toward relevant actions.', 'Early-stage pilots showed a significant boost in ad relevance and CTR, driving higher engagement and conversions.'],
  ['Product recommendations', 'w3NTMM9my8YftPAITHGiTSTIjWw.png', 'Users wanted a more engaging way to discover relevant products to their health and wellness goals.', 'Introduced non-intrusive recommended ads featuring complementary product suggestions based on purchase history, browsing behavior, and demographics. For example, a user filling a prescription for high blood pressure might see a fitness tracker recommendation.', 'Early-stage pilots showed a significant lift in ad relevance and CTR, with users responding most positively to this format.'],
  ['Native ads / promo card layout', '5d8hbbXFBhw5L70aL8ZX8N8DKA.png', 'Users find the dashboard overly transactional and want a more engaging way to discover products similar to their past purchases on the e-commerce site so that they don’t have to leave a platform and hunt on another.', 'Launched native ads and promo cards leveraging purchase history, browsing behavior, and demographics to deliver highly relevant product recommendations.', 'Test results showed a significant lift in ad relevance and CTR, enhancing user engagement and driving higher conversions.'],
  ['Display banner', 'pG4ntq6lwRVobsz6sgDBDh3tyY.png', 'Users needed a seamless way to discover relevant products and services without disrupting their prescription management experience.', 'Integrate a display banner driven by prescription data, using generic categories such as flu, allergies, wellness shop and more.', 'While this approach improved ad visibility it had the lowest ad relevance compared to other formats, resulting in a lower CTR.'],
];
const ads = {
  key: 'ads', short: 'Shoppers Drug Mart: Ad formats and promos', next: 'returns',
  html: () => `<article class="cs">
  ${head({ co: 'Shoppers Drug Mart', title: 'Ad formats and promos for digital health', hero: '8T6YLt4HN6NKrqzmlxxHivITg.jpg', heroR: '4/3', heroAlt: 'Two laptops showing recommended products inside the prescriptions dashboard',
    meta: [['Role', 'Sr. Product Designer'], ['Timeline', '12 weeks'], ['Product', 'Digital Refills'], ['Industry', 'E-commerce'], ['Platform', 'Web']] })}
  <section>${rows([
    ['Role', 'As the sole product designer on the team, I led the product vision, strategy, and design for integrating ads and promos on web. I designed user-centric solutions that delivered measurable positive outcomes and conducted pilot tests to evaluate the impact of various design inclusions.'],
    ['Background', 'The idea of including ad formats on the digital health dashboard focuses on adding value for users with relevant product suggestions while aiming to drive engagement and open up new revenue streams. Currently, users are able to shop products on Shoppers Drug Mart web and app and have to leave the website to refill prescriptions and vice versa.'],
    ['Problem', 'Users are unable to shop for wellness products tailored to their health data within the prescriptions dashboard, which makes the experience feel very transactional.'],
  ])}</section>

  <section>
    <div class="head2"><h2>Final solution</h2><p>Cross-promote using ad formats to align with users’ health and wellness goals while enhancing their experience.</p></div>
    <div class="fig-row">${fig('knWvoDlbJojAc0sJ3pYqWppFuY.png', 'Dashboard with a Recommended for you product row')}${fig('csMpLerZsEoJkzNXfmbUNBmOtwE.png', 'Health, fitness and beyond native promo cards')}</div>
  </section>

  <section>
    <div class="head2"><h2>Pain points</h2><p>I decided to review the research we’ve gathered over time, and after synthesizing all the feedback, several key themes emerged.</p></div>
    <div class="cols3">
      <div><h3>Lack of personalization</h3><p>Users feel the dashboard is purely transactional and does not suggest relevant health products.</p></div>
      <div><h3>Missed convenience</h3><p>Users have to visit multiple platforms to find complementary health and wellness products.</p></div>
      <div><h3>No proactive health recommendations</h3><p>Users want preventive care suggestions, such as supplements or wellness tools, tailored to their needs.</p></div>
    </div>
    ${fig('zlVWSvpmutvU0L29Cpur9XPI.png', 'The dashboard before ad integration and after', '16/9', 'Crafting elegant and impactful solutions that solve user problems: before ad integration, and after.')}
  </section>

  <div class="dark"><p class="kick">Opportunity</p><p class="statement">How can we introduce personalized product recommendations (ads) that enhance the user experience, ensuring the ads are relevant, non-intrusive, and add value to their healthcare journey?</p></div>

  <section class="split">
    <div><h2>Key considerations</h2>
      <ul class="checks" style="margin-top:22px"><li>Increase user engagement by presenting non-intrusive ads that provide value</li><li>Integrate personalized ads, products or promos that align with users’ health goals</li><li>Leverage “The wellness shop” page to cross promote products to e-prescriptions dashboard users (I designed this page as part of a different initiative)</li></ul></div>
    ${fig('tNObBUaGqCGz7OaN21cBRQHAtsU.png', 'The wellness shop page on laptop and phone')}
  </section>

  <section class="split">
    ${fig('qW4jaUeSc5akS6ieOzGqZCgYCdw.png', 'Research participants and quotes from interviews')}
    <div><h2>Research insights</h2><p>I decided to review the research we’d gathered over time, and after synthesizing all the feedback, several key themes emerged.</p>
      <ol class="plainlist" style="margin-top:18px"><li>Convenience and time-saving</li><li>Health specific recommendations</li><li>Integrated shopping experience</li></ol></div>
  </section>

  <section>
    <div class="head2"><h2>Test hypothesis</h2><p>I wanted to test the hypothesis by conducting user interviews and understand user motivations to seeing ads or promotions on the dashboard. Data insights would help mitigate risks involved in the early stage of the process.</p></div>
    <div class="bars" id="bars">
      <div><b>90%</b><span style="--v:90%"><em>Searched for complementary products elsewhere</em></span></div>
      <div><b>80%</b><span style="--v:80%"><em>Find prescriptions dashboard very transactional</em></span></div>
      <div><b>75%</b><span style="--v:75%"><em>Want integrated recommendations within the dashboard</em></span></div>
    </div>
  </section>

  <section class="split">
    <div><h2>Competitive analysis</h2><p>Renowned pharmacy labels cross-promote products on their prescriptions dashboard in different ways.</p></div>
    ${fig('jlj37rStgkej37k39W6zpt9A4Sw.png', 'How three pharmacy brands cross-promote on their prescription dashboards')}
  </section>

  <section>
    <h2>Challenges</h2>
    <ul class="plainlist" style="margin-top:22px"><li>Ads and promos can be shown on general health categories only and not on users’ specific health data</li><li>Health data and privacy compliance</li><li>Consistency between the images and content on the e-comm site and the dashboard</li><li>Restrictions on the number of product cards that can be shown to avoid cognitive overload</li><li>Ad and promo fetch and load time</li></ul>
  </section>

  <section>
    <div class="head2"><h2>Ideation and design</h2><p>Four formats went to pilot. Pick one to see the problem it answered and how it did.</p></div>
    <div class="tabs" role="tablist" id="fmtTabs">${FORMATS.map((f, i) => `<button type="button" role="tab" aria-selected="${i === 0}" data-i="${i}">#${i + 1} ${f[0]}</button>`).join('')}</div>
    <div class="pane" id="fmtPane"></div>
  </section>

  <section>
    <div class="row" style="border:0;padding:0"><h3>Design system contribution</h3><p>I curated a specific colour palette for ads and promos on PC Health and Shoppers, focusing on accessibility, scannability, and readability, while also ensuring it was in line with the brand guidelines. The colours and the design components have been stress tested before adding them into the design system.</p></div>
    ${fig('JYS9o83M330l4EquTw3Gr8Hio8.png', 'Digital colour palette for ads and promos with component examples')}
  </section>

  <section>
    <h2>Impact</h2>
    <div class="stats light"><div><b>85%</b><span>Users expressed the ads were non-intrusive and did not disrupt their experience.</span></div><div><b>CTR up</b><span>Significant increase in CTR and ad viewability with static, recommended and native ads.</span></div><div><b>50%</b><span>Increase in user engagement after introducing ads on the dashboard vs before integration.</span></div></div>
  </section>

  <section>
    <h2>Learnings and takeaways</h2>
    <div class="cols2">
      <div class="tile"><h3>Personalization is key</h3><p>Tailoring ads and product recommendations based on user data such as purchase history, browsing behavior, and demographics significantly enhances relevance, leading to higher engagement and conversion rates.</p></div>
      <div class="tile"><h3>Seamless integration is key</h3><p>Integrating ads in a way that feels natural and non-intrusive, such as inline with prescription data, improves user experience and maintains a balance between promoting products and preserving the usability of the platform.</p></div>
    </div>
  </section>
  </article>`,
  init(root, { ScrollTrigger }) {
    const pane = root.querySelector('#fmtPane'), tabs = [...root.querySelectorAll('#fmtTabs button')];
    const show = i => { const f = FORMATS[i]; tabs.forEach((t, j) => t.setAttribute('aria-selected', j === i));
      pane.innerHTML = `<dl><div><dt>Problem</dt><dd>${f[2]}</dd></div><div><dt>Solution</dt><dd>${f[3]}</dd></div><div><dt>Impact</dt><dd>${f[4]}</dd></div></dl>${fig(f[1], f[0] + ' design')}`; };
    root.querySelector('#fmtTabs').addEventListener('click', e => { const b = e.target.closest('button'); b && show(+b.dataset.i); });
    show(0);
    const bars = root.querySelector('#bars');
    const st = ScrollTrigger.create({ trigger: bars, start: 'top 80%', once: true, onEnter: () => bars.classList.add('on') });
    return () => st.kill();
  },
};

export const CASES = { returns, dashboard, ads };
