(() => {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 48);
  };

  const getFocusable = () => {
    if (!nav) return [];
    return [...nav.querySelectorAll('a[href], button:not([disabled])')].filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
    );
  };

  const closeNav = ({ restoreFocus = false } = {}) => {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    header?.classList.remove("has-nav-open");
    if (restoreFocus) toggle.focus();
  };

  const openNav = () => {
    if (!nav || !toggle) return;
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    header?.classList.add("has-nav-open");
    const focusable = getFocusable();
    focusable[0]?.focus();
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      if (open) openNav();
      else closeNav();
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeNav());
    });

    document.addEventListener("keydown", (event) => {
      if (!nav.classList.contains("is-open")) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeNav({ restoreFocus: true });
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === toggle)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  window.addEventListener("scroll", setHeaderState, { passive: true });
  setHeaderState();

  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const track = gallery.querySelector("[data-gallery-track]");
    const prev = gallery.querySelector("[data-gallery-prev]");
    const next = gallery.querySelector("[data-gallery-next]");
    if (!track || !prev || !next) return;

    const getStep = () => {
      const slide = track.querySelector(".gallery-slider__slide");
      if (!slide) return track.clientWidth * 0.8;
      const styles = window.getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      return slide.getBoundingClientRect().width + gap;
    };

    const updateButtons = () => {
      const maxScroll = track.scrollWidth - track.clientWidth - 4;
      prev.disabled = track.scrollLeft <= 4;
      next.disabled = track.scrollLeft >= maxScroll;
    };

    const scrollByDir = (dir) => {
      track.scrollBy({ left: dir * getStep(), behavior: reduceMotion ? "auto" : "smooth" });
    };

    prev.addEventListener("click", () => scrollByDir(-1));
    next.addEventListener("click", () => scrollByDir(1));
    track.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();
  });

  if (!reduceMotion) {
    const reveals = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );

    reveals.forEach((el, index) => {
      el.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      observer.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }

  const SUPABASE_URL = "https://fwtkgtokyurntzzsqgwc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_HZ9IEPcCW_2MjD-i5dVILA_1r-_w5FX";
  const inviteCode = new URLSearchParams(window.location.search).get("invite");
  const invitationSection = document.querySelector("#your-invitation");
  const partySection = document.querySelector("#wedding-party");
  const rsvpApp = document.querySelector("[data-rsvp-app]");
  const rsvpEmpty = document.querySelector("[data-rsvp-empty]");
  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));

  const rpc = async (name, params) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(params)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.error || "Something went wrong. Please try again.");
    return body;
  };

  const renderWeddingParty = (brief) => {
    if (!brief || !partySection) return;
    partySection.hidden = false;
    partySection.querySelector("[data-brief-title]").textContent = brief.title;
    partySection.querySelector("[data-brief-body]").textContent = brief.body;
  };

  const renderConfirmation = (data) => {
    const { rsvp, guests } = data;
    if (!rsvp || !rsvpApp) return renderForm(data);
    const attendance = guests.map((guest) =>
      `<li><span>${escapeHtml(guest.name)}</span><strong>${rsvp.guest_responses?.[guest.id] ? "Coming" : "Not coming"}</strong></li>`
    ).join("");
    const editable = data.rsvp_open;
    rsvpApp.hidden = false;
    rsvpApp.innerHTML = `
      <div class="rsvp-confirmation">
        <p class="section__eyebrow section__eyebrow--caps">Your RSVP</p>
        <h3 class="section__title">You’re all set</h3>
        <p>Thank you for your reply. Here is what we have saved.</p>
        <ul class="rsvp-summary">${attendance}</ul>
        <dl class="rsvp-summary__details">
          <div><dt>Staying overnight</dt><dd>${rsvp.cabin_requested ? "Yes, cabin requested" : "No, day guests only"}</dd></div>
          <div><dt>Contact email</dt><dd>${escapeHtml(rsvp.contact_email)}</dd></div>
          ${rsvp.dietary_notes ? `<div><dt>Dietary needs or allergies</dt><dd>${escapeHtml(rsvp.dietary_notes)}</dd></div>` : ""}
          ${rsvp.note ? `<div><dt>Your note</dt><dd>${escapeHtml(rsvp.note)}</dd></div>` : ""}
        </dl>
        ${editable ? `<button class="btn btn--primary" type="button" data-edit-rsvp>Edit reply</button>` : `<p class="rsvp-closed">RSVP is now closed. If you need to change your reply, please contact Keegan.</p>`}
      </div>`;
    rsvpApp.querySelector("[data-edit-rsvp]")?.addEventListener("click", () => renderForm(data));
  };

  const renderForm = (data) => {
    if (!rsvpApp) return;
    if (!data.rsvp_open) return renderConfirmation(data);
    const saved = data.rsvp || {};
    const guests = data.guests.map((guest) => {
      const attending = saved.guest_responses?.[guest.id];
      return `
        <fieldset class="rsvp-person">
          <legend>${escapeHtml(guest.name)}</legend>
          <label><input type="radio" name="guest-${guest.id}" value="true" ${attending === true ? "checked" : ""} required /> Coming</label>
          <label><input type="radio" name="guest-${guest.id}" value="false" ${attending === false ? "checked" : ""} /> Not coming</label>
        </fieldset>`;
    }).join("");
    rsvpApp.hidden = false;
    rsvpApp.innerHTML = `
      <form class="rsvp-form" data-rsvp-form>
        <p class="section__eyebrow section__eyebrow--caps">Your RSVP</p>
        <h3 class="section__title">Will you be there?</h3>
        <p class="rsvp-form__intro">Please reply for each named guest.</p>
        <div class="rsvp-people">${guests}</div>
        <fieldset class="rsvp-choice">
          <legend>Would you like to stay overnight?</legend>
          <p>Cabin rooms have multiple bunks. Please bring your own bedding and be packed by 10:00 am the next morning.</p>
          <label><input type="radio" name="cabin_requested" value="true" ${saved.cabin_requested ? "checked" : ""} required /> Yes, please reserve a cabin room for our party</label>
          <label><input type="radio" name="cabin_requested" value="false" ${saved.cabin_requested === false ? "checked" : ""} /> No, we are day guests only</label>
        </fieldset>
        <label class="form-field">Contact email<input name="contact_email" type="email" autocomplete="email" value="${escapeHtml(saved.contact_email || "")}" required /></label>
        <label class="form-field">Dietary needs or allergies <span>Optional</span><textarea name="dietary_notes" rows="3">${escapeHtml(saved.dietary_notes || "")}</textarea></label>
        <label class="form-field">Note for Suzie and Keegan <span>Optional</span><textarea name="note" rows="3">${escapeHtml(saved.note || "")}</textarea></label>
        <p class="form-status" aria-live="polite"></p>
        <button class="btn btn--primary" type="submit">Save RSVP</button>
      </form>`;
    const form = rsvpApp.querySelector("[data-rsvp-form]");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      const status = form.querySelector(".form-status");
      const formData = new FormData(form);
      const guestResponses = Object.fromEntries(data.guests.map((guest) => [guest.id, formData.get(`guest-${guest.id}`)]));
      if (!Object.values(guestResponses).includes("true") && formData.get("cabin_requested") === "true") {
        status.textContent = "A cabin can only be requested when someone is coming.";
        return;
      }
      submit.disabled = true;
      status.textContent = "Saving your RSVP…";
      try {
        const updated = await rpc("submit_wedding_rsvp", {
          p_invite_code: inviteCode,
          p_contact_email: formData.get("contact_email"),
          p_cabin_requested: formData.get("cabin_requested") === "true",
          p_dietary_notes: formData.get("dietary_notes"),
          p_note: formData.get("note"),
          p_guest_responses: guestResponses
        });
        renderConfirmation(updated);
      } catch (error) {
        status.textContent = error.message;
        submit.disabled = false;
      }
    });
  };

  const loadInvitation = async () => {
    if (!inviteCode) return;
    try {
      const data = await rpc("guest_invite", { p_invite_code: inviteCode });
      if (!data?.party || !invitationSection) return;
      const names = data.guests.map((guest) => guest.name);
      invitationSection.hidden = false;
      invitationSection.querySelector("[data-invite-heading]").textContent = `You’re invited, ${data.party.label}`;
      invitationSection.querySelector("[data-invite-names]").textContent =
        `This invitation is for ${new Intl.ListFormat("en-NZ", { style: "long", type: "conjunction" }).format(names)}.`;
      const note = invitationSection.querySelector("[data-invite-note]");
      if (data.party.personal_note) {
        note.hidden = false;
        note.textContent = data.party.personal_note;
      }
      rsvpEmpty.hidden = true;
      renderWeddingParty(data.brief);
      renderConfirmation(data);
    } catch (error) {
      if (rsvpEmpty) rsvpEmpty.innerHTML = `<p>We could not load this invitation. Please contact Keegan for help.</p>`;
    }
  };

  loadInvitation();
})();
