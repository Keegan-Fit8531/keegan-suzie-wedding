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

  const inviteUrl = (code) => `${window.location.origin}${window.location.pathname.replace(/host\.html$/, "index.html")}?invite=${code}`;

  const guestTypeLabel = (type) => {
    if (type === "bridesmaid") return "Bridesmaid";
    if (type === "groomsman") return "Groomsman";
    return "Guest";
  };

  const guestField = (guest = {}) => {
    const id = `guest-type-${guestFieldId++}`;
    const type = guest.guest_type || "guest";
    return `
    <div class="guest-editor__row">
      <input data-guest-name value="${escapeHtml(guest.name || "")}" placeholder="Guest name" required />
      <fieldset class="guest-type" aria-label="Guest type">
        <label><input type="radio" name="${id}" data-guest-type value="guest" ${type === "guest" ? "checked" : ""} /> Guest</label>
        <label><input type="radio" name="${id}" data-guest-type value="groomsman" ${type === "groomsman" ? "checked" : ""} /> Groomsman</label>
        <label><input type="radio" name="${id}" data-guest-type value="bridesmaid" ${type === "bridesmaid" ? "checked" : ""} /> Bridesmaid</label>
      </fieldset>
      <button type="button" class="guest-editor__remove" data-remove-guest aria-label="Remove guest">×</button>
    </div>`;
  };

  const render = () => {
    const parties = dashboard.parties || [];
    const invited = parties.reduce((total, party) => total + party.guests.length, 0);
    let coming = 0;
    let declined = 0;
    let pending = 0;
    let cabins = 0;
    parties.forEach((party) => {
      if (party.rsvp?.cabin_requested) cabins += 1;
      party.guests.forEach((guest) => {
        const response = party.rsvp?.guest_responses?.[guest.id];
        if (response === true) coming += 1;
        else if (response === false) declined += 1;
        else pending += 1;
      });
    });
    stats.innerHTML = [
      ["Invited", invited], ["Coming", coming], ["Not coming", declined],
      ["Pending", pending], ["Cabins requested", cabins]
    ].map(([label, value]) => `<article><strong>${value}</strong><span>${label}</span></article>`).join("");

    partyList.innerHTML = parties.length ? parties.map((party) => {
      const rsvp = party.rsvp;
      const guests = party.guests.map((guest) => {
        const response = rsvp?.guest_responses?.[guest.id];
        const text = response === true ? "Coming" : response === false ? "Not coming" : "Pending";
        const type = guest.guest_type && guest.guest_type !== "guest" ? ` <small>${escapeHtml(guestTypeLabel(guest.guest_type))}</small>` : "";
        return `<li><span>${escapeHtml(guest.name)}${type}</span><strong class="status status--${text.toLowerCase().replace(" ", "-")}">${text}</strong></li>`;
      }).join("");
      return `<article class="host-party-card">
        <div class="host-party-card__top"><div><h2>${escapeHtml(party.label)}</h2><p>${rsvp ? `RSVP received ${new Date(rsvp.submitted_at).toLocaleDateString("en-NZ")}` : "No RSVP yet"}</p></div>
        <div class="host-party-card__actions"><button type="button" class="text-link" data-copy="${escapeHtml(party.invite_code)}">Copy link</button><button type="button" class="text-link" data-edit="${party.id}">Edit</button><button type="button" class="text-link text-link--danger" data-delete="${party.id}">Delete</button></div></div>
        <ul class="host-guest-list">${guests}</ul>
        ${rsvp ? `<div class="host-rsvp-details"><p><strong>Cabin:</strong> ${rsvp.cabin_requested ? "Requested" : "No"}</p><p><strong>Email:</strong> ${escapeHtml(rsvp.contact_email)}</p>${rsvp.dietary_notes ? `<p><strong>Dietary:</strong> ${escapeHtml(rsvp.dietary_notes)}</p>` : ""}${rsvp.note ? `<p><strong>Note:</strong> ${escapeHtml(rsvp.note)}</p>` : ""}</div>` : ""}
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
      setTimeout(() => { button.textContent = "Copy link"; }, 1500);
    }));
    partyList.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => openParty(button.dataset.edit)));
    partyList.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", async () => {
      const party = dashboard.parties.find((item) => item.id === button.dataset.delete);
      if (!window.confirm(`Delete ${party.label} and their RSVP?`)) return;
      dashboard = await rpc("host_delete_party", { p_pin: pin, p_party_id: party.id });
      render();
    }));
    briefList.querySelectorAll("[data-edit-brief]").forEach((button) => button.addEventListener("click", () => openBrief(button.dataset.editBrief)));
  };

  const openParty = (id) => {
    const party = id ? dashboard.parties.find((item) => item.id === id) : null;
    partyForm.reset();
    partyForm.querySelector("[name=id]").value = party?.id || "";
    partyForm.querySelector("[name=label]").value = party?.label || "";
    partyForm.querySelector("[data-party-form-title]").textContent = party ? `Edit ${party.label}` : "New invitation";
    partyForm.querySelector("[data-guest-fields]").innerHTML = (party?.guests?.length ? party.guests : [{}]).map(guestField).join("");
    partyDialog.showModal();
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
  document.querySelector("[data-close-brief]").addEventListener("click", () => briefDialog.close());
  document.querySelector("[data-cancel-brief]").addEventListener("click", () => briefDialog.close());
  partyForm.querySelector("[data-add-guest]").addEventListener("click", () => {
    partyForm.querySelector("[data-guest-fields]").insertAdjacentHTML("beforeend", guestField());
  });
  partyForm.querySelector("[data-guest-fields]").addEventListener("click", (event) => {
    if (event.target.matches("[data-remove-guest]") && partyForm.querySelectorAll(".guest-editor__row").length > 1) {
      event.target.closest(".guest-editor__row").remove();
    }
  });

  partyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(partyForm);
    const guests = [...partyForm.querySelectorAll(".guest-editor__row")].map((row, sort_order) => ({
      name: row.querySelector("[data-guest-name]").value.trim(),
      guest_type: row.querySelector("[data-guest-type]:checked")?.value || "guest",
      sort_order
    })).filter((guest) => guest.name);
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
