// A working recreation of the "Chat with eBay.ai" returns flow from the case study.
// Copy follows the shipped screens; each step maps to a numbered annotation.
const LIST = ['a photo of the overall item condition', 'a close-up photo of the cracked or dented area'];
export const FLOW = [
  { msgs: [['a', ["Hi qibus, I'm here to help you with this item. Before we get started, did you already receive it?"]]],
    chips: ['Yes, I received it', 'No, I need help'], pick: 0, stack: true, input: 'Chat is disabled' },
  { msgs: [['u', 'Yes, I received it'], ['a', ['OK. Can you tell me about the problem or choose one of these common issues?']]],
    chips: ["I don't want the item anymore", 'I ordered the wrong item', 'The item is damaged or defective', "The item isn't as described"], pick: 2 },
  { msgs: [['u', 'The item is damaged or defective'], ['a', ['Can you share more details or choose one of these common issues?']], ['u', 'Arrived cracked or dented'],
      ['a', ['Just to make sure I understand - the item arrived cracked or dented, is that right?']]],
    chips: ["Yes, that's correct", "No, that's incorrect"], pick: 0, stack: true },
  { msgs: [['u', "Yes, that's correct"], ['a', ["We'll need some supporting photos to proceed with your return. Please provide:", LIST, 'You can upload up to 3 photos.']]],
    chips: ['Upload photo'], pick: 0, cam: true },
  { msgs: [], camera: true },
  { msgs: [['thumbs'], ['a', ["The photo you uploaded does not show the purchased item or the cracked or dented area, so we still can't confirm the issue. If you'd like another review, please provide:", LIST,
      "Or, you can start a return under the seller's return policy. What would you like to do next?"]]],
    chips: ['Upload photo', 'Start a return with the seller'], pick: 0, stack: true, cam: true },
  { msgs: [['photo'], ['a', ["Based on the photos provided, I'm unable to confirm eligibility for eBay Money Back Guarantee because the damaged area isn't shown in a close-up view. Would you like to continue by sending a return request to the seller?"]]],
    chips: ['Yes', 'No'], pick: 0, stack: true },
  { msgs: [['u', 'Yes'], ['a', ["Select <b>Start my return</b>, and we'll guide you through the next steps."]]],
    chips: ['Start my return', 'Start over'], pick: 1, stack: true, input: 'Chat is disabled' },
];

const CAM = '<svg viewBox="0 0 20 20" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="5.5" width="15" height="11" rx="2.5"/><circle cx="10" cy="11" r="3"/><path d="M7 5.5l1-2h4l1 2"/></svg>';

export class Chat {
  constructor(host, { onPick } = {}) {
    this.onPick = onPick; this.step = -1;
    host.innerHTML = `<div class="phone"><div class="phone-in">
      <div class="ph-status"><span>14:08</span><i></i></div>
      <div class="ph-sheet">
        <div class="ph-head"><span>+</span><b>Chat with eBay.ai</b><span>···</span><span>✕</span></div>
        <div class="ph-body"></div>
        <div class="ph-input"><div>Type here...</div><i></i></div>
        <div class="ph-cam"><div class="top"><span>Flash off</span><b>Done</b></div><div class="view"></div><div class="bot"><span>0 of 3</span><i class="shutter"></i><span>4:3</span></div></div>
      </div></div></div>`;
    this.body = host.querySelector('.ph-body'); this.input = host.querySelector('.ph-input div'); this.cam = host.querySelector('.ph-cam');
    this.body.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (this.onPick) this.onPick(this.step, +b.dataset.i);
    });
  }
  setStep(i, instant) {
    i = Math.max(0, Math.min(FLOW.length - 1, i)); if (i === this.step) return; const prev = this.step; this.step = i;
    const cur = FLOW[i]; let html = '', n = 0;
    const fresh = s => (!instant && s === i && i > prev);
    html += `<p class="ph-note">Chat with eBay.ai is experimental. Check our <u>Privacy Notice</u> and learn <u>how eBay.ai processes your data</u>.</p>
      <div class="ph-order"><i></i><div>Apple MacBook Air 13" M3<br>Order: 10-00271-71596<b>$145.00</b></div></div>`;
    FLOW.forEach((st, s) => {
      if (s > i) return;
      for (const [who, c] of st.msgs) {
        const cls = fresh(s) ? ` new" style="--n:${n++}` : '';
        if (who === 'u') html += `<div class="msg u${cls}">${c}</div>`;
        else if (who === 'thumbs') html += `<div class="msg thumbs${cls}"><i></i><i></i><i></i></div>`;
        else if (who === 'photo') html += `<div class="msg photo${cls}"></div>`;
        else html += `<div class="msg a${cls}">${c.map(x => Array.isArray(x) ? `<ul>${x.map(l => `<li>${l}</li>`).join('')}</ul>` : `<p>${x}</p>`).join('')}</div>`;
      }
    });
    if (cur.chips) html += `<div class="chips${cur.stack ? ' stack' : ''}${fresh(i) ? ` new" style="--n:${n}` : ''}">${cur.chips.map((c, j) => `<button type="button" data-i="${j}"${j === cur.pick ? ' class="pick"' : ''}>${cur.cam && j === 0 ? CAM : ''}${c}</button>`).join('')}</div>`;
    this.body.innerHTML = html;
    const b = this.body; b.scrollTo({ top: b.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
    this.input.textContent = cur.input || 'Type here...';
    this.cam.classList.toggle('on', !!cur.camera);
  }
}
