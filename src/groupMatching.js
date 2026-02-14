function compact(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function splitTokens(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

export function detectGroupsCommonPrefix(groupNames) {
  const names = (groupNames || []).filter(Boolean);
  if (names.length < 2) {
    return "";
  }

  let prefix = names[0];
  for (let i = 1; i < names.length; i += 1) {
    const current = names[i];
    let j = 0;
    while (j < prefix.length && j < current.length && prefix[j] === current[j]) {
      j += 1;
    }
    prefix = prefix.slice(0, j);
    if (!prefix) {
      return "";
    }
  }

  return prefix;
}

export function stripDetectedPrefix(value, prefix) {
  const source = String(value ?? "");
  if (!prefix) {
    return source;
  }
  const stripped = source.startsWith(prefix) ? source.slice(prefix.length) : source;
  return stripped.replace(/^[-_\s]+/, "").trim();
}

export function resolveKnownGroupName(inputValue, allGroups) {
  const groupInput = String(inputValue ?? "").trim();
  if (!groupInput) {
    return "";
  }

  const groups = (allGroups || []).filter(Boolean);
  if (groups.length === 0) {
    return groupInput;
  }

  const inputCompact = compact(groupInput);
  const commonPrefix = detectGroupsCommonPrefix(groups);

  const exactFull = groups.find((group) => compact(group) === inputCompact);
  if (exactFull) {
    return exactFull;
  }

  const exactStripped = groups.find(
    (group) => compact(stripDetectedPrefix(group, commonPrefix)) === inputCompact,
  );
  if (exactStripped) {
    return exactStripped;
  }

  const fuzzyCandidates = groups.filter((group) => {
    const full = compact(group);
    const stripped = compact(stripDetectedPrefix(group, commonPrefix));
    return full.includes(inputCompact) || stripped.includes(inputCompact);
  });

  if (fuzzyCandidates.length === 1) {
    return fuzzyCandidates[0];
  }

  return groupInput;
}

export function doesFileMatchGroup(fileName, group, allGroups) {
  const normalizedGroup = compact(group);
  if (!normalizedGroup) {
    return false;
  }

  const normalizedFileName = compact(fileName);
  if (normalizedFileName.includes(normalizedGroup)) {
    return true;
  }

  const commonPrefix = detectGroupsCommonPrefix(allGroups || []);
  const strippedGroup = stripDetectedPrefix(group, commonPrefix);
  const normalizedStrippedGroup = compact(strippedGroup);
  if (!normalizedStrippedGroup) {
    return false;
  }

  const fileTokens = splitTokens(fileName);
  return fileTokens.includes(normalizedStrippedGroup);
}
