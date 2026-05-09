const state = {
  rows: [],
  landlords: [],
  selectedLandlordId: "",
};

const STORAGE_KEY = "oneroom-pages-v1";
const PREFERRED_FIELDS = [
  "tenant_1_name",
  "tenant_1_email",
  "tenant_1_phone",
  "tenant_2_name",
  "tenant_2_email",
  "tenant_2_phone",
  "property_address",
  "room_name",
  "commencement_date",
  "end_date",
  "contract_period",
  "week_month",
  "rent_payment_day",
  "holding_deposit",
  "rent_expected",
  "payment_period",
  "comission_amount",
  "landlord_name",
  "landlord_address",
  "landlord_telephone_number",
  "landlord_email_address",
  "landlord_signature"
];

const dataFileInput = document.getElementById("data-file");
const tableWrap = document.getElementById("table-wrap");
const rowCountBadge = document.getElementById("row-count-badge");
const importSummary = document.getElementById("import-summary");
const previewRowSelect = document.getElementById("preview-row");
const rowPreview = document.getElementById("row-preview");
const landlordSelect = document.getElementById("landlord-select");
const toast = document.getElementById("toast");
const standardTemplateLink = document.getElementById("download-standard-template");
const templateStatus = document.getElementById("template-status");

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1500);
}

async function checkStandardTemplateAvailability() {
  if (!standardTemplateLink || !templateStatus) {
    return;
  }

  const templateUrl = standardTemplateLink.getAttribute("href");
  if (!templateUrl) {
    templateStatus.textContent = "Template link is not configured.";
    standardTemplateLink.classList.add("disabled");
    return;
  }

  try {
    const response = await fetch(templateUrl, { method: "HEAD", cache: "no-store" });
    if (response.ok) {
      templateStatus.textContent = "Standard template is available.";
      standardTemplateLink.classList.remove("disabled");
      return;
    }
  } catch (_) {
    // Ignore and show setup hint below.
  }

  templateStatus.textContent = "Template file not found. Add your DOCX at docs/templates/Tenancy Agreement New.docx.";
  standardTemplateLink.classList.add("disabled");
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    state.rows = Array.isArray(parsed.rows) ? parsed.rows : [];
    state.landlords = Array.isArray(parsed.landlords) ? parsed.landlords : [];
    state.selectedLandlordId = typeof parsed.selectedLandlordId === "string" ? parsed.selectedLandlordId : "";
  } catch (_) {
    state.rows = [];
    state.landlords = [];
    state.selectedLandlordId = "";
  }
}

function preferredColumns(rows) {
  const discovered = [];
  rows.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (!discovered.includes(key)) {
        discovered.push(key);
      }
    });
  });

  const columns = [];
  PREFERRED_FIELDS.forEach((field) => {
    if (discovered.includes(field)) {
      columns.push(field);
    }
  });

  discovered.forEach((field) => {
    if (!columns.includes(field)) {
      columns.push(field);
    }
  });

  return columns;
}

function createEmptyRow(columns) {
  const row = {};
  columns.forEach((column) => {
    row[column] = "";
  });
  return row;
}

function updateBadges() {
  const count = state.rows.length;
  rowCountBadge.textContent = `${count} row${count === 1 ? "" : "s"} loaded`;
}

function renderLandlordSelect() {
  landlordSelect.innerHTML = "<option value=''>Select saved landlord profile</option>";
  state.landlords.forEach((landlord) => {
    const option = document.createElement("option");
    option.value = landlord.id;
    option.textContent = `${landlord.name} (${landlord.email || "no email"})`;
    landlordSelect.appendChild(option);
  });
  landlordSelect.value = state.selectedLandlordId;
}

function renderPreviewSelect() {
  previewRowSelect.innerHTML = "";
  if (!state.rows.length) {
    rowPreview.textContent = "No rows to preview.";
    return;
  }

  state.rows.forEach((_, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = `Row ${index + 1}`;
    previewRowSelect.appendChild(option);
  });

  previewRowSelect.value = "0";
  rowPreview.textContent = JSON.stringify(state.rows[0], null, 2);
}

