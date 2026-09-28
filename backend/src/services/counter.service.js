import { Counter } from '../models/Counter.js';

/**
 * Generate gapless, human-sortable, atomic sequential reference numbers
 * e.g. INVT-2026-000001, VISA-2026-000001, CRV-2026-000001, DEP-2026-000001, PAY-2026-000001
 * Scoped per agency so each agency begins numbering independently at 000001.
 */
export async function getNextRef(prefix, session = null, agencyId = null) {
  const year = new Date().getFullYear();
  const storageKey = agencyId ? `${agencyId}:${prefix}-${year}` : `${prefix}-${year}`;
  const displayKey = `${prefix}-${year}`;

  const options = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  };
  if (session) {
    options.session = session;
  }

  const doc = await Counter.findOneAndUpdate(
    { _id: storageKey },
    { $inc: { seq: 1 } },
    options
  );

  const seqNumber = String(doc.seq).padStart(6, '0');
  return `${displayKey}-${seqNumber}`;
}

