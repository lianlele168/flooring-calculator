const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const formatMoney = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(Number.isFinite(value) ? value : 0);

const formatNumber = (value, digits = 0) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);

const valueOf = (id) => {
  const value = parseFloat($(id)?.value ?? "0");
  return Number.isFinite(value) ? value : 0;
};

const TYPE_DEFAULTS = {
  laminate: { price: 2.5, waste: 10, underlayment: 0.5, label: "Laminate" },
  hardwood: { price: 6.0, waste: 8, underlayment: 0, label: "Hardwood" },
  tile: { price: 3.0, waste: 15, underlayment: 1.0, label: "Tile" },
  vinyl: { price: 2.0, waste: 10, underlayment: 0.3, label: "Vinyl" },
};

function onTypeChange() {
  const type = $("#floor-type")?.value || "laminate";
  const def = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.laminate;
  if ($("#material-price")) $("#material-price").value = def.price;
  if ($("#waste")) $("#waste").value = def.waste;
  if ($("#underlayment-price")) $("#underlayment-price").value = def.underlayment;
  calculate();
}

function calculate() {
  const areaMode = document.querySelector('input[name="area-mode"]:checked')?.value || "room";
  const roomLength = valueOf("#room-length");
  const roomWidth = valueOf("#room-width");
  const roomCount = Math.max(1, valueOf("#room-count"));
  const manualArea = valueOf("#manual-area");
  const manualZoneCount = Math.max(1, valueOf("#manual-zone-count"));
  const area = areaMode === "room" ? roomLength * roomWidth * roomCount : manualArea * manualZoneCount;

  const type = $("#floor-type")?.value || "laminate";
  const def = TYPE_DEFAULTS[type] || TYPE_DEFAULTS.laminate;
  const materialPrice = valueOf("#material-price");
  const waste = Math.max(0, valueOf("#waste")) / 100;
  const underlaymentPrice = valueOf("#underlayment-price");
  const includeInstall = $("#include-install")?.checked;
  const installRate = valueOf("#install-rate");

  const needed = area * (1 + waste);
  const materialCost = needed * materialPrice;
  const underlaymentCost = area * underlaymentPrice;
  const laborCost = includeInstall && installRate > 0 ? area * installRate : 0;
  const totalCost = materialCost + underlaymentCost + laborCost;
  const lowRange = totalCost * 0.85;
  const highRange = totalCost * 1.2;
  const costPerSqft = area > 0 ? totalCost / area : 0;

  if ($("#floor-area")) $("#floor-area").textContent = `${formatNumber(area)} sq ft`;
  if ($("#flooring-needed")) $("#flooring-needed").textContent = `${formatNumber(needed)} sq ft`;
  if ($("#material-cost")) $("#material-cost").textContent = formatMoney(materialCost);
  if ($("#underlayment-cost")) $("#underlayment-cost").textContent = formatMoney(underlaymentCost);
  if ($("#install-cost")) $("#install-cost").textContent = includeInstall ? formatMoney(laborCost) : "Not included";
  if ($("#total-cost")) $("#total-cost").textContent = formatMoney(totalCost);
  if ($("#cost-range")) $("#cost-range").textContent = `${formatMoney(lowRange)} to ${formatMoney(highRange)} planning range`;
  if ($("#cost-per-sqft")) $("#cost-per-sqft").textContent = formatMoney(costPerSqft);
  if ($("#assumption-type")) $("#assumption-type").textContent = def.label;
  if ($("#assumption-waste")) $("#assumption-waste").textContent = `${formatNumber(waste * 100)}% waste`;
  if ($("#assumption-install")) $("#assumption-install").textContent = includeInstall ? "Install included" : "Material only";

  const materialShare = totalCost > 0 ? Math.round((materialCost / totalCost) * 100) : 0;
  const underlayShare = totalCost > 0 ? Math.round((underlaymentCost / totalCost) * 100) : 0;
  const laborShare = totalCost > 0 ? 100 - materialShare - underlayShare : 0;
  if ($("#material-bar")) $("#material-bar").style.width = `${materialShare}%`;
  if ($("#underlay-bar")) $("#underlay-bar").style.width = `${underlayShare}%`;
  if ($("#labor-bar")) $("#labor-bar").style.width = `${laborShare}%`;
  if ($("#material-share")) $("#material-share").textContent = `${materialShare}%`;
  if ($("#underlay-share")) $("#underlay-share").textContent = `${underlayShare}%`;
  if ($("#labor-share")) $("#labor-share").textContent = `${laborShare}%`;

  if ($("#shopping-list")) {
    $("#shopping-list").textContent = `Buy about ${formatNumber(needed)} sq ft of ${def.label.toLowerCase()} flooring (round up to full cartons). Add underlayment${includeInstall ? " and budget for professional installation" : " and install it yourself"}.`;
  }

  if ($("#breakdown-body")) {
    const lines = [
      ["Floor area", "Room length x width x rooms, or entered total square feet", `${formatNumber(area)} sq ft`],
      ["Flooring to buy", `Floor area x ${formatNumber(1 + waste, 2)} waste factor, rounded to cartons`, `${formatNumber(needed)} sq ft`],
      [`${def.label} material`, `${formatNumber(needed)} sq ft x ${formatMoney(materialPrice)} per sq ft`, formatMoney(materialCost)],
      ["Underlayment", area > 0 && underlaymentPrice > 0 ? `${formatNumber(area)} sq ft x ${formatMoney(underlaymentPrice)} per sq ft` : "None entered", formatMoney(underlaymentCost)],
      ["Installation", includeInstall && installRate > 0 ? `${formatNumber(area)} sq ft x ${formatMoney(installRate)} per sq ft` : "Material-only estimate", formatMoney(laborCost)],
      ["Estimated total", "Material plus underlayment plus labor", formatMoney(totalCost)],
    ];
    $("#breakdown-body").innerHTML = lines
      .map(([name, formula, amount]) => `<tr><td>${name}</td><td>${formula}</td><td>${amount}</td></tr>`)
      .join("");
  }

  window.currentEstimate = {
    totalCost,
    area,
    needed,
    materialCost,
    underlaymentCost,
    laborCost,
    costPerSqft,
    type: def.label,
  };
}