function renderTable() {
  updateBadges();
  renderPreviewSelect();

  if (!state.rows.length) {
    tableWrap.innerHTML = "<p class='tiny'>Import data to begin editing.</p>";
    importSummary.textContent = "No rows loaded.";
    return;
  }

  const columns = preferredColumns(state.rows);
  const thead = columns.map((col) => `<th>${col}</th>`).join("");

  const body = state.rows
    .map((row, rowIndex) => {
      const cells = columns
        .map((column) => {
          const val = row[column] || "";
          return `<td><input data-row='${rowIndex}' data-col='${column}' value='${escapeHtml(val)}' /></td>`;
        })
        .join("");
      return `<tr>${cells}<td class='row-actions'><button class='ghost small' data-delete='${rowIndex}' type='button'>Delete</button></td></tr>`;
    })
    .join("");

  tableWrap.innerHTML = `<table><thead><tr>${thead}<th>Actions</th></tr></thead><tbody>${body}</tbody></table>`;

  tableWrap.querySelectorAll("input[data-row]").forEach((input) => {
    input.addEventListener("input", (event) => {
      const rowIndex = Number(event.target.dataset.row);
      const column = event.target.dataset.col;
      state.rows[rowIndex][column] = event.target.value;
      saveState();
      const selected = Number(previewRowSelect.value || "0");
      if (selected === rowIndex) {
        rowPreview.textContent = JSON.stringify(state.rows[rowIndex], null, 2);
      }
    });
  });

  tableWrap.querySelectorAll("button[data-delete]").forEach((button) => {
    button.addEventListener("click", () => {
      const rowIndex = Number(button.dataset.delete);
      state.rows.splice(rowIndex, 1);
      saveState();
      renderTable();
    });
  });

  importSummary.textContent = `${state.rows.length} row${state.rows.length === 1 ? "" : "s"} ready for export.`;
}

