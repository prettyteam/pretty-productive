/**
 * Shippo labels for extension rentals (office only). The key lives in the script property SHIPPO_API_KEY,
 * added by Alexandra in Project Settings > Script properties; it is never sent to the app.
 * Prices are looked up with shippoRates_; a label is bought only when the office taps Buy and confirms
 * (shippoBuy_). Outbound and return labels are kept apart on the wedding: ext.out and ext.ret.
 */
const SHIPPO_API = 'https://api.goshippo.com';
const SHIPPO_FROM = { name: 'Taffeta Salon & Spa', street1: '219 Bellevue Ave', city: 'Hammonton', state: 'NJ', zip: '08037',
                      country: 'US', phone: '8662198811', email: 'info@taffetadesign.com' };
const SHIPPO_PARCEL_DEFAULT = { length: '12', width: '10', height: '4', weight: '2' };

function shippo_(method, path, body) {
  const key = PropertiesService.getScriptProperties().getProperty('SHIPPO_API_KEY');
  if (!key) { const e = new Error('Add your Shippo key first (Project Settings > Script properties > SHIPPO_API_KEY).'); e.friendly = true; throw e; }
  const res = UrlFetchApp.fetch(SHIPPO_API + path, {
    method: method, contentType: 'application/json', muteHttpExceptions: true,
    headers: { Authorization: 'ShippoToken ' + key },
    payload: body ? JSON.stringify(body) : undefined
  });
  const code = res.getResponseCode(), text = res.getContentText();
  let j = {}; try { j = text ? JSON.parse(text) : {}; } catch (_) {}
  if (code >= 300) { const e = new Error('Shippo said: ' + (j.detail || text.slice(0, 200))); e.friendly = true; throw e; }
  return j;
}

function shippoParcel_() {
  try { return Object.assign({}, SHIPPO_PARCEL_DEFAULT, JSON.parse(PropertiesService.getScriptProperties().getProperty('SHIPPO_PARCEL') || '{}')); }
  catch (_) { return Object.assign({}, SHIPPO_PARCEL_DEFAULT); }
}

/** Office: read or save the default box size and weight. */
function shippoSettings_(p) {
  const props = PropertiesService.getScriptProperties();
  if (p && typeof p === 'object') {
    const num = v => { const n = Number(String(v || '').replace(/[^\d.]/g, '')); return n > 0 && n < 200 ? String(n) : ''; };
    const cur = shippoParcel_(), next = {};
    ['length', 'width', 'height', 'weight'].forEach(k => next[k] = num(p[k]) || cur[k]);
    props.setProperty('SHIPPO_PARCEL', JSON.stringify(next));
  }
  return { ok: true, parcel: shippoParcel_(), hasKey: !!props.getProperty('SHIPPO_API_KEY') };
}

function shippoBride_(x) {
  return { name: clean_(x.shipName, 100), street1: clean_(x.shipStreet, 120), street2: clean_(x.shipStreet2, 120), city: clean_(x.shipCity, 60),
           state: clean_(x.shipState, 20), zip: clean_(x.shipZip, 12), country: 'US', phone: clean_(x.shipPhone, 20) || SHIPPO_FROM.phone,
           email: SHIPPO_FROM.email };
}

function shippoWedding_(id) {
  const w = weddings_().find(x => x.d.id === id);
  if (!w) { const e = new Error('Save the wedding first.'); e.friendly = true; throw e; }
  return w;
}

function shippoCall_(fn) {
  try { return fn(); }
  catch (e) { if (e.friendly) return { ok: false, error: 'shippo', message: e.message }; throw e; }
}

/** Office: USPS prices for the outbound or return label, cheapest first. Buys nothing. */
function shippoRates_(weddingId, kind) {
  return shippoCall_(() => {
    const w = shippoWedding_(weddingId), x = w.d.ext || {}, bride = shippoBride_(x);
    if (!bride.name || !bride.street1 || !bride.city || !bride.state || !bride.zip) return { ok: false, error: 'bad_request', message: 'Fill in the ship-to name and address first.' };
    const p = shippoParcel_(), ret = kind === 'return';
    const body = { address_from: ret ? bride : SHIPPO_FROM, address_to: ret ? SHIPPO_FROM : bride,
      parcels: [{ length: p.length, width: p.width, height: p.height, distance_unit: 'in', weight: p.weight, mass_unit: 'lb' }], async: false };
    if (ret) body.extra = { is_return: true };
    const s = shippo_('post', '/shipments/', body);
    const rates = (s.rates || []).filter(r => /usps/i.test(r.provider || ''))
      .map(r => ({ id: r.object_id, service: (r.servicelevel && r.servicelevel.name) || 'USPS', amount: r.amount, currency: r.currency, days: r.estimated_days }))
      .sort((a, b) => Number(a.amount) - Number(b.amount));
    if (!rates.length) return { ok: false, error: 'shippo', message: 'Shippo found no USPS prices for this address. Check the address and box size.' };
    return { ok: true, rates: rates };
  });
}

/** Office: buy one label (only after the office confirms in the app) and save it on the wedding. */
function shippoBuy_(weddingId, rateId, kind) {
  return shippoCall_(() => {
    if (!rateId) return { ok: false, error: 'bad_request', message: 'Pick a price first.' };
    const w = shippoWedding_(weddingId);
    const t = shippo_('post', '/transactions/', { rate: String(rateId), label_file_type: 'PDF', async: false });
    if (t.status !== 'SUCCESS') {
      const msg = (t.messages || []).map(m => m.text).filter(Boolean).join(' ') || 'The label was not created.';
      return { ok: false, error: 'shippo', message: 'Shippo: ' + msg };
    }
    let amount = '';
    try { amount = shippo_('get', '/rates/' + encodeURIComponent(rateId)).amount || ''; } catch (_) {}
    const label = { cost: amount, tracking: t.tracking_number || '', labelUrl: t.label_url || '', trackUrl: t.tracking_url_provider || '',
                    bought: true, boughtAt: new Date().toISOString() };
    const d = w.d, ext = Object.assign({}, d.ext || {});
    if (kind === 'return') ext.ret = label;
    else { ext.out = label; ext.bought = true; ext.labelCost = amount; ext.tracking = label.tracking; }
    d.ext = ext;
    saveWedding_(d);
    return { ok: true, ext: ext, labelUrl: label.labelUrl };
  });
}
