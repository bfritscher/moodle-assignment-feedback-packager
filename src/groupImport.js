function rowValues(row) {
  const values = Array.isArray(row) ? row : [];
  const group = String(values[0] ?? "").trim();
  const second = String(values[1] ?? "").trim();
  const third = String(values[2] ?? "").trim();

  return {
    values,
    group,
    second,
    third,
  };
}

function normalizeHeader(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function findHeaderKey(row, acceptedHeaders) {
  const keys = Object.keys(row || {});
  return keys.find((key) => acceptedHeaders.includes(normalizeHeader(key)));
}

export function parseGroupIdImportRow(row) {
  const { group, second } = rowValues(row);

  if (!group) {
    return null;
  }

  return {
    group,
    groupId: second,
  };
}

export function parseGroupGradeImportRow(row) {
  const { values, group, second, third } = rowValues(row);

  if (!group) {
    return null;
  }

  return {
    group,
    grade: second,
    feedback: values.length >= 3 ? third : null,
  };
}

export function parseHeaderBasedImportRow(row) {
  const source = row || {};
  const groupKey = findHeaderKey(source, ["groupe", "group"]);
  const groupIdKey = findHeaderKey(source, ["id", "groupid", "idgroupe", "idgroup"]);
  const noteKey = findHeaderKey(source, ["note", "grade"]);

  const group = String(groupKey ? (source[groupKey] ?? "") : "").trim();
  if (!group) {
    return null;
  }

  const groupId = String(groupIdKey ? (source[groupIdKey] ?? "") : "").trim();
  const note = noteKey ? String(source[noteKey] ?? "").trim() : null;

  const extraCommentParts = Object.entries(source)
    .filter(([header]) => header !== groupKey && header !== groupIdKey && header !== noteKey)
    .map(([header, value]) => {
      const formattedValue = String(value ?? "").trim();
      if (!formattedValue) {
        return "";
      }
      return `<p><strong>${escapeHtml(header)}:</strong> ${escapeHtml(formattedValue)}</p>`;
    })
    .filter(Boolean);

  if (note !== null) {
    extraCommentParts.push(`<p><strong>Note:</strong> ${escapeHtml(note)}</p>`);
  }

  return {
    group,
    groupId,
    grade: note,
    feedback: extraCommentParts.join(""),
  };
}
