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
  const partyCards = document.querySelector("[data-wedding-party-cards]");
  const rsvpApp = document.querySelector("[data-rsvp-app]");
  const rsvpDialog = document.querySelector("[data-rsvp-dialog]");
  const rsvpSummary = document.querySelector("[data-rsvp-summary]");
  const openRsvpButton = document.querySelector("[data-open-rsvp]");
  const publicRsvp = document.querySelector("[data-public-rsvp]");
  const welcomeSection = document.querySelector("#welcome");
  const listNames = (names = []) => new Intl.ListFormat("en-NZ", { style: "long", type: "conjunction" }).format(names);
  let inviteData = null;

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

  const openRsvpDialog = () => {
    if (!inviteData || !rsvpDialog) return;
    if (!inviteData.rsvp_open && inviteData.rsvp) {
      renderSummary(inviteData);
      return;
    }
    renderForm(inviteData);
    if (typeof rsvpDialog.showModal === "function") rsvpDialog.showModal();
    else rsvpDialog.setAttribute("open", "");
  };

  const closeRsvpDialog = () => {
    if (!rsvpDialog) return;
    if (typeof rsvpDialog.close === "function") rsvpDialog.close();
    else rsvpDialog.removeAttribute("open");
  };

  const partyCard = (singular, plural, names, brief) => {
    const title = names.length === 1 ? names[0] : listNames(names);
    return `
      <div class="invitation-card invitation-card--party">
        <p class="section__eyebrow section__eyebrow--caps">${names.length === 1 ? singular : plural}</p>
        <h2 class="section__title">${escapeHtml(title)}</h2>
        <p class="section__body">${escapeHtml(brief?.body || "Day-of details will be added here.")}</p>
      </div>`;
  };

  const renderWeddingParty = (weddingParty) => {
    if (!partySection || !partyCards || !weddingParty) return;
    const cards = [];
    const bridesmaids = weddingParty.bridesmaids?.names || [];
    const groomsmen = weddingParty.groomsmen?.names || [];

    if (bridesmaids.length) cards.push(partyCard("Bridesmaid", "Bridesmaids", bridesmaids, weddingParty.bridesmaids.brief));
    if (groomsmen.length) cards.push(partyCard("Groomsman", "Groomsmen", groomsmen, weddingParty.groomsmen.brief));

    if (!cards.length) {
      partySection.hidden = true;
      partyCards.innerHTML = "";
      return;
    }

    partySection.hidden = false;
    partyCards.innerHTML = cards.join("");
  };

  const renderSummary = (data) => {
    if (!rsvpSummary || !openRsvpButton) return;
    const { rsvp, guests } = data;
    const deadline = invitationSection?.querySelector(".invitation-card__deadline");
    if (deadline) deadline.hidden = Boolean(rsvp);
    const heroRsvp = document.querySelector("[data-hero-rsvp]");
    if (!rsvp) {
      rsvpSummary.innerHTML = "";
      openRsvpButton.textContent = "Reply to your invitation";
      openRsvpButton.hidden = !data.rsvp_open;
      if (heroRsvp) heroRsvp.textContent = "Kindly RSVP";
      return;
    }

    const attendance = guests.map((guest) => {
      const label = guest.is_plus_one ? "Plus one" : escapeHtml(guest.name);
      return `<li><span>${label}</span><strong>${rsvp.guest_responses?.[guest.id] ? "Coming" : "Not coming"}</strong></li>`;
    }).join("");

    rsvpSummary.innerHTML = `
      <div class="rsvp-confirmation rsvp-confirmation--inline">
        <p class="section__eyebrow section__eyebrow--caps">Your reply</p>
        <ul class="rsvp-summary">${attendance}</ul>
        <dl class="rsvp-summary__details">
          <div><dt>Staying overnight</dt><dd>${rsvp.cabin_requested ? "Yes, cabin requested" : "No, day guests only"}</dd></div>
          <div><dt>Contact email</dt><dd>${escapeHtml(rsvp.contact_email)}</dd></div>
          ${rsvp.dietary_notes ? `<div><dt>Dietary needs or allergies</dt><dd>${escapeHtml(rsvp.dietary_notes)}</dd></div>` : ""}
          ${rsvp.note ? `<div><dt>Your note</dt><dd>${escapeHtml(rsvp.note)}</dd></div>` : ""}
        </dl>
        ${data.rsvp_open ? "" : `<p class="rsvp-closed">RSVP is now closed. If you need to change your reply, please contact Keegan.</p>`}
      </div>`;
    openRsvpButton.textContent = "Edit RSVP";
    openRsvpButton.hidden = !data.rsvp_open;
    if (heroRsvp) heroRsvp.textContent = "Edit RSVP";
  };

  const renderForm = (data) => {
    if (!rsvpApp) return;
    if (!data.rsvp_open) {
      renderSummary(data);
      closeRsvpDialog();
      return;
    }
    const saved = data.rsvp || {};
    const namedGuests = data.guests.filter((guest) => !guest.is_plus_one);
    const guests = namedGuests.map((guest) => {
      const attending = saved.guest_responses?.[guest.id];
      const plusOnes = data.guests.filter((plusOne) => plusOne.plus_one_of === guest.id);
      const plusComing = plusOnes.filter((plusOne) => saved.guest_responses?.[plusOne.id]).length;
      const plusField = plusOnes.length ? `
        <fieldset class="rsvp-plus">
          <legend>Plus ones coming</legend>
          ${Array.from({ length: plusOnes.length + 1 }, (_, count) => `
            <label><input type="radio" name="plus-${guest.id}" value="${count}" ${plusComing === count ? "checked" : ""} required /> ${count}</label>
          `).join("")}
        </fieldset>` : "";
      return `
        <fieldset class="rsvp-person">
          <legend>${escapeHtml(guest.name)}</legend>
          <label><input type="radio" name="guest-${guest.id}" value="true" ${attending === true ? "checked" : ""} required /> Coming</label>
          <label><input type="radio" name="guest-${guest.id}" value="false" ${attending === false ? "checked" : ""} /> Not coming</label>
          ${plusField}
        </fieldset>`;
    }).join("");

    rsvpApp.innerHTML = `
      <form class="rsvp-form" data-rsvp-form>
        <p class="section__eyebrow section__eyebrow--caps">Your RSVP</p>
        <h3 class="section__title" id="rsvp-dialog-title">Will you be there?</h3>
        <p class="rsvp-form__intro">Please reply by <strong>1 January 2027</strong> for each named guest.</p>
        <div class="rsvp-people">${guests}</div>
        <fieldset class="rsvp-choice">
          <legend>Would you like to stay overnight?</legend>
          <p>Cabin rooms have multiple bunks. Please bring your own bedding and be packed by 10:00 am the next morning.</p>
          <label><input type="radio" name="cabin_requested" value="true" ${saved.cabin_requested ? "checked" : ""} required /> Yes, please reserve a cabin room for our group</label>
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
      const guestResponses = {};
      data.guests.filter((guest) => !guest.is_plus_one).forEach((guest) => {
        guestResponses[guest.id] = formData.get(`guest-${guest.id}`);
        const plusOnes = data.guests.filter((plusOne) => plusOne.plus_one_of === guest.id);
        const coming = Math.max(0, Math.min(plusOnes.length, Number(formData.get(`plus-${guest.id}`)) || 0));
        plusOnes.forEach((plusOne, index) => {
          guestResponses[plusOne.id] = index < coming ? "true" : "false";
        });
      });
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
        inviteData = updated;
        renderSummary(updated);
        closeRsvpDialog();
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
      inviteData = data;
      const named = data.guests.filter((guest) => !guest.is_plus_one).map((guest) => guest.name);
      const plusCount = data.guests.filter((guest) => guest.is_plus_one).length;
      const plusText = plusCount === 1 ? " and a plus one" : plusCount > 1 ? ` and ${plusCount} plus ones` : "";
      invitationSection.hidden = false;
      if (publicRsvp) publicRsvp.hidden = true;
      if (welcomeSection) welcomeSection.hidden = true;
      const label = data.party.label?.trim();
      invitationSection.querySelector("[data-invite-heading]").textContent = label ? `You’re invited, ${label}` : "You’re invited";
      invitationSection.querySelector("[data-invite-names]").textContent =
        `This invitation is for ${listNames(named)}${plusText}. Only these guests are invited with this invitation. No extra guests unless your invite says so.`;
      document.querySelectorAll('a[href="#rsvp"], a[data-hero-rsvp], a[data-stay-rsvp]').forEach((link) => {
        link.setAttribute("href", "#your-invitation");
      });
      const heroRsvp = document.querySelector("[data-hero-rsvp]");
      if (heroRsvp) heroRsvp.textContent = "Kindly RSVP";
      const stayRsvp = document.querySelector("[data-stay-rsvp]");
      if (stayRsvp) stayRsvp.textContent = "Request a cabin in the RSVP";
      renderWeddingParty(data.wedding_party);
      renderSummary(data);
    } catch (error) {
      if (invitationSection) {
        invitationSection.hidden = false;
        invitationSection.querySelector("[data-invite-names]").textContent =
          "We could not load this invitation. Please contact Keegan for help.";
      }
    }
  };

  openRsvpButton?.addEventListener("click", openRsvpDialog);
  document.querySelector("[data-close-rsvp]")?.addEventListener("click", closeRsvpDialog);
  rsvpDialog?.addEventListener("click", (event) => {
    if (event.target === rsvpDialog) closeRsvpDialog();
  });
  document.querySelector("[data-hero-rsvp]")?.addEventListener("click", (event) => {
    if (!inviteCode || !inviteData) return;
    event.preventDefault();
    invitationSection?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    openRsvpDialog();
  });

  loadInvitation();
})();
