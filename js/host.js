(() => {
  const SUPABASE_URL = "https://fwtkgtokyurntzzsqgwc.supabase.co";
  const SUPABASE_KEY = "sb_publishable_HZ9IEPcCW_2MjD-i5dVILA_1r-_w5FX";
  const login = document.querySelector("[data-host-login]");
  const app = document.querySelector("[data-host-app]");
  const pinForm = document.querySelector("[data-pin-form]");
  const partyDialog = document.querySelector("[data-party-dialog]");
  const briefDialog = document.querySelector("[data-brief-dialog]");
  const partyForm = document.querySelector("[data-party-form]");
  const briefForm = document.querySelector("[data-brief-form]");
  const partyList = document.querySelector("[data-party-list]");
  const stats = document.querySelector("[data-host-stats]");
  const briefList = document.querySelector("[data-brief-list]");
  let pin = sessionStorage.getItem("wedding-host-pin") || "";
  let dashboard;
  let guestFieldId = 0;

  const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));

  const rpc = async (name, params) => {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.error || "Something went wrong.");
    return body;
  };

  const inviteUrl = (code) => {
    const path = window.location.pathname.replace(/host\.html$/, "").replace(/\/?$/, "/");
    return `${window.location.origin}${path}?invite=${encodeURIComponent(code)}`;
  };

  const guestTypeLabel = (type) => {
    if (type === "maid_of_honor") return "Maid of Honor";
    if (type === "bridesmaid") return "Bridesmaid";
    if (type === "best_man") return "Best Man";
    if (type === "groomsman") return "Groomsman";
    if (type === "infant") return "Infant (0–3)";
    if (type === "child") return "Child (4–13)";
    return "Guest";
  };

  const guestDisplayName = (guest = {}) => {
    const nickname = (guest.name || "").trim();
    const legalName = (guest.legal_name || "").trim();
    if (nickname && legalName && legalName.toLowerCase() !== nickname.toLowerCase()) {
      return `${legalName} (${nickname})`;
    }
    return legalName || nickname;
  };

  const roleAvailability = (currentType = "guest") => {
    const taken = dashboard?.roles_taken || {};
    return {
      maid_of_honor: currentType === "maid_of_honor" || !taken.maid_of_honor,
      best_man: currentType === "best_man" || !taken.best_man
    };
  };

  const guestField = (guest = {}) => {
    const id = `guest-type-${guestFieldId++}`;
    const type = guest.guest_type || "guest";
    const plusCount = guest.plus_ones?.length || 0;
    const nickname = (guest.name || "").trim();
    const legalName = (guest.legal_name || "").trim();
    const realNameValue = legalName || (!legalName && nickname ? nickname : "");
    const nicknameValue = legalName && nickname && legalName.toLowerCase() !== nickname.toLowerCase()
      ? nickname
      : "";
    const roles = roleAvailability(type);
    return `
    <article class="guest-editor__block">
      <input type="hidden" data-guest-id value="${escapeHtml(guest.id || "")}" />
      <div class="guest-editor__header">
        <p class="guest-editor__eyebrow">Guest</p>
        <button type="button" class="guest-editor__remove" data-remove-guest aria-label="Remove guest">Remove</button>
      </div>
      <div class="guest-editor__names">
        <label class="form-field">
          <span class="form-field__heading">Real name</span>
          <input data-guest-legal-name value="${escapeHtml(realNameValue)}" placeholder="e.g. Mike Fitzgerald" required />
        </label>
        <label class="form-field">
          <span class="form-field__heading">Nickname <span>Optional</span></span>
          <input data-guest-name value="${escapeHtml(nicknameValue)}" placeholder="e.g. Grandad" />
        </label>
      </div>
      <div class="guest-editor__meta">
        <fieldset class="guest-type">
          <legend>Type</legend>
          <label><input type="radio" name="${id}" data-guest-type value="guest" ${type === "guest" ? "checked" : ""} /> Guest</label>
          <label><input type="radio" name="${id}" data-guest-type value="infant" ${type === "infant" ? "checked" : ""} /> Infant (0–3)</label>
          <label><input type="radio" name="${id}" data-guest-type value="child" ${type === "child" ? "checked" : ""} /> Child (4–13)</label>
          <label><input type="radio" name="${id}" data-guest-type value="groomsman" ${type === "groomsman" ? "checked" : ""} /> Groomsman</label>
          ${roles.best_man ? `<label><input type="radio" name="${id}" data-guest-type value="best_man" ${type === "best_man" ? "checked" : ""} /> Best Man</label>` : ""}
          <label><input type="radio" name="${id}" data-guest-type value="bridesmaid" ${type === "bridesmaid" ? "checked" : ""} /> Bridesmaid</label>
          ${roles.maid_of_honor ? `<label><input type="radio" name="${id}" data-guest-type value="maid_of_honor" ${type === "maid_of_honor" ? "checked" : ""} /> Maid of Honor</label>` : ""}
        </fieldset>
        <div class="plus-one-count">
          <span class="plus-one-count__label">Plus ones</span>
          <div class="plus-one-count__controls">
            <button type="button" data-plus-minus aria-label="Remove a plus one">−</button>
            <output data-plus-value>${plusCount}</output>
            <button type="button" data-plus-plus aria-label="Add a plus one">+</button>
          </div>
        </div>
      </div>
    </article>`;
  };

  const partyTitle = (party) => {
    if (party.label?.trim()) return party.label.trim();
    const names = party.guests.map((guest) => guestDisplayName(guest)).filter(Boolean);
    return names.join(", ") || "Untitled invitation";
  };

  const render = () => {
    const parties = dashboard.parties || [];
    const invited = parties.reduce((total, party) => total + party.guests.reduce((count, guest) => count + 1 + (guest.plus_ones?.length || 0), 0), 0);
    let coming = 0;
    let declined = 0;
    let pending = 0;
    let cabins = 0;
    const countResponse = (party, id) => {
      const response = party.rsvp?.guest_responses?.[id];
      if (response === true) coming += 1;
      else if (response === false) declined += 1;
      else pending += 1;
    };
    parties.forEach((party) => {
      if (party.rsvp?.cabin_requested) cabins += 1;
      party.guests.forEach((guest) => {
        countResponse(party, guest.id);
        (guest.plus_ones || []).forEach((plusOne) => countResponse(party, plusOne.id));
      });
    });
    stats.innerHTML = [
      ["Invited", invited], ["Coming", coming], ["Not coming", declined],
      ["Pending", pending], ["Cabins requested", cabins]
    ].map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join("");

    partyList.innerHTML = parties.length ? parties.map((party) => {
      const rsvp = party.rsvp;
      const guests = party.guests.flatMap((guest) => {
        const response = rsvp?.guest_responses?.[guest.id];
        const text = response === true ? "Coming" : response === false ? "Not coming" : "Pending";
        const type = guest.guest_type && guest.guest_type !== "guest" ? ` <small>${escapeHtml(guestTypeLabel(guest.guest_type))}</small>` : "";
        const rows = [`<li><span>${escapeHtml(guestDisplayName(guest))}${type}</span><strong class="status status--${text.toLowerCase().replace(" ", "-")}">${text}</strong></li>`];
        (guest.plus_ones || []).forEach((plusOne, index) => {
          const plusResponse = rsvp?.guest_responses?.[plusOne.id];
          const plusText = plusResponse === true ? "Coming" : plusResponse === false ? "Not coming" : "Pending";
          const plusLabel = (guest.plus_ones.length > 1) ? `Plus one ${index + 1}` : "Plus one";
          rows.push(`<li class="host-guest-list__plus"><span>${plusLabel}</span><strong class="status status--${plusText.toLowerCase().replace(" ", "-")}">${plusText}</strong></li>`);
        });
        return rows;
      }).join("");
      const rsvpNote = rsvp
        ? `<p class="host-rsvp-banner">RSVP submitted ${new Date(rsvp.submitted_at).toLocaleDateString("en-NZ", { day: "numeric", month: "short", year: "numeric" })}. Guests can still edit until 1 January 2027.</p>`
        : `<p class="host-rsvp-pending">No RSVP yet.</p>`;
      return `<article class="host-party-card">
        <div class="host-party-card__top"><div><h2>${escapeHtml(partyTitle(party))}</h2>${rsvpNote}</div>
        <div class="host-party-card__actions"><button type="button" class="text-link" data-copy="${escapeHtml(party.invite_code)}">Copy invite</button><button type="button" class="text-link" data-qr="${escapeHtml(party.invite_code)}" data-qr-name="${escapeHtml(partyTitle(party))}">Download QR</button><button type="button" class="text-link" data-edit="${party.id}">Edit</button><button type="button" class="text-link text-link--danger" data-delete="${party.id}">Delete</button></div></div>
        <ul class="host-guest-list">${guests}</ul>
        ${rsvp ? `<div class="host-rsvp-details"><p><strong>Cabin:</strong> ${rsvp.cabin_requested ? "Requested" : "No"}</p><p><strong>Email:</strong> ${escapeHtml(rsvp.contact_email)}</p>${rsvp.dietary_notes ? `<p><strong>Dietary:</strong> ${escapeHtml(rsvp.dietary_notes)}</p>` : ""}${rsvp.note ? `<p><strong>Note from guests:</strong> ${escapeHtml(rsvp.note)}</p>` : ""}</div>` : ""}
      </article>`;
    }).join("") : `<p class="host-empty">No invitations yet. Create your first household invitation.</p>`;

    briefList.innerHTML = ["bride", "groom"].map((side) => {
      const brief = dashboard.briefs?.[side] || {};
      return `<article class="brief-card"><p class="section__eyebrow section__eyebrow--caps">${side === "bride" ? "Bridesmaids" : "Groomsmen"}</p><h3>${escapeHtml(brief.title || "")}</h3><p>${escapeHtml(brief.body || "")}</p><button type="button" class="text-link" data-edit-brief="${side}">Edit brief</button></article>`;
    }).join("");
    bindActions();
  };

  const bindActions = () => {
    partyList.querySelectorAll("[data-copy]").forEach((button) => button.addEventListener("click", async () => {
      await navigator.clipboard.writeText(inviteUrl(button.dataset.copy));
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = "Copy invite"; }, 1500);
    }));
    partyList.querySelectorAll("[data-qr]").forEach((button) => button.addEventListener("click", async () => {
      const previous = button.textContent;
      button.textContent = "Preparing…";
      try {
        if (!window.QRCode?.toDataURL) throw new Error("QR library missing");
        const dataUrl = await window.QRCode.toDataURL(inviteUrl(button.dataset.qr), {
          margin: 2,
          width: 720,
          color: { dark: "#2f3b2c", light: "#fffaf3" }
        });
        const download = document.createElement("a");
        const slug = (button.dataset.qrName || "invite").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        download.href = dataUrl;
        download.download = `${slug || "invite"}-qr.png`;
        document.body.appendChild(download);
        download.click();
        download.remove();
        button.textContent = "Downloaded";
      } catch (error) {
        console.error(error);
        button.textContent = "QR unavailable";
      }
      setTimeout(() => { button.textContent = previous; }, 1500);
    }));
    partyList.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => openParty(button.dataset.edit)));
    partyList.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
      const party = dashboard.parties.find((item) => item.id === button.dataset.delete);
      if (!window.confirm(`Delete ${partyTitle(party)} and their RSVP?`)) return;
      dashboard = await rpc("host_delete_party", { p_pin: pin, p_party_id: party.id });
      render();
    }));
    briefList.querySelectorAll("[data-edit-brief]").forEach((button) => button.addEventListener("click", () => openBrief(button.dataset.editBrief)));
  };

  const syncExclusiveRoles = (changedInput) => {
    const exclusive = ["maid_of_honor", "best_man"];
    if (!exclusive.includes(changedInput.value) || !changedInput.checked) return;
    partyForm.querySelectorAll(`[data-guest-type][value="${changedInput.value}"]`).forEach((input) => {
      if (input === changedInput || !input.checked) return;
      const guestRadio = input.closest(".guest-type")?.querySelector('[data-guest-type][value="guest"]');
      if (guestRadio) guestRadio.checked = true;
    });
  };

  let storedRolesTaken = null;

  const openParty = (id) => {
    const party = id ? dashboard.parties.find((item) => item.id === id) : null;
    partyForm.reset();
    partyForm.querySelector("[name=id]").value = party?.id || "";
    partyForm.querySelector("[name=label]").value = party?.label || "";
    partyForm.querySelector("[data-party-form-title]").textContent = party ? `Edit ${partyTitle(party)}` : "New invitation";
    storedRolesTaken = dashboard.roles_taken;
    const partyOwns = (type) => Boolean(party?.guests?.some((guest) => guest.guest_type === type));
    dashboard.roles_taken = {
      maid_of_honor: Boolean(storedRolesTaken?.maid_of_honor) && !partyOwns("maid_of_honor"),
      best_man: Boolean(storedRolesTaken?.best_man) && !partyOwns("best_man")
    };
    const guests = party?.guests?.length ? party.guests : [{}];
    partyForm.querySelector("[data-guest-fields]").innerHTML = guests.map((guest) => guestField(guest)).join("");
    partyDialog.showModal();
  };

  const restoreRolesTaken = () => {
    if (storedRolesTaken && dashboard) dashboard.roles_taken = storedRolesTaken;
    storedRolesTaken = null;
  };

  const openBrief = (side) => {
    const brief = dashboard.briefs?.[side] || {};
    briefForm.querySelector("[name=side]").value = side;
    briefForm.querySelector("[name=title]").value = brief.title || "";
    briefForm.querySelector("[name=body]").value = brief.body || "";
    briefDialog.showModal();
  };

  const loadDashboard = async () => {
    dashboard = await rpc("host_dashboard", { p_pin: pin });
    login.hidden = true;
    app.hidden = false;
    render();
  };

  pinForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    pin = new FormData(pinForm).get("pin");
    const status = pinForm.querySelector(".form-status");
    status.textContent = "Opening dashboard…";
    try {
      await loadDashboard();
      sessionStorage.setItem("wedding-host-pin", pin);
    } catch (error) {
      status.textContent = "Incorrect PIN. Please try again.";
    }
  });

  document.querySelector("[data-new-party]").addEventListener("click", () => openParty());
  document.querySelector("[data-close-dialog]").addEventListener("click", () => partyDialog.close());
  document.querySelector("[data-cancel-dialog]").addEventListener("click", () => partyDialog.close());
  partyDialog.addEventListener("close", restoreRolesTaken);
  document.querySelector("[data-close-brief]").addEventListener("click", () => briefDialog.close());
  document.querySelector("[data-cancel-brief]").addEventListener("click", () => briefDialog.close());
  partyForm.querySelector("[data-add-guest]").addEventListener("click", () => {
    const selected = [...partyForm.querySelectorAll("[data-guest-type]:checked")].map((input) => input.value);
    const previous = dashboard.roles_taken;
    dashboard.roles_taken = {
      ...(previous || {}),
      maid_of_honor: Boolean(previous?.maid_of_honor) || selected.includes("maid_of_honor"),
      best_man: Boolean(previous?.best_man) || selected.includes("best_man")
    };
    try {
      partyForm.querySelector("[data-guest-fields]").insertAdjacentHTML("beforeend", guestField());
    } finally {
      dashboard.roles_taken = previous;
    }
  });
  partyForm.querySelector("[data-guest-fields]").addEventListener("click", (event) => {
    const output = event.target.closest(".plus-one-count")?.querySelector("[data-plus-value]");
    if (output && event.target.matches("[data-plus-plus]")) output.textContent = Math.min(10, Number(output.textContent) + 1);
    if (output && event.target.matches("[data-plus-minus]")) output.textContent = Math.max(0, Number(output.textContent) - 1);
    if (event.target.matches("[data-remove-guest]") && partyForm.querySelectorAll(".guest-editor__block").length > 1) {
      event.target.closest(".guest-editor__block").remove();
    }
  });
  partyForm.querySelector("[data-guest-fields]").addEventListener("change", (event) => {
    if (event.target.matches("[data-guest-type]")) syncExclusiveRoles(event.target);
  });

  partyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(partyForm);
    const guests = [...partyForm.querySelectorAll(".guest-editor__block")].map((block, sort_order) => {
      const realName = block.querySelector("[data-guest-legal-name]").value.trim();
      const nickname = block.querySelector("[data-guest-name]").value.trim();
      const hasDistinctNickname = Boolean(nickname && nickname.toLowerCase() !== realName.toLowerCase());
      return {
        id: block.querySelector("[data-guest-id]")?.value || "",
        name: hasDistinctNickname ? nickname : realName,
        legal_name: hasDistinctNickname ? realName : "",
        guest_type: block.querySelector("[data-guest-type]:checked")?.value || "guest",
        sort_order,
        plus_one_count: Number(block.querySelector("[data-plus-value]").textContent) || 0
      };
    }).filter((guest) => guest.name);
    const status = partyForm.querySelector(".form-status");
    if (!guests.length) {
      status.textContent = "Add at least one named guest.";
      return;
    }
    status.textContent = "Saving…";
    try {
      dashboard = await rpc("host_save_party", {
        p_pin: pin,
        p_payload: { id: data.get("id"), label: data.get("label"), guests }
      });
      storedRolesTaken = null;
      partyDialog.close();
      render();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  briefForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(briefForm);
    const status = briefForm.querySelector(".form-status");
    status.textContent = "Saving…";
    try {
      dashboard = await rpc("host_save_brief", {
        p_pin: pin,
        p_side: data.get("side"),
        p_title: data.get("title"),
        p_body: data.get("body")
      });
      briefDialog.close();
      render();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  if (pin) {
    loadDashboard().catch(() => {
      sessionStorage.removeItem("wedding-host-pin");
      pin = "";
    });
  }
})();
