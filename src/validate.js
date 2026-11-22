const RUNID_RE = /^[A-Za-z0-9_-]{1,64}$/;

function isUuid(s) {
  return typeof s === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

function validateTitle(t) {
  if (typeof t !== 'string') return null;
  const v = t.trim();
  if (v.length < 1 || v.length > 200) return null;
  return v;
}

function validateRunId(r) {
  return typeof r === 'string' && RUNID_RE.test(r) ? r : null;
}

module.exports = { isUuid, validateTitle, validateRunId };