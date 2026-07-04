// Rank catalog items by free-text query against id, name, description, domains, signals.
export function searchCatalog(all, query, opts = {}) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const tokens = q.split(/\s+/).filter(Boolean);
  const typeFilter = opts.type ? String(opts.type).toLowerCase() : null;
  const limit = opts.limit ?? 20;

  return all
    .filter((item) => {
      if (!typeFilter) return true;
      if (typeFilter === "skill") return item.type === "skill" || item.type === "reference";
      if (typeFilter === "hook") return item.type === "hook" || item.type === "setting";
      return item.type === typeFilter;
    })
    .map((item) => {
      const hay = [
        item.id,
        item.name,
        item.description,
        item.tier,
        item.type,
        ...(item.domains || []),
        ...(item.signals || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const score = tokens.reduce(
        (n, t) => n + (hay.includes(t) ? (item.id === t || item.id.includes(t) ? 3 : 1) : 0),
        0,
      );
      return { item, score };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id))
    .slice(0, limit);
}
