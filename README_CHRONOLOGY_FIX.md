# Chronology fix

This patch corrects the canonical match order used by the website.

It fixes the June 13/14 ordering so the sequence is:

1. Qatar vs Switzerland
2. Brazil vs Morocco
3. Haiti vs Scotland
4. Australia vs Türkiye

It also makes `app.js` ignore stale `date` / `sortOrder` fields in `resultats.js`; manual score and `status` fields are still read normally.

Upload/replace only `app.js`. Do not replace `resultats.js`.
