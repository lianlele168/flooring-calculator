const $ = (selector) => document.querySelector(selector);

function miniCalc() {
  const length = parseFloat($("#mini-length")?.value) || 0;
  const width = parseFloat($("#mini-width")?.value) || 0;
  const rooms = Math.max(1, parseFloat($("#mini-rooms")?.value) || 1);
  const price = parseFloat($("#mini-price")?.value) || 2.5;
  const waste = (Math.max(0, parseFloat($("#mini-waste")?.value) || 10)) / 100;

  const floorArea = length * width * rooms;
  const adjusted = floorArea * (1 + waste);
  const cost = adjusted * price;

  if ($("#mini-area")) $("#mini-area").textContent = `${Math.round(floorArea).toLocaleString()} sq ft`;
  if ($("#mini-needed")) $("#mini-needed").textContent = `${Math.round(adjusted).toLocaleString()} sq ft`;
  if ($("#mini-cost")) $("#mini-cost").textContent = `$${Math.round(cost).toLocaleString()}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".mini-calc input").forEach((input) => {
    input.addEventListener("input", miniCalc);
  });
  miniCalc();
});