function updateMode() {
  const areaMode = document.querySelector('input[name="area-mode"]:checked')?.value || "room";
  $$("[data-mode]").forEach((group) => {
    group.classList.toggle("hidden", group.dataset.mode !== areaMode);
  });
  calculate();
}

function copySummary() {
  const estimate = window.currentEstimate;
  if (!estimate) return;
  const text = [
    "FloorWise flooring estimate",
    `Floor area: ${formatNumber(estimate.area)} sq ft`,
    `Flooring to buy: ${formatNumber(estimate.needed)} sq ft`,
    `Material: ${formatMoney(estimate.materialCost)}`,
    `Underlayment: ${formatMoney(estimate.underlaymentCost)}`,
    `Installation: ${formatMoney(estimate.laborCost)}`,
    `Total: ${formatMoney(estimate.totalCost)}`,
    `Cost per sq ft: ${formatMoney(estimate.costPerSqft)}`,
  ].join("\n");

  navigator.clipboard?.writeText(text).then(
    () => { if ($("#copy-status")) $("#copy-status").textContent = "Estimate copied."; },
    () => { if ($("#copy-status")) $("#copy-status").textContent = text; }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  $$("input").forEach((input) => {
    input.addEventListener("input", calculate);
    input.addEventListener("change", input.name === "area-mode" ? updateMode : calculate);
  });
  if ($("#floor-type")) $("#floor-type").addEventListener("change", onTypeChange);
  if ($("#copy-summary")) $("#copy-summary").addEventListener("click", copySummary);
  updateMode();
});
