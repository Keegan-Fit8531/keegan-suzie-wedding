(() => {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const backdrop = document.querySelector("[data-nav-backdrop]");
  const main = document.getElementById("main");
  const footer = document.querySelector(".site-footer");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const navDrawerQuery = window.matchMedia("(max-width: 900px)");

  const setHeaderState = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 48);
  };

  const getFocusable = () => {
    if (!nav || !toggle) return [];
    const navItems = [...nav.querySelectorAll("a[href], button:not([disabled])")].filter(
      (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
    );
    return [toggle, ...navItems];
  };

  const setPageInert = (inert) => {
    if (inert) {
      main?.setAttribute("inert", "");
      footer?.setAttribute("inert", "");
    } else {
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
    }
  };

  const closeNav = ({ restoreFocus = false } = {}) => {
    if (!nav || !toggle) return;
    nav.classList.remove("is-open");
    nav.removeAttribute("aria-modal");
    toggle.setAttribute("aria-expanded", "false");
    header?.classList.remove("has-nav-open");
    document.body.classList.remove("has-nav-open");
    backdrop?.classList.remove("is-visible");
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.setAttribute("aria-hidden", "true");
    }
    setPageInert(false);
    if (restoreFocus) toggle.focus();
  };

  const openNav = () => {
    if (!nav || !toggle || !navDrawerQuery.matches) return;
    nav.classList.add("is-open");
    nav.setAttribute("aria-modal", "true");
    toggle.setAttribute("aria-expanded", "true");
    header?.classList.add("has-nav-open");
    document.body.classList.add("has-nav-open");
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.add("is-visible");
      backdrop.setAttribute("aria-hidden", "false");
    }
    setPageInert(true);
    const focusable = getFocusable();
    (focusable[1] || focusable[0])?.focus();
  };

  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      if (open) openNav();
      else closeNav();
    });

    backdrop?.addEventListener("click", () => closeNav({ restoreFocus: true }));

    header?.querySelector(".brand")?.addEventListener("click", () => {
      if (nav.classList.contains("is-open")) closeNav();
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

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const onNavBreakpointChange = (event) => {
      if (!event.matches) closeNav();
    };
    if (typeof navDrawerQuery.addEventListener === "function") {
      navDrawerQuery.addEventListener("change", onNavBreakpointChange);
    } else if (typeof navDrawerQuery.addListener === "function") {
      navDrawerQuery.addListener(onNavBreakpointChange);
    }
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
  const inviteCalendar = document.querySelector("[data-invite-calendar]");
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
    const resetScroll = () => {
      const panel = rsvpDialog.querySelector(".rsvp-dialog__panel");
      if (panel) panel.scrollTop = 0;
      rsvpDialog.scrollTop = 0;
    };
    resetScroll();
    requestAnimationFrame(resetScroll);
  };

  const closeRsvpDialog = () => {
    if (!rsvpDialog) return;
    if (typeof rsvpDialog.close === "function") rsvpDialog.close();
    else rsvpDialog.removeAttribute("open");
  };

  const guestRoleLabel = (type) => {
    if (type === "maid_of_honor") return "Maid of Honor";
    if (type === "bridesmaid") return "Bridesmaid";
    if (type === "best_man") return "Best Man";
    if (type === "groomsman") return "Groomsman";
    return "";
  };

  const partySideLabel = (members = [], side) => {
    if (!members.length) return side === "bride" ? "Bridesmaids" : "Groomsmen";
    if (members.length === 1) {
      return guestRoleLabel(members[0].guest_type) || (side === "bride" ? "Bridesmaid" : "Groomsman");
    }
    return side === "bride" ? "Bridesmaids" : "Groomsmen";
  };

  const partyCard = (members, brief, side) => {
    const eyebrow = partySideLabel(members, side);
    const single = members.length === 1;
    const heading = single
      ? `<h2 class="section__title">${escapeHtml(members[0].name)}</h2>`
      : `<ul class="wedding-party__roster">${members.map((member) => {
          const role = guestRoleLabel(member.guest_type);
          return `<li><span>${escapeHtml(member.name)}</span>${role ? `<small>${escapeHtml(role)}</small>` : ""}</li>`;
        }).join("")}</ul>`;
    return `
      <div class="invitation-card invitation-card--party">
        <p class="section__eyebrow section__eyebrow--caps">${escapeHtml(eyebrow)}</p>
        ${heading}
        <p class="section__body">${escapeHtml(brief?.body || "Day-of details will be added here.")}</p>
      </div>`;
  };

  const responseValue = (responses = {}, guestId) => {
    const value = responses?.[guestId] ?? responses?.[String(guestId)];
    if (value === true || value === "true") return true;
    if (value === false || value === "false") return false;
    return null;
  };

  const isDeclined = (memberId, responses = {}) => responseValue(responses, memberId) === false;

  const attendanceLabel = (responses = {}, guestId) => {
    const value = responseValue(responses, guestId);
    if (value === true) return "Coming";
    if (value === false) return "Not coming";
    return "Pending";
  };

  const cabinGuestSet = (rsvp = {}) => {
    const ids = Array.isArray(rsvp.cabin_guests) ? rsvp.cabin_guests : [];
    return new Set(ids.map((id) => String(id)));
  };

  const hasPendingGuests = (guests = [], responses = {}) =>
    guests.some((guest) => responseValue(responses, guest.id) === null);

  const cabinSummaryLabel = (rsvp = {}, guests = []) => {
    if (!rsvp.cabin_requested) return "No, day guests only";
    const cabinIds = cabinGuestSet(rsvp);
    const named = guests.filter((guest) => !guest.is_plus_one && cabinIds.has(String(guest.id)));
    if (!named.length) return "Yes, cabin requested";
    const parts = named.map((guest) => {
      const plusComing = guests.filter(
        (plusOne) => plusOne.plus_one_of === guest.id && cabinIds.has(String(plusOne.id))
      ).length;
      const label = guestInviteLabel(guest);
      return plusComing ? `${label} (+${plusComing})` : label;
    });
    return `Yes, for ${listNames(parts)}`;
  };

  const plusAttendanceNote = (plusOnes = [], responses = {}) => {
    if (!plusOnes.length) return "";
    if (plusOnes.length === 1) {
      const value = responseValue(responses, plusOnes[0].id);
      if (value === true) return `<span class="invitation-card__plus">Plus one coming</span>`;
      if (value === false) return `<span class="invitation-card__plus">Plus one not coming</span>`;
      return `<span class="invitation-card__plus">Plus one pending</span>`;
    }
    const known = plusOnes.filter((plusOne) => responseValue(responses, plusOne.id) !== null);
    if (!known.length) {
      return `<span class="invitation-card__plus">${plusOnes.length} plus ones pending</span>`;
    }
    const coming = plusOnes.filter((plusOne) => responseValue(responses, plusOne.id) === true).length;
    const pending = plusOnes.length - known.length;
    if (pending) {
      return `<span class="invitation-card__plus">${coming} coming · ${pending} pending</span>`;
    }
    return `<span class="invitation-card__plus">${coming} of ${plusOnes.length} plus ones coming</span>`;
  };

  const renderWeddingParty = (data) => {
    if (!partySection || !partyCards) return;
    const weddingParty = data?.wedding_party;
    if (!weddingParty) {
      partySection.hidden = true;
      partyCards.innerHTML = "";
      return;
    }

    const responses = data?.rsvp?.guest_responses || {};
    const keepMember = (member) => !isDeclined(member.id, responses);
    const bridesmaids = (weddingParty.bridesmaids?.members || []).filter(keepMember);
    const groomsmen = (weddingParty.groomsmen?.members || []).filter(keepMember);
    const cards = [];

    if (bridesmaids.length) cards.push(partyCard(bridesmaids, weddingParty.bridesmaids.brief, "bride"));
    if (groomsmen.length) cards.push(partyCard(groomsmen, weddingParty.groomsmen.brief, "groom"));

    if (!cards.length) {
      partySection.hidden = true;
      partyCards.innerHTML = "";
      return;
    }

    partySection.hidden = false;
    partyCards.innerHTML = cards.join("");
  };

  const guestInviteLabel = (guest = {}) => {
    const nickname = (guest.name || "").trim();
    const legalName = (guest.legal_name || "").trim();
    if (nickname && legalName && legalName.toLowerCase() !== nickname.toLowerCase()) {
      return `${legalName} (${nickname})`;
    }
    return legalName || nickname;
  };

  const guestInviteMarkup = (guest = {}) => {
    const nickname = (guest.name || "").trim();
    const legalName = (guest.legal_name || "").trim();
    if (nickname && legalName && legalName.toLowerCase() !== nickname.toLowerCase()) {
      return `${escapeHtml(legalName)} <span class="invitation-card__nick">(${escapeHtml(nickname)})</span>`;
    }
    return escapeHtml(legalName || nickname);
  };

  const guestRoleMarkup = (guest = {}) => {
    const role = guestRoleLabel(guest.guest_type);
    return role ? `<span class="invitation-card__role">${escapeHtml(role)}</span>` : "";
  };

  const plusOnesLabel = (count) => {
    if (count === 1) return "Plus one";
    if (count > 1) return `Plus ${count}`;
    return "";
  };

  const guestInviteRow = (guest = {}, guests = []) => {
    const plusCount = guests.filter((plusOne) => plusOne.plus_one_of === guest.id).length;
    const plusLabel = plusOnesLabel(plusCount);
    const meta = [
      guestRoleMarkup(guest),
      plusLabel ? `<span class="invitation-card__plus">${escapeHtml(plusLabel)}</span>` : ""
    ].filter(Boolean).join("");
    return `
      <span class="invitation-card__guest">
        <span class="invitation-card__guest-name">${guestInviteMarkup(guest)}</span>
        ${meta ? `<span class="invitation-card__meta">${meta}</span>` : ""}
      </span>`;
  };

  const guestFormLegend = (guest = {}) => {
    const role = guestRoleLabel(guest.guest_type);
    const name = escapeHtml(guestInviteLabel(guest));
    return role ? `${name} <span class="rsvp-person__aka">${escapeHtml(role)}</span>` : name;
  };

  const renderInvitationPeople = (data) => {
    const namesTarget = invitationSection?.querySelector("[data-invite-names]");
    const heading = invitationSection?.querySelector("[data-invite-heading]");
    if (!namesTarget) return;

    if (data.rsvp) {
      namesTarget.hidden = true;
      namesTarget.innerHTML = "";
      const namedGuests = data.guests.filter((guest) => !guest.is_plus_one);
      const pending = hasPendingGuests(namedGuests, data.rsvp.guest_responses || {});
      if (heading) heading.textContent = pending ? "Your invitation replies" : "Thanks for your reply";
      return;
    }

    const namedGuests = data.guests.filter((guest) => !guest.is_plus_one);
    const label = data.party?.label?.trim();
    if (heading) heading.textContent = label ? `You’re invited, ${label}` : "You’re invited";
    namesTarget.hidden = false;
    namesTarget.innerHTML = `
      <ul class="invitation-card__guests">
        ${namedGuests.map((guest) => `<li>${guestInviteRow(guest, data.guests)}</li>`).join("")}
      </ul>
    `;
  };

  const renderSummary = (data) => {
    if (!rsvpSummary || !openRsvpButton) return;
    const { rsvp, guests } = data;
    const deadline = invitationSection?.querySelector(".invitation-card__deadline");
    const heroRsvp = document.querySelector("[data-hero-rsvp]");
    const namedGuests = guests.filter((guest) => !guest.is_plus_one);
    const responses = rsvp?.guest_responses || {};
    const pending = Boolean(rsvp && hasPendingGuests(namedGuests, responses));
    const anyoneComing = Boolean(
      rsvp && guests.some((guest) => responseValue(responses, guest.id) === true)
    );

    if (deadline) {
      deadline.hidden = Boolean(rsvp) && !pending;
      if (pending) {
        deadline.innerHTML = `Some replies are still pending. Please finish by <strong>1 January 2027</strong>.`;
      } else if (!rsvp) {
        deadline.innerHTML = `Please RSVP by <strong>1 January 2027</strong>.`;
      }
    }

    renderInvitationPeople(data);

    if (!rsvp) {
      rsvpSummary.innerHTML = "";
      openRsvpButton.textContent = "Reply";
      openRsvpButton.className = "btn btn--primary";
      openRsvpButton.hidden = !data.rsvp_open;
      if (inviteCalendar) inviteCalendar.hidden = true;
      if (heroRsvp) heroRsvp.textContent = "Kindly RSVP";
      renderWeddingParty(data);
      return;
    }

    const attendance = namedGuests.map((guest) => {
      const plusOnes = guests.filter((plusOne) => plusOne.plus_one_of === guest.id);
      const plusNote = plusAttendanceNote(plusOnes, responses);
      const meta = [guestRoleMarkup(guest), plusNote].filter(Boolean).join("");
      const status = attendanceLabel(responses, guest.id);
      return `
        <li>
          <span class="invitation-card__guest">
            <span class="invitation-card__guest-name">${guestInviteMarkup(guest)}</span>
            ${meta ? `<span class="invitation-card__meta">${meta}</span>` : ""}
          </span>
          <strong>${status}</strong>
        </li>`;
    }).join("");

    rsvpSummary.innerHTML = `
      <div class="rsvp-confirmation rsvp-confirmation--inline">
        <ul class="rsvp-summary">${attendance}</ul>
        <dl class="rsvp-summary__details">
          <div><dt>Staying overnight</dt><dd>${escapeHtml(cabinSummaryLabel(rsvp, guests))}</dd></div>
          <div><dt>Contact email</dt><dd>${escapeHtml(rsvp.contact_email)}</dd></div>
          ${rsvp.dietary_notes ? `<div><dt>Dietary needs or allergies</dt><dd>${escapeHtml(rsvp.dietary_notes)}</dd></div>` : ""}
          ${rsvp.note ? `<div><dt>Your note</dt><dd>${escapeHtml(rsvp.note)}</dd></div>` : ""}
        </dl>
        ${pending ? `<p class="rsvp-pending-note">Anyone with this invite link can update answers, including replies still marked pending.</p>` : ""}
        ${data.rsvp_open ? "" : `<p class="rsvp-closed">RSVP is now closed. If you need to change your reply, please contact Keegan.</p>`}
      </div>`;

    if (pending) {
      openRsvpButton.textContent = "Finish RSVP";
      openRsvpButton.className = "btn btn--primary";
      if (heroRsvp) heroRsvp.textContent = "Finish RSVP";
    } else {
      openRsvpButton.textContent = "Edit RSVP";
      openRsvpButton.className = anyoneComing ? "btn btn--secondary" : "btn btn--primary";
      if (heroRsvp) heroRsvp.textContent = "Edit RSVP";
    }
    openRsvpButton.hidden = !data.rsvp_open;
    if (inviteCalendar) inviteCalendar.hidden = !anyoneComing;
    renderWeddingParty(data);
  };

  const renderForm = (data) => {
    if (!rsvpApp) return;
    if (!data.rsvp_open) {
      renderSummary(data);
      closeRsvpDialog();
      return;
    }
    const saved = data.rsvp || {};
    const savedCabinIds = cabinGuestSet(saved);
    const savedResponse = (guestId) => {
      const value = saved.guest_responses?.[guestId] ?? saved.guest_responses?.[String(guestId)];
      if (value === true || value === "true") return true;
      if (value === false || value === "false") return false;
      return null;
    };
    const namedGuests = data.guests.filter((guest) => !guest.is_plus_one);
    const pendingCount = namedGuests.filter((guest) => savedResponse(guest.id) === null).length;
    const guests = namedGuests.map((guest) => {
      const attending = savedResponse(guest.id);
      const plusOnes = data.guests.filter((plusOne) => plusOne.plus_one_of === guest.id);
      const plusComing = plusOnes.filter((plusOne) => savedResponse(plusOne.id) === true).length;
      const plusKnown = plusOnes.some((plusOne) => savedResponse(plusOne.id) !== null);
      const plusField = plusOnes.length ? `
        <fieldset class="rsvp-plus" data-plus-field="${guest.id}" ${attending === true ? "" : "hidden"}>
          <legend>Plus ones coming</legend>
          ${Array.from({ length: plusOnes.length + 1 }, (_, count) => `
            <label><input type="radio" name="plus-${guest.id}" value="${count}" ${plusKnown && plusComing === count ? "checked" : ""} ${attending === true ? "required" : ""} /> ${count}</label>
          `).join("")}
        </fieldset>` : "";
      return `
        <fieldset class="rsvp-person" data-guest-block="${guest.id}">
          <legend>${guestFormLegend(guest)}</legend>
          <label><input type="radio" name="guest-${guest.id}" value="true" data-guest-attendance="${guest.id}" ${attending === true ? "checked" : ""} /> Coming</label>
          <label><input type="radio" name="guest-${guest.id}" value="false" data-guest-attendance="${guest.id}" ${attending === false ? "checked" : ""} /> Not coming</label>
          <label><input type="radio" name="guest-${guest.id}" value="pending" data-guest-attendance="${guest.id}" ${attending === null ? "checked" : ""} /> Still deciding</label>
          ${plusField}
        </fieldset>`;
    }).join("");

    const cabinPeople = namedGuests.map((guest) => {
      const plusOnes = data.guests.filter((plusOne) => plusOne.plus_one_of === guest.id);
      const attending = savedResponse(guest.id) === true;
      const plusComing = plusOnes.filter((plusOne) => savedResponse(plusOne.id) === true).length;
      const cabinChecked = saved.cabin_requested
        ? savedCabinIds.has(String(guest.id))
        : attending;
      const plusNote = plusOnes.length
        ? `<span class="rsvp-cabin-people__note" data-cabin-plus-note="${guest.id}">${plusComing ? `Includes ${plusComing} plus one${plusComing === 1 ? "" : "s"} in the same room` : "Plus ones marked coming will share this room"}</span>`
        : "";
      return `
        <label class="rsvp-cabin-people__item" data-cabin-person="${guest.id}" ${attending ? "" : "hidden"}>
          <input type="checkbox" name="cabin_guest" value="${guest.id}" ${attending && cabinChecked ? "checked" : ""} />
          <span>
            <span class="rsvp-cabin-people__name">${guestInviteMarkup(guest)}</span>
            ${plusNote}
          </span>
        </label>`;
    }).join("");

    rsvpApp.innerHTML = `
      <form class="rsvp-form" data-rsvp-form>
        <p class="section__eyebrow section__eyebrow--caps">Your RSVP</p>
        <h3 class="section__title" id="rsvp-dialog-title">Will you be there?</h3>
        <p class="rsvp-form__intro">
          Reply for anyone you can now. Others can stay as still deciding, and anyone with this invite link can update the answers later.
          Please finish by <strong>1 January 2027</strong>.
        </p>
        ${pendingCount && saved.submitted_at ? `<p class="rsvp-form__aside">${pendingCount} ${pendingCount === 1 ? "guest is" : "guests are"} still deciding on this invitation.</p>` : ""}
        <div class="rsvp-people">${guests}</div>
        <fieldset class="rsvp-choice" data-cabin-choice>
          <legend>
            Would you like to stay overnight?
            <span class="info-tip">
              <button class="info-tip__button" type="button" aria-describedby="rsvp-cabin-tip" aria-expanded="false" data-info-tip>
                <span class="visually-hidden">More about cabin rooms</span>
                <span aria-hidden="true">i</span>
              </button>
              <span class="info-tip__panel" id="rsvp-cabin-tip" role="tooltip" hidden>
                One cabin room per invitation. Same family shares the room. Rooms have 6 to 8 single bunks (about 3 to 4 bunk beds). Beds are camping mattresses only, so please bring blankets and pillows. Be packed by 10:00 am the next morning.
              </span>
            </span>
          </legend>
          <p>One cabin room for this invitation. People on the same invitation share that room.</p>
          <label><input type="radio" name="cabin_requested" value="true" data-cabin-requested ${saved.cabin_requested ? "checked" : ""} /> Yes, please reserve a cabin room</label>
          <label><input type="radio" name="cabin_requested" value="false" data-cabin-requested ${saved.cabin_requested === false ? "checked" : ""} /> No, we are day guests only</label>
          <fieldset class="rsvp-cabin-people" data-cabin-people ${saved.cabin_requested ? "" : "hidden"}>
            <legend>Who is staying overnight?</legend>
            <p>Choose the people staying in this family room. You can change this later in Edit RSVP, or contact Keegan.</p>
            <div data-cabin-people-list>${cabinPeople}</div>
            <p class="rsvp-cabin-people__capacity" data-cabin-capacity hidden></p>
          </fieldset>
        </fieldset>
        <label class="form-field">Contact email<input name="contact_email" type="email" autocomplete="email" value="${escapeHtml(saved.contact_email || "")}" required /></label>
        <label class="form-field">Dietary needs or allergies <span>Optional</span><textarea name="dietary_notes" rows="3">${escapeHtml(saved.dietary_notes || "")}</textarea></label>
        <label class="form-field">Note for Suzie and Keegan <span>Optional</span><textarea name="note" rows="3">${escapeHtml(saved.note || "")}</textarea></label>
        <p class="rsvp-form__aside">Saving updates the whole invitation. Later replies can change earlier answers.</p>
        <p class="form-status" aria-live="polite"></p>
        <button class="btn btn--primary" type="submit">Save RSVP</button>
      </form>`;

    const form = rsvpApp.querySelector("[data-rsvp-form]");
    const cabinPeopleField = form.querySelector("[data-cabin-people]");
    const cabinCapacity = form.querySelector("[data-cabin-capacity]");

    if (saved.cabin_requested) {
      const comingNamed = namedGuests.filter((guest) => savedResponse(guest.id) === true);
      const allComingSelected = comingNamed.length > 0
        && comingNamed.every((guest) => savedCabinIds.has(String(guest.id)));
      if (!allComingSelected) form.dataset.cabinCustomized = "1";
    }

    const comingGuestIds = () => namedGuests
      .filter((guest) => form.querySelector(`input[name="guest-${guest.id}"]:checked`)?.value === "true")
      .map((guest) => guest.id);

    const plusComingCount = (guestId) => {
      const plusOnes = data.guests.filter((plusOne) => plusOne.plus_one_of === guestId);
      if (!plusOnes.length) return 0;
      return Math.max(0, Math.min(plusOnes.length, Number(form.querySelector(`input[name="plus-${guestId}"]:checked`)?.value || 0)));
    };

    const syncPlusFields = () => {
      namedGuests.forEach((guest) => {
        const attendance = form.querySelector(`input[name="guest-${guest.id}"]:checked`)?.value;
        const plusField = form.querySelector(`[data-plus-field="${guest.id}"]`);
        if (!plusField) return;
        const show = attendance === "true";
        plusField.hidden = !show;
        plusField.querySelectorAll("input").forEach((input) => {
          input.required = show;
          if (!show) input.checked = false;
        });
      });
    };

    const syncCabinPeople = () => {
      const cabinYes = form.querySelector('input[name="cabin_requested"]:checked')?.value === "true";
      const comingIds = new Set(comingGuestIds().map(String));
      const autoFill = form.dataset.cabinAuto === "1" && form.dataset.cabinCustomized !== "1";
      if (cabinPeopleField) cabinPeopleField.hidden = !cabinYes;
      form.querySelectorAll("[data-cabin-person]").forEach((row) => {
        const guestId = row.getAttribute("data-cabin-person");
        const isComing = comingIds.has(String(guestId));
        row.hidden = !isComing;
        const checkbox = row.querySelector('input[type="checkbox"]');
        if (!checkbox) return;
        if (!isComing) {
          checkbox.checked = false;
        } else if (cabinYes && autoFill) {
          checkbox.checked = true;
        }
        const plusNote = row.querySelector(`[data-cabin-plus-note="${guestId}"]`);
        if (plusNote) {
          const count = plusComingCount(guestId);
          plusNote.textContent = count
            ? `Includes ${count} plus one${count === 1 ? "" : "s"} in the same room`
            : "Plus ones marked coming will share this room";
        }
      });

      if (!cabinCapacity) return;
      if (!cabinYes) {
        cabinCapacity.hidden = true;
        return;
      }
      let overnight = 0;
      form.querySelectorAll('input[name="cabin_guest"]:checked').forEach((input) => {
        overnight += 1 + plusComingCount(input.value);
      });
      if (overnight > 8) {
        cabinCapacity.hidden = false;
        cabinCapacity.textContent = `Rooms sleep about 6 to 8 people. You have selected ${overnight}. Please contact Keegan if you need help.`;
      } else if (overnight > 0) {
        cabinCapacity.hidden = false;
        cabinCapacity.textContent = `${overnight} ${overnight === 1 ? "person" : "people"} selected for this family room (rooms sleep about 6 to 8).`;
      } else {
        cabinCapacity.hidden = true;
      }
    };

    const syncCabinAvailability = () => {
      const coming = comingGuestIds().length > 0;
      const cabinChoice = form.querySelector("[data-cabin-choice]");
      if (cabinChoice) cabinChoice.hidden = !coming;
      if (!coming) {
        form.querySelectorAll('input[name="cabin_requested"]').forEach((input) => {
          input.checked = false;
        });
        form.dataset.cabinAuto = "";
      }
      syncCabinPeople();
    };

    form.querySelectorAll("[data-guest-attendance]").forEach((input) => {
      input.addEventListener("change", () => {
        if (
          input.value === "true"
          && form.querySelector('input[name="cabin_requested"]:checked')?.value === "true"
          && form.dataset.cabinCustomized !== "1"
        ) {
          form.dataset.cabinAuto = "1";
        }
        syncPlusFields();
        syncCabinAvailability();
      });
    });
    form.querySelectorAll("[data-plus-field] input").forEach((input) => {
      input.addEventListener("change", syncCabinPeople);
    });
    form.querySelectorAll("[data-cabin-requested]").forEach((input) => {
      input.addEventListener("change", () => {
        if (input.value === "true" && input.checked) {
          form.dataset.cabinAuto = "1";
          form.dataset.cabinCustomized = "";
        } else {
          form.dataset.cabinAuto = "";
        }
        syncCabinPeople();
      });
    });
    form.querySelectorAll('input[name="cabin_guest"]').forEach((input) => {
      input.addEventListener("change", () => {
        form.dataset.cabinCustomized = "1";
        form.dataset.cabinAuto = "";
        syncCabinPeople();
      });
    });

    syncPlusFields();
    syncCabinAvailability();

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const submit = form.querySelector('[type="submit"]');
      const status = form.querySelector(".form-status");
      const formData = new FormData(form);
      const guestResponses = {};
      namedGuests.forEach((guest) => {
        const answer = formData.get(`guest-${guest.id}`);
        if (answer !== "true" && answer !== "false") return;
        guestResponses[guest.id] = answer;
        const plusOnes = data.guests.filter((plusOne) => plusOne.plus_one_of === guest.id);
        if (answer === "false") {
          plusOnes.forEach((plusOne) => {
            guestResponses[plusOne.id] = "false";
          });
          return;
        }
        if (!plusOnes.length) return;
        const coming = Math.max(0, Math.min(plusOnes.length, Number(formData.get(`plus-${guest.id}`)) || 0));
        plusOnes.forEach((plusOne, index) => {
          guestResponses[plusOne.id] = index < coming ? "true" : "false";
        });
      });

      if (!Object.keys(guestResponses).length) {
        status.textContent = "Please reply for at least one guest before saving.";
        return;
      }

      const cabinRequested = formData.get("cabin_requested") === "true";
      const cabinGuestIds = formData.getAll("cabin_guest").map(String);
      if (cabinRequested && !Object.values(guestResponses).includes("true")) {
        status.textContent = "A cabin can only be requested when someone is coming.";
        return;
      }
      if (cabinRequested && !cabinGuestIds.length) {
        status.textContent = "Please choose who is staying overnight.";
        return;
      }
      if (!cabinRequested && comingGuestIds().length && formData.get("cabin_requested") !== "false") {
        status.textContent = "Please say whether you would like a cabin room.";
        return;
      }

      submit.disabled = true;
      status.textContent = "Saving your RSVP…";
      try {
        const updated = await rpc("submit_wedding_rsvp", {
          p_invite_code: inviteCode,
          p_contact_email: formData.get("contact_email"),
          p_cabin_requested: cabinRequested,
          p_dietary_notes: formData.get("dietary_notes"),
          p_note: formData.get("note"),
          p_guest_responses: guestResponses,
          p_cabin_guest_ids: cabinGuestIds
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

  const inviteLoading = document.querySelector("[data-invite-loading]");
  const inviteCard = document.querySelector("[data-invite-card]");

  const publicNav = document.querySelector("[data-public-nav]");
  const inviteNav = document.querySelector("[data-invite-nav]");
  const heroCalendar = document.querySelector("[data-hero-calendar]");
  const publicCtas = document.querySelectorAll("[data-public-cta]");
  const heroRsvpLink = document.querySelector("[data-hero-rsvp]");

  const applyInviteChrome = () => {
    if (publicNav) publicNav.hidden = true;
    if (inviteNav) inviteNav.hidden = false;
    publicCtas.forEach((cta) => { cta.hidden = true; });
    if (heroRsvpLink) heroRsvpLink.hidden = false;
    if (heroCalendar) heroCalendar.className = "btn btn--ghost";
    if (publicRsvp) publicRsvp.hidden = true;
    if (welcomeSection) welcomeSection.hidden = true;
  };

  const clearInviteChrome = () => {
    if (publicNav) publicNav.hidden = false;
    if (inviteNav) inviteNav.hidden = true;
    publicCtas.forEach((cta) => { cta.hidden = false; });
    if (heroRsvpLink) heroRsvpLink.hidden = true;
    if (heroCalendar) heroCalendar.className = "btn btn--ghost";
    if (publicRsvp) publicRsvp.hidden = false;
    if (welcomeSection) welcomeSection.hidden = false;
  };

  const showInviteLoading = () => {
    if (!invitationSection) return;
    document.documentElement.classList.add("has-invite");
    document.documentElement.classList.remove("invite-ready");
    applyInviteChrome();
    invitationSection.hidden = false;
    invitationSection.classList.add("is-loading");
    invitationSection.classList.remove("is-ready");
    if (inviteLoading) inviteLoading.hidden = false;
    if (inviteCard) inviteCard.hidden = true;
  };

  const showInviteReady = () => {
    if (!invitationSection) return;
    document.documentElement.classList.add("has-invite", "invite-ready");
    applyInviteChrome();
    invitationSection.classList.remove("is-loading");
    invitationSection.classList.add("is-ready");
    if (inviteLoading) inviteLoading.hidden = true;
    if (inviteCard) inviteCard.hidden = false;
  };

  const clearInviteLoading = () => {
    document.documentElement.classList.remove("has-invite", "invite-ready");
    clearInviteChrome();
    if (invitationSection) {
      invitationSection.hidden = true;
      invitationSection.classList.remove("is-loading", "is-ready");
    }
    if (inviteLoading) inviteLoading.hidden = true;
    if (inviteCard) inviteCard.hidden = true;
  };

  const loadInvitation = async () => {
    if (!inviteCode) return;
    showInviteLoading();
    try {
      const data = await rpc("guest_invite", { p_invite_code: inviteCode });
      if (!data?.party || !invitationSection) {
        clearInviteLoading();
        return;
      }
      inviteData = data;
      document.querySelectorAll('a[data-hero-rsvp], a[data-stay-rsvp]').forEach((link) => {
        link.setAttribute("href", "#your-invitation");
      });
      const stayRsvp = document.querySelector("[data-stay-rsvp]");
      if (stayRsvp) {
        stayRsvp.textContent = "Request a cabin in the RSVP";
        stayRsvp.className = "btn btn--primary";
      }
      renderSummary(data);
      showInviteReady();
    } catch (error) {
      if (invitationSection) {
        showInviteReady();
        const heading = invitationSection.querySelector("[data-invite-heading]");
        if (heading) heading.textContent = "Invitation unavailable";
        const namesTarget = invitationSection.querySelector("[data-invite-names]");
        if (namesTarget) {
          namesTarget.hidden = false;
          namesTarget.innerHTML = `<p class="invitation-card__limit">We could not load this invitation. Please contact Keegan for help.</p>`;
        }
        if (rsvpSummary) rsvpSummary.innerHTML = "";
        if (openRsvpButton) openRsvpButton.hidden = true;
        if (inviteCalendar) inviteCalendar.hidden = true;
        const deadline = invitationSection.querySelector(".invitation-card__deadline");
        if (deadline) deadline.hidden = true;
      } else {
        clearInviteLoading();
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

  const closeInfoTips = ({ except } = {}) => {
    document.querySelectorAll("[data-info-tip]").forEach((button) => {
      if (button === except) return;
      button.setAttribute("aria-expanded", "false");
      const panel = button.parentElement?.querySelector(".info-tip__panel");
      if (panel) panel.hidden = true;
    });
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-info-tip]");
    if (button) {
      event.preventDefault();
      const panel = button.parentElement?.querySelector(".info-tip__panel");
      const open = button.getAttribute("aria-expanded") === "true";
      closeInfoTips({ except: button });
      button.setAttribute("aria-expanded", open ? "false" : "true");
      if (panel) panel.hidden = open;
      return;
    }
    if (!event.target.closest(".info-tip")) closeInfoTips();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeInfoTips();
  });

  loadInvitation();
})();