function escapeHtml(input) {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#039;");
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === "\"" && inQuotes && next === "\"") {
      current += "\"";
      i += 1;
      continue;
    }

    if (char === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function rowsToCsv(rows) {
  if (!rows.length) {
    return "";
  }

  const columns = preferredColumns(rows);
  const escape = (value) => {
    const raw = String(value || "");
    if (raw.includes(",") || raw.includes("\"") || raw.includes("\n")) {
      return `"${raw.replaceAll("\"", "\"\"")}"`;
    }
    return raw;
  };

  const header = columns.join(",");
  const body = rows.map((row) => columns.map((column) => escape(row[column] || "")).join(",")).join("\n");
  return `${header}\n${body}`;
}

function getSampleRows() {
  return [
    {
      tenant_1_name: "Alex Johnson",
      tenant_1_email: "alex@example.com",
      tenant_1_phone: "07700 000000",
      property_address: "12 Market Street, London",
      room_name: "Room 4",
      contract_period: "3 months",
      week_month: "month",
      rent_expected: "850",
      payment_period: "Monthly"
    },
    {
      tenant_1_name: "Jamie Singh",
      tenant_1_email: "jamie@example.com",
      tenant_1_phone: "07700 000001",
      property_address: "14 King Street, London",
      room_name: "Room 2",
      contract_period: "6 months",
      week_month: "month",
      rent_expected: "790",
      payment_period: "Monthly"
    }
  ];
}

function applyLandlordToRows(landlord) {
  if (!landlord || !state.rows.length) {
    return;
  }

  state.rows = state.rows.map((row) => ({
    ...row,
    landlord_name: landlord.name || "",
    landlord_telephone_number: landlord.phone || "",
    landlord_email_address: landlord.email || "",
    landlord_signature: landlord.signature || "",
    landlord_address: row.landlord_address || row.property_address || ""
  }));

  saveState();
  renderTable();
  showToast("Landlord values applied");
}

function setDateFields() {
  if (!state.rows.length) {
    return;
  }

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 3);
  end.setDate(end.getDate() - 1);

  const format = (d) => `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  state.rows = state.rows.map((row) => ({
    ...row,
    todays_date: format(now),
    commencement_date: row.commencement_date || format(now),
    end_date: row.end_date || format(end)
  }));

  saveState();
  renderTable();
}

dataFileInput.addEventListener("change", async () => {
  const [file] = dataFileInput.files || [];
  if (!file) {
    return;
  }

  const text = await readFileAsText(file);
  const extension = file.name.toLowerCase().split(".").pop();

  if (extension === "json") {
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed) ? parsed : parsed.rows;
    if (!Array.isArray(rows)) {
      throw new Error("JSON must be an array or an object containing a rows array.");
    }
    state.rows = rows;
  } else {
    state.rows = parseCsv(text);
  }

  saveState();
  renderTable();
  showToast("Data imported");
});

document.getElementById("load-sample").addEventListener("click", () => {
  state.rows = getSampleRows();
  saveState();
  renderTable();
  showToast("Sample rows loaded");
});

document.getElementById("clear-all").addEventListener("click", () => {
  state.rows = [];
  saveState();
  renderTable();
  showToast("Rows cleared");
});

document.getElementById("add-row").addEventListener("click", () => {
  const columns = preferredColumns(state.rows);
  const fallbackColumns = columns.length ? columns : PREFERRED_FIELDS;
  state.rows.push(createEmptyRow(fallbackColumns));
  saveState();
  renderTable();
});

document.getElementById("autofill-dates").addEventListener("click", () => {
  setDateFields();
  showToast("Date fields updated");
});

document.getElementById("save-landlord").addEventListener("click", () => {
  const name = document.getElementById("landlord-name").value.trim();
  const phone = document.getElementById("landlord-phone").value.trim();
  const email = document.getElementById("landlord-email").value.trim();
  const signature = document.getElementById("landlord-signature").value.trim();

  if (!name) {
    showToast("Name is required");
    return;
  }

  const landlord = {
    id: crypto.randomUUID(),
    name,
    phone,
    email,
    signature
  };

  state.landlords.push(landlord);
  state.selectedLandlordId = landlord.id;
  saveState();
  renderLandlordSelect();
  showToast("Landlord profile saved");
});

landlordSelect.addEventListener("change", () => {
  state.selectedLandlordId = landlordSelect.value;
  saveState();
});

document.getElementById("apply-landlord").addEventListener("click", () => {
  const landlord = state.landlords.find((entry) => entry.id === landlordSelect.value);
  applyLandlordToRows(landlord);
});

previewRowSelect.addEventListener("change", () => {
  const idx = Number(previewRowSelect.value || "0");
  const row = state.rows[idx];
  rowPreview.textContent = row ? JSON.stringify(row, null, 2) : "No rows to preview.";
});

document.getElementById("copy-placeholders").addEventListener("click", async () => {
  const columns = preferredColumns(state.rows);
  const placeholders = columns.map((column) => `{{ ${column} }}`).join("\n");
  if (!placeholders) {
    showToast("No columns available");
    return;
  }

  await navigator.clipboard.writeText(placeholders);
  showToast("Placeholder tokens copied");
});

document.getElementById("export-csv").addEventListener("click", () => {
  const csv = rowsToCsv(state.rows);
  if (!csv) {
    showToast("No rows to export");
    return;
  }
  download("tenant_contract_rows.csv", csv, "text/csv;charset=utf-8;");
  showToast("CSV exported");
});

document.getElementById("export-json").addEventListener("click", () => {
  if (!state.rows.length) {
    showToast("No rows to export");
    return;
  }
  download("tenant_contract_rows.json", JSON.stringify(state.rows, null, 2), "application/json;charset=utf-8;");
  showToast("JSON exported");
});

window.addEventListener("error", (event) => {
  console.error(event.error);
  showToast("Something went wrong. See browser console.");
});

loadState();
renderLandlordSelect();
renderTable();
checkStandardTemplateAvailability();
