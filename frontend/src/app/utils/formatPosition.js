// Maps position keys to display labels
const POSITION_LABELS = {
  president: "President",
  vice_president: "Vice President",
  presidents_rep: "President's Rep",
  secretary: "Secretary",
  assistant_secretary: "Assistant Secretary",
  financial_secretary: "Financial Secretary",
  treasurer: "Treasurer",
  organizer: "Organizer",
  evangelism_coordinator: "Evangelism Coordinator",
};

export default function formatPosition(position) {
  if (!position) return "N/A";
  return POSITION_LABELS[position] || position;
}
