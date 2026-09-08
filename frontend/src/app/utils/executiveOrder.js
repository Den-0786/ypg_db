const DISTRICT_ORDER = [
  "president",
  "presidents_rep",
  "secretary",
  "assistant_secretary",
];

const LOCAL_ORDER = [
  "president",
  "vice_president",
  "secretary",
  "assistant_secretary",
];

const ALIASES = {
  president: "president",
  vice_president: "vice_president",
  presidents_rep: "presidents_rep",
  presidents_representative: "presidents_rep",
  secretary: "secretary",
  assistant_secretary: "assistant_secretary",
  financial_secretary: "financial_secretary",
  treasurer: "treasurer",
  organizer: "organizer",
  evangelism_coordinator: "evangelism_coordinator",
};

function canonicalPosition(position) {
  if (!position) return "";
  let key = position
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]+/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ALIASES[key] || "";
}

function getMemberPosition(member) {
  return (
    member.executive_position ||
    member.local_executive_position ||
    member.district_executive_position ||
    member.position ||
    ""
  );
}

export function sortExecutives(executives, level = "district") {
  const order = level === "local" ? LOCAL_ORDER : DISTRICT_ORDER;
  const rank = new Map(order.map((pos, i) => [pos, i]));
  const fallback = order.length;
  return [...executives].sort((a, b) => {
    const ra = rank.get(canonicalPosition(getMemberPosition(a)));
    const rb = rank.get(canonicalPosition(getMemberPosition(b)));
    return (ra === undefined ? fallback : ra) - (rb === undefined ? fallback : rb);
  });
}