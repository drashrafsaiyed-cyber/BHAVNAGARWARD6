import { useMemo, useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────
// Caste / community inference by SURNAME (last word of the name).
//
// Electoral rolls do NOT contain caste data. This is a heuristic built
// from the most common surnames in Bhavnagar Ward 6. Each surname is
// listed in BOTH forms because some voter names were OCR-corrected
// (e.g. "શાહ") while others remain in the original garbled PDF-font
// encoding (e.g. "શદહ"). Both must match to catch all voters.
// ─────────────────────────────────────────────────────────────────────────

// Each entry maps a surname (garbled OR correct form) → community label.
// Key is the exact surname string. Order of declaration doesn't matter.
const SURNAME_MAP = {
  // ── Muslim ──────────────────────────────────────────────────────────
  'શેખ': 'Muslim',         'શકખ': 'Muslim',
  'કુરેશી': 'Muslim',      'કનરકશન': 'Muslim',   'કનરપશન': 'Muslim',
  'સૈયદ': 'Muslim',        'સપયદ': 'Muslim',
  'કાઝી': 'Muslim',        'કદઝન': 'Muslim',      'કદઝ': 'Muslim',
  'પઠાણ': 'Muslim',        'પઠદણ': 'Muslim',
  'મોમીન': 'Muslim',       'મવમનન': 'Muslim',     'મવદન': 'Muslim',
  'ખાન': 'Muslim',         'ખદન': 'Muslim',
  'મલિક': 'Muslim',        'મલકક': 'Muslim',
  'મન્સૂરી': 'Muslim',     'મનસનરન': 'Muslim',
  'અન્સારી': 'Muslim',     'અનસદરન': 'Muslim',
  'ઘાંચી': 'Muslim',       'ઘદનચન': 'Muslim',
  'મેમણ': 'Muslim',        'મકમણ': 'Muslim',
  'બેલીમ': 'Muslim',       'બકલનમ': 'Muslim',
  'હિંગોરા': 'Muslim',     'હનનગવરદ': 'Muslim',
  'બલોચ': 'Muslim',        'બલવચ': 'Muslim',
  'મુલાણી': 'Muslim',      'મનલદણન': 'Muslim',
  'ખોખર': 'Muslim',        'ખવખર': 'Muslim',      'ખવકર': 'Muslim',
  'સિપાઈ': 'Muslim',       'સનપદઈ': 'Muslim',     'સનપદઇ': 'Muslim',
  'ખોરાકીવાલા': 'Muslim',  'ખવરદકનવદલદ': 'Muslim','ખવરકકનવદલદ': 'Muslim',
  // Confirmed by local:  Khoja, Ghanchi, Radhanpuri, Salavat, Vohra-Tinvala, Rangwala
  'ખોજા': 'Muslim',        'ખવજદ': 'Muslim',
  'ઘાંચી': 'Muslim',
  'સલાવત': 'Muslim',       'સલવત': 'Muslim',        'સકલવત': 'Muslim',      // Salavat / Selvat (Ghanchi)
  'રાધનપુરી': 'Muslim',    'રદધનપનરન': 'Muslim',                              // Radhanpuri (Memon)
  'રંગવાલા': 'Muslim',     'રનગવદલદ': 'Muslim',                               // Rangwala
  'ખોરજયા': 'Muslim',      'ખવરજયદ': 'Muslim',   'ખોરજીયા': 'Muslim', 'ખોરેજીયા': 'Muslim', 'ખોરજિયા': 'Muslim', // Khorajiya
  // ── Additional Muslim surnames (from voter-data frequency audit) ──
  'મલેક': 'Muslim',        'મલીક': 'Muslim',      'મલિક': 'Muslim',
  'મનસૂરી': 'Muslim',      'મન્સુરી': 'Muslim',   'મનસુરી': 'Muslim',  'મન્સૂરી': 'Muslim',
  'કાદરી': 'Muslim',       'કાદરી': 'Muslim',     'કાદરીસૈયદ': 'Muslim',
  'વ્હોરા': 'Muslim',      'વોહરા': 'Muslim',     'વોરો': 'Muslim',
  'ખ્વાજા': 'Muslim',
  'બુખારી': 'Muslim',
  'હાફીઝ': 'Muslim',       'હાફિઝ': 'Muslim',     'હાફિજ': 'Muslim',
  'નકવી': 'Muslim',
  'મોગલ': 'Muslim',        'મુગલ': 'Muslim',
  'ખલીફા': 'Muslim',
  'કાજી': 'Muslim',        'કાજિ': 'Muslim',
  'પઠાન': 'Muslim',
  'મુનશી': 'Muslim',       'મન્શી': 'Muslim',     'મુનસી': 'Muslim',
  'બુરહાની': 'Muslim',
  'ફોજદાર': 'Muslim',      'ફોઝદાર': 'Muslim',
  'સલોત': 'Muslim',        'સેલોત': 'Muslim',     'સેલોટ': 'Muslim',   'સૈલોત': 'Muslim',   'સલોટ': 'Muslim',
  'લંઘા': 'Muslim',        'લંધા': 'Muslim',
  'રફાઈ': 'Muslim',        'રફાઇ': 'Muslim',
  'અગવાન': 'Muslim',       'આગવાન': 'Muslim',
  'આરબ': 'Muslim',
  'ગોરી': 'Muslim',
  'અજમેરી': 'Muslim',      'અજમેરા': 'Muslim',
  'મિર્ઝા': 'Muslim',      'મીરઝા': 'Muslim',     'મિરઝા': 'Muslim',   'મીરજા': 'Muslim',   'મિરજા': 'Muslim',
  'નૂરાની': 'Muslim',      'નુરાની': 'Muslim',    'નૂરાણી': 'Muslim',
  'ચિસ્તી': 'Muslim',
  'દિવાન': 'Muslim',       'દીવાન': 'Muslim',
  'ફકીર': 'Muslim',        'ફકીરી': 'Muslim',
  'છીપા': 'Muslim',
  'ગાંજા': 'Muslim',
  'બારભાયા': 'Muslim',
  'બેલિમ': 'Muslim',
  'ખંભાતી': 'Muslim',
  'બાગુશેશ': 'Muslim',     'બાણુશેશ્': 'Muslim',
  'ચાઉસ': 'Muslim',
  // Trade-name surnames — overwhelmingly Muslim (Bohra / Memon / Vohra traders) in Bhavnagar
  'કાચવાલા': 'Muslim',     'કાચવાળા': 'Muslim',   'કાંચવાલા': 'Muslim',
  'લોખંડવાલા': 'Muslim',   'લોખડવાળા': 'Muslim',  'લોખંડ્વાળા': 'Muslim',
  'ટીનવાલા': 'Muslim',     'ટિનવાલા': 'Muslim',   'ટીનવાળા': 'Muslim',   'ટિનવાળા': 'Muslim',   'તીનવાલા': 'Muslim',
  'બોરડીવાલા': 'Muslim',   'બોરડીવાળા': 'Muslim',
  'તેજાબવાલા': 'Muslim',   'તેજાબવાળા': 'Muslim',
  'લાકડાવાળા': 'Muslim',   'લાકડાવાલા': 'Muslim',
  'લાખણકાવાળા': 'Muslim',  'લાખણકાવાલા': 'Muslim','લાખણાકાવાળા': 'Muslim','લાખાણકાવાળા': 'Muslim','લાખનકાવાલા': 'Muslim',
  'સીનેમાવાળા': 'Muslim',  'સીનેમાવાલા': 'Muslim','સિનેમાવાળા': 'Muslim','સિનેમાવાલા': 'Muslim',
  'જરીવાલા': 'Muslim',     'ઝરીવાલા': 'Muslim',
  'બગસરાવાલા': 'Muslim',   'બાગસરવાલા': 'Muslim', 'બગસરાવાળા': 'Muslim',
  'જુનાગઢવાલા': 'Muslim',  'જુનાગઢવાળા': 'Muslim','જુનાગઠવાળા': 'Muslim',
  'કાનપુરવાલા': 'Muslim',  'કાનપુરવાળા': 'Muslim',
  'કાગળવાલા': 'Muslim',    'કાગલવાલા': 'Muslim',  'કાગદી': 'Muslim',
  'કાંટાવાલા': 'Muslim',   'કાંટાવાળા': 'Muslim', 'કાટાવાળા': 'Muslim',
  'દારૂવાલા': 'Muslim',
  'લીમડીવાલા': 'Muslim',   'લીમડીવાળા': 'Muslim', 'લિમડીવાલા': 'Muslim',
  'મિઠાઈવાલા': 'Muslim',   'મિઠાઇવાળા': 'Muslim', 'મિઠાઈવાળા': 'Muslim', 'મીઠાઇવાલા': 'Muslim', 'મીઠાઈવાળા': 'Muslim',
  'પાઈપવાલા': 'Muslim',    'પાઇપવાલા': 'Muslim',  'પાઈપવાળા': 'Muslim',  'પાઇપવાળા': 'Muslim',
  'પાનવાલા': 'Muslim',     'પાનવાળા': 'Muslim',
  'ચશ્માવાલા': 'Muslim',
  'ચાવીવાળા': 'Muslim',
  'ડબાવાલા': 'Muslim',     'ડબ્બાવાલા': 'Muslim',
  'ડેલીવાલા': 'Muslim',    'ડેલીવાળા': 'Muslim',
  'મહુવાવાલા': 'Muslim',   'મહુવાવાળા': 'Muslim',
  'રાજકોટવાલા': 'Muslim',  'રાજકોટિયા': 'Muslim', 'રાજ્કોટવાલા': 'Muslim', 'રાજકોટીયા': 'Muslim',
  'તાકાવાલા': 'Muslim',
  'બેહરિનવાલા': 'Muslim',  'બેહરીનવાળા': 'Muslim',
  'કોચીનવાળા': 'Muslim',   'કોચીનવાલા': 'Muslim',
  'રતલામવાલા': 'Muslim',
  'જામવાલા': 'Muslim',     'જામવાળા': 'Muslim',
  'લારીવાલા': 'Muslim',    'લારીવાળા': 'Muslim',
  'લાદીવાલા': 'Muslim',    'લાદીવાળા': 'Muslim',
  'બરફવાળા': 'Muslim',
  'ગાડીવાળા': 'Muslim',
  'દાણાવાળા': 'Muslim',
  'હાર્ડવેરવાળા': 'Muslim','હાર્ડવેર': 'Muslim',
  'ઘીયાવડવાલા': 'Muslim',  'ધીપાવડવાળા': 'Muslim',
  'ટોપીવાલા': 'Muslim',
  'ચુનાવાલા': 'Muslim',
  'બત્તીવાલા': 'Muslim',   'બતીવાલા': 'Muslim',
  'બકરીવાલા': 'Muslim',
  'સોપારીવાલા': 'Muslim',
  'ખોખાવાલા': 'Muslim',    'ખોખાવાળા': 'Muslim',
  'મોટરવાલા': 'Muslim',    'મોતીવાલા': 'Muslim',
  'હવેલીવાળા': 'Muslim',
  'સામીવાળા': 'Muslim',    'સમીવાલા': 'Muslim',
  'ફ્લેટ': 'Muslim',
  'બંધુકવાલા': 'Muslim',
  'કીઠોરીયા': 'Muslim',    'કિટોરીયા': 'Muslim',  'કોટીલા': 'Muslim',
  'કાઝી': 'Muslim',        'કદજ': 'Muslim',                                    // extra Kazi form
  'ટીનવાલા': 'Muslim',     'ટનનવદલદ': 'Muslim',                               // Tinvala (Vohra-Muslim)
  // Identified from relatives' first names (Abdul, Iqbal, Rehman, Jamal, Ashraf, Jusub)
  'ડેરેયા': 'Muslim',      'ડૅરેયા': 'Muslim',                                 // Dereya (Memon/Vohra)
  'મલહરદ': 'Muslim',       'મલ્હારા': 'Muslim',                                // Malhara
  'રકરપયદ': 'Muslim',                                                         // Raipariya (Memon) – Muslim relatives

  // ── Vania / Jain (trading / mercantile) ─────────────────────────────
  'શાહ': 'Vania / Jain',       'શદહ': 'Vania / Jain',
  'મહેતા': 'Vania / Jain',     'મહકતદ': 'Vania / Jain',
  'પારેખ': 'Vania / Jain',     'પદરકખ': 'Vania / Jain',
  'વોરા': 'Vania / Jain',      'વવરદ': 'Vania / Jain',
  'સંઘવી': 'Vania / Jain',     'સનઘવન': 'Vania / Jain',
  'ગાંધી': 'Vania / Jain',     'ગદનધન': 'Vania / Jain',
  'શેઠ': 'Vania / Jain',       'શકઠ': 'Vania / Jain',
  'દોશી': 'Vania / Jain',      'દવષન': 'Vania / Jain',     'દવશન': 'Vania / Jain',
  'કાપડિયા': 'Vania / Jain',   'કદપડનયદ': 'Vania / Jain',
  'ઝવેરી': 'Vania / Jain',     'ઝવકરન': 'Vania / Jain',
  'તુરખિયા': 'Vania / Jain',   'તનરખનયદ': 'Vania / Jain',
  'કોઠારી': 'Vania / Jain',    'કવઠદરન': 'Vania / Jain',
  'બગડિયા': 'Vania / Jain',    'બગડનયદ': 'Vania / Jain',
  // Champaneri = Soni (goldsmith)  — confirmed by local
  'સોની': 'Vania / Jain',      'સવનન': 'Vania / Jain',
  'ચાંપાનેરી': 'Vania / Jain', 'ચદનપદનકરન': 'Vania / Jain',
  'મકહતદ': 'Vania / Jain',     'મકહતા': 'Vania / Jain',    // extra Mehta garble variant
  'કદમદદર': 'Vania / Jain',    'કામદાર': 'Vania / Jain',   // Kamdar

  // ── Brahmin ─────────────────────────────────────────────────────────
  'જોષી': 'Brahmin',       'જવષન': 'Brahmin',
  'જોશી': 'Brahmin',       'જવશન': 'Brahmin',
  'ભટ્ટ': 'Brahmin',       'ભટટ': 'Brahmin',
  'ત્રિવેદી': 'Brahmin',   'ત્રનવકદન': 'Brahmin',  'ત્રિવેદિ': 'Brahmin',
  'દવે': 'Brahmin',        'દવક': 'Brahmin',
  'ઓઝા': 'Brahmin',        'ઓઝદ': 'Brahmin',
  'પંડ્યા': 'Brahmin',     'પનડયદ': 'Brahmin',
  'વ્યાસ': 'Brahmin',      'વયદસ': 'Brahmin',
  'પાઠક': 'Brahmin',       'પદઠક': 'Brahmin',
  'ઉપાધ્યાય': 'Brahmin',   'ઉપદધયદય': 'Brahmin',
  'રાવલ': 'Brahmin',       'રદવલ': 'Brahmin',
  'પુરોહિત': 'Brahmin',    'પનરવહનત': 'Brahmin',
  'શુક્લ': 'Brahmin',      'શનકલ': 'Brahmin',
  'મહર્ષિ': 'Brahmin',     'મહરષન': 'Brahmin',
  'આચાર્ય': 'Brahmin',     'આચદરય': 'Brahmin',
  'રાજ્યગુરુ': 'Brahmin',  'રદજયગનરન': 'Brahmin',
  // Extras
  'આચદયર': 'Brahmin',      // Acharya alt garble
  'જાની': 'Brahmin',        'જનન': 'Brahmin',                      // Jani
  'દેસાઈ': 'Brahmin',       'દકસદઈ': 'Brahmin',    'દકસદઇ': 'Brahmin',    // Desai (Anavil)
  'પંડ્યા': 'Brahmin',      'પનરયદ': 'Brahmin',                              // Pandya (OCR-garbled form)

  // ── Patel / Patidar ────────────────────────────────────────────────
  'પટેલ': 'Patel / Patidar', 'પટકલ': 'Patel / Patidar',
  'પાટીલ': 'Patel / Patidar','પદટનલ': 'Patel / Patidar',

  // ── Rajput / Kshatriya ─────────────────────────────────────────────
  'ગોહિલ': 'Rajput / Kshatriya',    'ગોહેલ': 'Rajput / Kshatriya',    'ગવહકલ': 'Rajput / Kshatriya',
  'પરમાર': 'Rajput / Kshatriya',    'પરમદર': 'Rajput / Kshatriya',
  'સોલંકી': 'Rajput / Kshatriya',   'સવલનકન': 'Rajput / Kshatriya',
  'ચૌહાણ': 'Rajput / Kshatriya',    'ચચહદણ': 'Rajput / Kshatriya',    'ચકહદણ': 'Rajput / Kshatriya',
  'રાઠોડ': 'Rajput / Kshatriya',    'રદઠવર': 'Rajput / Kshatriya',    'રદઠવડ': 'Rajput / Kshatriya',
  'ચુડાસમા': 'Rajput / Kshatriya',  'ચનરદસમદ': 'Rajput / Kshatriya',  'ચનડદસમદ': 'Rajput / Kshatriya',
  'વાઘેલા': 'Rajput / Kshatriya',   'વદઘકલદ': 'Rajput / Kshatriya',
  'જાડેજા': 'Rajput / Kshatriya',   'જદરકજદ': 'Rajput / Kshatriya',   'જદડકજદ': 'Rajput / Kshatriya',
  'ઝાલા': 'Rajput / Kshatriya',     'ઝદલદ': 'Rajput / Kshatriya',
  'ડાભી': 'Rajput / Kshatriya',     'રદભન': 'Rajput / Kshatriya',     'ડદભન': 'Rajput / Kshatriya',
  'બારોટ': 'Rajput / Kshatriya',    'બદરવટ': 'Rajput / Kshatriya',
  'જેઠવા': 'Rajput / Kshatriya',    'જકઠવદ': 'Rajput / Kshatriya',
  'રાણા': 'Rajput / Kshatriya',     'રદણદ': 'Rajput / Kshatriya',
  'સરવૈયા': 'Rajput / Kshatriya',   'સરવપયદ': 'Rajput / Kshatriya',
  'ડોડિયા': 'Rajput / Kshatriya',   'રવડનયદ': 'Rajput / Kshatriya',
  'ગવલહલ': 'Rajput / Kshatriya',                                    // Gohil alt garble
  'મહિડા': 'Rajput / Kshatriya',    'મહનરદ': 'Rajput / Kshatriya',   // Mahida

  // ── Lohana ─────────────────────────────────────────────────────────
  'ઠક્કર': 'Lohana',       'ઠકકર': 'Lohana',
  'કોટક': 'Lohana',        'કવટક': 'Lohana',
  'બક્ષી': 'Lohana',       'બકષન': 'Lohana',
  'ધોળકિયા': 'Lohana',     'ધવળકનયદ': 'Lohana',
  'દોઢિયા': 'Lohana',      'દવઢનયદ': 'Lohana',
  'રાજ્યાણી': 'Lohana',    'રદજયદણન': 'Lohana',
  'કેશવાણી': 'Lohana',     'કકશવદણન': 'Lohana',
  // Lohana additions
  'લાખાણી': 'Lohana',      'લદખદણન': 'Lohana',                 // Lakhani
  'રાજાણી': 'Lohana',      'રદજણન': 'Lohana',                  // Rajani
  'દેવાણી': 'Lohana',      'દકવદણન': 'Lohana',                 // Devani
  'છગનાણી': 'Lohana',      'છગનદણન': 'Lohana',                 // Chaganani
  'ભાયાણી': 'Lohana',      'ભદયદણન': 'Lohana',                 // Bhayani
  'ઘોઘારી': 'Lohana',      'ઘવઘદરન': 'Lohana',                 // Ghoghari
  // Correct-OCR forms previously missed
  'લાખાણી': 'Lohana',
  'દેવાણી': 'Lohana',
  'છગનાણી': 'Lohana',
  'ભાયાણી': 'Lohana',
  'રાજાણી': 'Lohana',
  'મેઘાણી': 'Lohana',      'મકઘદણન': 'Lohana',                  // Meghani
  'નાથાણી': 'Lohana',      'નદથદણન': 'Lohana',                  // Nathani

  // ── Koli / OBC ─────────────────────────────────────────────────────
  'મકવાણા': 'Koli / OBC',  'મકવદણદ': 'Koli / OBC',
  'બારૈયા': 'Koli / OBC',  'બદરપયદ': 'Koli / OBC',
  'બામણિયા': 'Koli / OBC', 'બદમણનયદ': 'Koli / OBC',
  'ચાવડા': 'Koli / OBC',   'ચદવડદ': 'Koli / OBC',
  'રાબરી': 'Koli / OBC',   'રદબરન': 'Koli / OBC',
  'ભરવાડ': 'Koli / OBC',   'ભરવદડ': 'Koli / OBC',
  'પ્રજાપતિ': 'Koli / OBC','પ્રજદપતન': 'Koli / OBC',  'પ્રજાપતી': 'Koli / OBC',
  'લુહાર': 'Koli / OBC',   'લનહદર': 'Koli / OBC',
  'સુતાર': 'Koli / OBC',   'સનતદર': 'Koli / OBC',
  'કુંભાર': 'Koli / OBC',  'કનનભદર': 'Koli / OBC',
  'મોચી': 'Koli / OBC',    'મવચન': 'Koli / OBC',
  'વાળા': 'Koli / OBC',    'વદળદ': 'Koli / OBC',                // Vala
  'ચાવડા': 'Koli / OBC',   'ચદવરદ': 'Koli / OBC',               // Chavda (alt garble)
  'બારેયા': 'Koli / OBC',  'બારૈયા': 'Koli / OBC',              // Baraiya (corrected OCR forms)
  // ── Additional Koli / OBC surnames (Bhavnagar Ward 6) ──
  'લંગાળીયા': 'Koli / OBC', 'લંગાળિયા': 'Koli / OBC', 'લંગાલિયા': 'Koli / OBC', 'લંગળીયા': 'Koli / OBC', 'લંગલિયા': 'Koli / OBC', 'લંગલીયા': 'Koli / OBC', 'લંગડીયા': 'Koli / OBC', 'લંગાલીયા': 'Koli / OBC', 'લાંગળીયા': 'Koli / OBC', 'લાંગાળીયા': 'Koli / OBC', 'લાંગલિયા': 'Koli / OBC',
  'ભડિયાદ્રા': 'Koli / OBC', 'ભડીયાદ્રા': 'Koli / OBC', 'ભડીયાદરા': 'Koli / OBC', 'ભડોરિયા': 'Koli / OBC', 'ભડીયાદ': 'Koli / OBC', 'ભડીયાદા': 'Koli / OBC', 'ભદીયાદ્રા': 'Koli / OBC', 'ભડિયાદ્વા': 'Koli / OBC', 'ભાડિયાદ્રા': 'Koli / OBC', 'ભાડીયાદ્રા': 'Koli / OBC', 'ભડિયાદરા': 'Koli / OBC', 'ભડોરીયા': 'Koli / OBC', 'ભડિયદ્રા': 'Koli / OBC', 'ભંડોરિયા': 'Koli / OBC',
  'ડોડીયા': 'Koli / OBC',   'ડોડિયા': 'Koli / OBC',   'ડૉડીયા': 'Koli / OBC',  'ડૉડિયા': 'Koli / OBC',
  'બિલખીયા': 'Koli / OBC',  'બીલખીયા': 'Koli / OBC',  'બિલખિયા': 'Koli / OBC', 'બિલાખીયા': 'Koli / OBC', 'બીલીખીયા': 'Koli / OBC', 'બીલખલીયા': 'Koli / OBC', 'બિખિયા': 'Koli / OBC', 'બીખિયા': 'Koli / OBC', 'બિલાખિયા': 'Koli / OBC', 'બીલાખીયા': 'Koli / OBC', 'બિલિખયા': 'Koli / OBC',
  'કુકડીયા': 'Koli / OBC',  'કુકડિયા': 'Koli / OBC',  'કુકિડયા': 'Koli / OBC', 'કુક્ડીયા': 'Koli / OBC', 'કકડીય': 'Koli / OBC', 'કોકડીયા': 'Koli / OBC', 'કોકડિયા': 'Koli / OBC', 'કુકાડિયા': 'Koli / OBC',
  'અજવાળીયા': 'Koli / OBC', 'અજવાળિયા': 'Koli / OBC', 'અજવાલિયા': 'Koli / OBC', 'અજ્વાળિયા': 'Koli / OBC', 'અજ્વાલિયા': 'Koli / OBC', 'અજવદળનયદ': 'Koli / OBC', 'અજવદલળયદ': 'Koli / OBC',
  'અંધારિયા': 'Koli / OBC', 'અંધારીયા': 'Koli / OBC', 'અંઘારીયા': 'Koli / OBC', 'અંઘારિયા': 'Koli / OBC', 'અન્ધારીયા': 'Koli / OBC', 'અન્ધારિયા': 'Koli / OBC', 'અનધદઠરયદ': 'Koli / OBC', 'અઘારીયા': 'Koli / OBC', 'અનઘદરનયદ': 'Koli / OBC', 'અનઘદદરયદ': 'Koli / OBC', 'અંઘારેરિયા': 'Koli / OBC', 'અંધારીયા': 'Koli / OBC',
  'સરધારા': 'Koli / OBC',   'સરદારા': 'Koli / OBC',   'સરઘારા': 'Koli / OBC',  'સરધદરદ': 'Koli / OBC',
  'મુંજપરા': 'Koli / OBC',  'મુજપરા': 'Koli / OBC',   'મુંજપ્રરા': 'Koli / OBC', 'મનજપરદ': 'Koli / OBC', 'મનનજપરદ': 'Koli / OBC',
  'વેગડ': 'Koli / OBC',     'વંગડ': 'Koli / OBC',
  'મેર': 'Koli / OBC',
  'રાજપુરા': 'Koli / OBC',  'રાજપૂરા': 'Koli / OBC',  'રદજપનરદ': 'Koli / OBC', 'રાંધનપુરા': 'Koli / OBC', 'રાઘનપુરા': 'Koli / OBC', 'રાધનપરા': 'Koli / OBC', 'રાંઘનપરા': 'Koli / OBC', 'રાંધનપરા': 'Koli / OBC', 'રાઁધનપુરા': 'Koli / OBC', 'રાધનપૂરા': 'Koli / OBC',
  'કંટારીયા': 'Koli / OBC', 'કટારીયા': 'Koli / OBC',  'કંટારિયા': 'Koli / OBC', 'કટારિયા': 'Koli / OBC', 'કટાર': 'Koli / OBC', 'કનટદરનયદ': 'Koli / OBC', 'કેટારીયા': 'Koli / OBC', 'ફંટારિયા': 'Koli / OBC',
  'પાટડીયા': 'Koli / OBC',  'પાટડિયા': 'Koli / OBC',  'પાટડીયા': 'Koli / OBC', 'પડધરિયા': 'Koli / OBC', 'પડધરીયા': 'Koli / OBC', 'પઢીયાર': 'Koli / OBC', 'પઢિયાર': 'Koli / OBC', 'પઢનયદર': 'Koli / OBC', 'પઢનયદર': 'Koli / OBC', 'પાડધરીયા': 'Koli / OBC', 'પધરીયા': 'Koli / OBC', 'પદ્ધરીયા': 'Koli / OBC', 'પરધઢરયદ': 'Koli / OBC', 'પરધરનયદ': 'Koli / OBC',
  'મકોડીયા': 'Koli / OBC',  'મકોડિયા': 'Koli / OBC',  'મંકોડીયા': 'Koli / OBC', 'મંકોડિયા': 'Koli / OBC',
  'સોરઠીયા': 'Koli / OBC',  'સોરઠિયા': 'Koli / OBC',  'સવરઠનયદ': 'Koli / OBC',
  'ધ્રાંગધરીયા': 'Koli / OBC','ધ્રાંગધરિયા': 'Koli / OBC','ધાંગધરિયા': 'Koli / OBC','ધ્રાગધરિયા': 'Koli / OBC','ધ્રાંગધ્રીયા': 'Koli / OBC','ધ્રાગધરીયા': 'Koli / OBC','ધ્રાગઘરિયા': 'Koli / OBC','ધાંગધ્રીયા': 'Koli / OBC','ધ્રાંગાધારિયા': 'Koli / OBC','ધ્રાંગધારિયા': 'Koli / OBC','ધ્રાંગધિયા': 'Koli / OBC','ધ્રાંગઘરીયા': 'Koli / OBC','ઘ્રાંગઘરીયા': 'Koli / OBC','ધાંગધીયા': 'Koli / OBC','ધાંગધિયા': 'Koli / OBC','ધ્રાંગક્રિયા': 'Koli / OBC','ધ્રાંગપ્રિયા': 'Koli / OBC','ધાગધરિયા': 'Koli / OBC','ઘાંગઘ્રરિયા': 'Koli / OBC','ઘાંગઘિયા': 'Koli / OBC','ઘાંગઘરિયા': 'Koli / OBC','ઘ્રાંગઘરિયા': 'Koli / OBC','ધાધીયા': 'Koli / OBC','ધાંધિયા': 'Koli / OBC','ઘાંઘીયા': 'Koli / OBC','ધ્રાંગધીયા': 'Koli / OBC','ધ્રાંગબ્રિયા': 'Koli / OBC','ધાંગપ્રિયા': 'Koli / OBC','ધાગપ્રિયા': 'Koli / OBC','ધ્રાગધિયા': 'Koli / OBC','ધાગધિયા': 'Koli / OBC','ધાગધરીયા': 'Koli / OBC','ધ્રાંગપ્રિયા': 'Koli / OBC','ધ્રાંગઘરીયા': 'Koli / OBC','ધ્રાંગઘરિયા': 'Koli / OBC','ધ્રાગઘરિયા': 'Koli / OBC','ધ્રાગધીયા': 'Koli / OBC',
  'જોગદિયા': 'Koli / OBC',  'જોગદીયા': 'Koli / OBC',  'જોગરાજીયા': 'Koli / OBC', 'જોગરાજયા': 'Koli / OBC',
  'નૈયા': 'Koli / OBC',     'નેયા': 'Koli / OBC',
  'રૈયા': 'Koli / OBC',
  'માંડલીયા': 'Koli / OBC', 'મંડલીયા': 'Koli / OBC',  'માંડલિયા': 'Koli / OBC', 'મંડલિયા': 'Koli / OBC', 'માંડળીયા': 'Koli / OBC', 'માડળીયા': 'Koli / OBC', 'માંડળિયા': 'Koli / OBC', 'મડીયા': 'Koli / OBC', 'માડલીયા': 'Koli / OBC',
  'અછડા': 'Koli / OBC',     'અચ્છડા': 'Koli / OBC',
  'જાંબુચા': 'Koli / OBC',  'જાંબા': 'Koli / OBC',    'જાંબુચા': 'Koli / OBC', 'જાબુચા': 'Koli / OBC', 'જાંબુચા': 'Koli / OBC', 'જાબુંચા': 'Koli / OBC', 'જાંચા': 'Koli / OBC', 'જાચા': 'Koli / OBC',
  'ગોડિયા': 'Koli / OBC',   'ગોડીયા': 'Koli / OBC',   'ગનદનગરદ': 'Koli / OBC', 'ગુંદિગરા': 'Koli / OBC', 'ગુંદીગરા': 'Koli / OBC', 'ગનરદળદ': 'Koli / OBC', 'ગુદીગરા': 'Koli / OBC', 'ગુંદગરા': 'Koli / OBC', 'ગંદીગરા': 'Koli / OBC', 'ગોડીયા': 'Koli / OBC',
  'માંડવિયા': 'Koli / OBC', 'માંડવીયા': 'Koli / OBC', 'મંડાવિયા': 'Koli / OBC', 'માંડ્વિયા': 'Koli / OBC', 'માંડવ્યા': 'Koli / OBC',
  'બુધેલીયા': 'Koli / OBC', 'બુધેલિયા': 'Koli / OBC', 'બધેકા': 'Koli / OBC',   'બધેલિયા': 'Koli / OBC', 'બુઢેલીયા': 'Koli / OBC',
  'ગોંડલીયા': 'Koli / OBC', 'ગોંડલિયા': 'Koli / OBC',
  'માલવિયા': 'Koli / OBC',  'માલવીયા': 'Koli / OBC',  'માલવિ': 'Koli / OBC',   'માલવી': 'Koli / OBC', 'માલાવડિયા': 'Koli / OBC', 'માલાવાડીયા': 'Koli / OBC',
  'સાકરવાડિયા': 'Koli / OBC','સાકરવાડીયા': 'Koli / OBC','સકરવાડીયા': 'Koli / OBC',
  'સીદાતર': 'Koli / OBC',   'સિદાતર': 'Koli / OBC',   'સિદાતાર': 'Koli / OBC',
  'ઠાસરીયા': 'Koli / OBC',  'ઠાસરિયા': 'Koli / OBC',
  'પાયક': 'Koli / OBC',     'પાઈક': 'Koli / OBC',    'પદઈક': 'Koli / OBC',    'પદઇક': 'Koli / OBC',
  'ગભાણી': 'Koli / OBC',
  'પઢિયાર': 'Koli / OBC',
  'રાણપરીયા': 'Koli / OBC', 'રંગપરા': 'Koli / OBC',  'રાણીંગા': 'Koli / OBC', 'રાશિંગા': 'Koli / OBC', 'રાલિંગા': 'Koli / OBC', 'રાણીગા': 'Koli / OBC', 'રાગિંગા': 'Koli / OBC',
  'હળવદીયા': 'Koli / OBC',  'હળવદિયા': 'Koli / OBC',
  'હાવલીયા': 'Koli / OBC',  'હાવલિયા': 'Koli / OBC',  'હાવળીયા': 'Koli / OBC',
  'ધંધુકીયા': 'Koli / OBC', 'ધંધુકિયા': 'Koli / OBC', 'ઘણુકીયા': 'Koli / OBC',
  'ઉચડીયા': 'Koli / OBC',  'ઉછડીયા': 'Koli / OBC',  'ઉછડિયા': 'Koli / OBC', 'ઉછરનયદ': 'Koli / OBC', 'ઉચ્ચડિયા': 'Koli / OBC', 'ઉચણીયા': 'Koli / OBC', 'ઉઠ્ઠિયા': 'Koli / OBC', 'ઉડ્ડિયા': 'Koli / OBC', 'ઉડાવિયા': 'Koli / OBC', 'ઉડેવીયા': 'Koli / OBC', 'ઉરદલવઆ': 'Koli / OBC', 'ઊંડવીયા': 'Koli / OBC',
  'કનાડા': 'Koli / OBC',    'કનાડિયા': 'Koli / OBC',  'કેનાડા': 'Koli / OBC',  'કનોડા': 'Koli / OBC',   'કનોજીયા': 'Koli / OBC', 'કનોજિયા': 'Koli / OBC',
  'દાઠીયા': 'Koli / OBC',   'દાઢીયા': 'Koli / OBC',   'દાડિયા': 'Koli / OBC',  'દાદિયા': 'Koli / OBC',  'દદિયા': 'Koli / OBC', 'ડાઠીયા': 'Koli / OBC', 'દઠિયા': 'Koli / OBC', 'દાઠિયા': 'Koli / OBC', 'ડાઢીયા': 'Koli / OBC', 'દાડીયા': 'Koli / OBC',
  'ચાવડિયા': 'Koli / OBC',
  'સીતાપરા': 'Koli / OBC',  'સિતાપરા': 'Koli / OBC',
  'કાસોદરીયા': 'Koli / OBC','કાસોદરિયા': 'Koli / OBC',
  'વાળોદરા': 'Koli / OBC',  'વાળૉદરા': 'Koli / OBC',  'વળોદરા': 'Koli / OBC',
  'મથુકિયા': 'Koli / OBC',  'માથુકીયા': 'Koli / OBC', 'માથુકિયા': 'Koli / OBC',
  'કાલવા': 'Koli / OBC',    'કાલ્વા': 'Koli / OBC',   'કોલવા': 'Koli / OBC',
  'મારૂ': 'Koli / OBC',     'મારુ': 'Koli / OBC',     'મારું': 'Koli / OBC',
  'ભલગામીયા': 'Koli / OBC', 'ભલગામિયા': 'Koli / OBC', 'ભલગદમનયદ': 'Koli / OBC',
  'મેવાડા': 'Koli / OBC',
  'જાદવ': 'Koli / OBC',     'જાદવાણી': 'Koli / OBC',  'જાદવણી': 'Koli / OBC',
  'યાદવ': 'Koli / OBC',
  'ભોગેસરા': 'Koli / OBC',  'રોજેસરા': 'Koli / OBC',  'રોજસારા': 'Koli / OBC', 'રોજસરા': 'Koli / OBC', 'રોજાસરા': 'Koli / OBC',
  'સોનછાત્રા': 'Koli / OBC',
  'જોબનપુત્રા': 'Lohana',   'જોબનપત્ર': 'Lohana',    'જોખનપુત્રા': 'Lohana', 'જોબંપુત્રા': 'Lohana',
  'સાગઠીયા': 'Koli / OBC',
  'સરવૈયા': 'Rajput / Kshatriya', 'સરવય્યા': 'Rajput / Kshatriya',
  'ગઢવી': 'Koli / OBC',     'ગઢવન': 'Koli / OBC',
  'ઠાકર': 'Koli / OBC',     'ઠાર': 'Koli / OBC',
  'બારડ': 'Koli / OBC',     // Bard
  'નગરીયા': 'Lohana',       'નગરિયા': 'Lohana',
  'ગોસ્વામી': 'Brahmin',    'ગૌસ્વામી': 'Brahmin',   'ગોસાઈ': 'Brahmin',     'ગોસાઇ': 'Brahmin',
  'બુચ': 'Brahmin',         'ધ્રુવ': 'Brahmin',      'ત્રવાડી': 'Brahmin',    'ત્રાવાડી': 'Brahmin',
  'શાસ્ત્રી': 'Brahmin',
  'પંડિત': 'Brahmin',       'પાંડે': 'Brahmin',      'પાંડવ': 'Brahmin',
  'તિવારી': 'Brahmin',      'તીવારી': 'Brahmin',     'તુવેર': 'Brahmin',
  'અધ્વર્યુ': 'Brahmin',
  'પંચોલી': 'Brahmin',      'પંચોળી': 'Brahmin',     'પંચોલિ': 'Brahmin',
  'શર્મા': 'Brahmin',       'ઘર્મા': 'Brahmin',      'ધર્મા': 'Brahmin',     'ધર્માં': 'Brahmin', 'શમાઁ': 'Brahmin', 'શમદર': 'Brahmin',
  'રાજ્યગુરુ': 'Brahmin',   'રાજ્યગુરૂ': 'Brahmin',   'રાજયગુરુ': 'Brahmin',   'રાજયગુરૂ': 'Brahmin',  'રદજયગનરન': 'Brahmin',  'રાજ્યાગુરૂ': 'Brahmin',  'રાજ્યગૂરૂ': 'Brahmin',
  'રાજગરીયા': 'Brahmin',
  'મિસ્ત્રી': 'Brahmin',    'મીસ્ત્રી': 'Brahmin',
  'જૈન': 'Vania / Jain',    'શ્રીમાળી': 'Vania / Jain',
  'મોદી': 'Vania / Jain',
  'પરીખ': 'Vania / Jain',   'પરિખ': 'Vania / Jain',  'પારખ': 'Vania / Jain',  'પારિખ': 'Vania / Jain',
  'કપાસી': 'Vania / Jain',  'કપાશી': 'Vania / Jain', 'કપાસીં': 'Vania / Jain',
  'ગજ્જર': 'Vania / Jain',  'ગજજર': 'Vania / Jain',
  'અગ્રવાલ': 'Vania / Jain','અગરવાલ': 'Vania / Jain',
  'તન્ના': 'Vania / Jain',  'તેના': 'Vania / Jain',
  'વૈદ્ય': 'Vania / Jain',  'વૈધ': 'Vania / Jain',   'વૈદ': 'Vania / Jain',
  'દફતરી': 'Vania / Jain',  'દફ્તરી': 'Vania / Jain',
  'ભાવસાર': 'Vania / Jain', 'ભાવસર': 'Vania / Jain', 'ભદવસદર': 'Vania / Jain',
  'બાવીશી': 'Vania / Jain',
  'મસાલાવાળા': 'Vania / Jain',
  'પોપટ': 'Vania / Jain',   'પન્ના': 'Vania / Jain', 'મંગૂબેન': 'Vania / Jain',
  'સુખડીયા': 'Vania / Jain','સુખડિયા': 'Vania / Jain',
  'મણિયાર': 'Muslim',       'માણિયાર': 'Muslim',    'મણીયાર': 'Muslim',     'મણીઆર': 'Muslim',      'મણિઆર': 'Muslim',     'મણિયા': 'Muslim',     'માણિયા': 'Muslim',   'મણનયદર': 'Muslim',
  'ખખ્ખર': 'Lohana',        'ખખર': 'Lohana',       'કક્કર': 'Lohana',       'ક્કર': 'Lohana',
  'મેઘાણી': 'Lohana',       'મકઘનદણન': 'Lohana',    'મેધાણી': 'Lohana',
  'નાથાણી': 'Lohana',
  'અંતાણી': 'Lohana',
  // Lohana extras
  'લાખાણી': 'Lohana',       'લાખાણી': 'Lohana',
  'રાજાણી': 'Lohana',       'રાજાની': 'Lohana',
  // Some remain ambiguous Lohana/Sindhi — pick Lohana as majority in Bhavnagar
  'ભાયાણી': 'Lohana',
  'ધોળકીયા': 'Lohana',      'ધોળકિયા': 'Lohana',    'ઘોળકીયા': 'Lohana',    'ઘોળકિયા': 'Lohana',    'ધોલકિયા': 'Lohana',  'ધોળિયા': 'Lohana',  'ધોલીયા': 'Lohana',  'ધોળીયા': 'Lohana', 'ધોળિયા': 'Lohana', 'ઘવળદકયદ': 'Lohana',
  // SC additions
  'ધાનક': 'SC / Dalit',     'થાનક': 'SC / Dalit',   'ઘાનક': 'SC / Dalit',   'ધકાણ': 'SC / Dalit',
  'ડબગર': 'SC / Dalit',
  'ડાંગર': 'SC / Dalit',
  'મકવાના': 'SC / Dalit',   'મક્વાણા': 'SC / Dalit', 'માકવાણા': 'SC / Dalit', 'મકવણા': 'SC / Dalit', 'મકવાણો': 'SC / Dalit',
  'મહેતર': 'SC / Dalit',    'મેહતર': 'SC / Dalit',   'મહંતર': 'SC / Dalit',
  // Pandya extra variants
  'પંડયા': 'Brahmin',       'પડયા': 'Brahmin',
  'ત્રિવેદિ': 'Brahmin',    'ત્રીવેદી': 'Brahmin',  'ત્રીવેદિ': 'Brahmin',
  'ગોહીલ': 'Rajput / Kshatriya', 'ગોહલ': 'Rajput / Kshatriya', 'ગૌહેલ': 'Rajput / Kshatriya', 'ગોહેંલ': 'Rajput / Kshatriya', 'ગવહનલ': 'Rajput / Kshatriya',
  'ચોહાણ': 'Rajput / Kshatriya', 'ચૌહાન': 'Rajput / Kshatriya',  'ચૌંહાણ': 'Rajput / Kshatriya', 'ચોહાણ્': 'Rajput / Kshatriya', 'ચનહદણ': 'Rajput / Kshatriya', 'ચવહદણ': 'Rajput / Kshatriya', 'ચસહદણ': 'Rajput / Kshatriya', 'ચમહદણ': 'Rajput / Kshatriya', 'ચહવદણ': 'Rajput / Kshatriya',
  'રાઠૌડ': 'Rajput / Kshatriya', 'રાઠૉડ': 'Rajput / Kshatriya',
  'મહીડા': 'Rajput / Kshatriya', 'મહિદા': 'Rajput / Kshatriya',
  'વાધેલા': 'Rajput / Kshatriya',
  'જાલા': 'Rajput / Kshatriya', 'જડેજા': 'Rajput / Kshatriya',
  'સૉલંકી': 'Rajput / Kshatriya', 'સોલકી': 'Rajput / Kshatriya', 'સોંલકી': 'Rajput / Kshatriya', 'સોંડાગર': 'Vania / Jain', 'સોનેસરા': 'Vania / Jain',  'સોનેજી': 'Vania / Jain',
  'ચુડેસરા': 'Rajput / Kshatriya', 'ચુડેસારા': 'Rajput / Kshatriya', 'ચડાસમા': 'Rajput / Kshatriya',
  'ગાયકવાડ': 'Koli / OBC',  'જાધવ': 'Koli / OBC',   'વર્મા': 'Koli / OBC',   'કુશવાહ': 'Koli / OBC', 'કુશવાહા': 'Koli / OBC', 'મેવાણી': 'Koli / OBC',
  'ગઢવી': 'Koli / OBC',     'બરડાઈ': 'Koli / OBC',  'બરડાઇ': 'Koli / OBC',
  'કસારા': 'Koli / OBC',    'કંસારા': 'Koli / OBC',
  'પટ્ટણી': 'Koli / OBC',   'પટટણી': 'Koli / OBC',  'પટણી': 'Koli / OBC',    'પટટણન': 'Koli / OBC',
  // Extra Brahmins
  'વૈષ્ણવ': 'Brahmin',      'વૈષ્નવ': 'Brahmin',    'વપષણવ': 'Brahmin',
  'નાગર': 'Brahmin',        'વૈશ્નવ': 'Brahmin',
  // Vania extras
  'નાણાવટી': 'Vania / Jain','પટવા': 'Vania / Jain', 'મહેંદીરઝા': 'Muslim',  // Mehendirza
  'મજમુદાર': 'Brahmin',
  'ઝાંઝરૂકિયા': 'Vania / Jain', 'ઝીંઝુવાડીયા': 'Vania / Jain',
  // Additional misc OBC
  'સોડા': 'Koli / OBC',     'સોઢા': 'SC / Dalit',   'સૂમરા': 'Muslim',  'સુમરા': 'Muslim',
  'ઠાકર': 'Koli / OBC',     'ધ્રાંગક્રિયા': 'Koli / OBC',
  'વાઘોશી': 'Muslim',       'ઘોઘારી': 'Lohana',    'ધોધારી': 'Lohana',      'ઘવઘદરન': 'Lohana',    'ઘોઘરી': 'Lohana',     'ઘ્રોગારી': 'Lohana',

  // ── SC / Dalit ─────────────────────────────────────────────────────
  'વાંકર': 'SC / Dalit',   'વદનકર': 'SC / Dalit',
  'ચમાર': 'SC / Dalit',    'ચમદર': 'SC / Dalit',
  'હરિજન': 'SC / Dalit',   'હરનજન': 'SC / Dalit',
  'રોહિત': 'SC / Dalit',   'રવહનત': 'SC / Dalit',
  'ડાંગર': 'SC / Dalit',   'રદનગર': 'SC / Dalit',   'ડદનગર': 'SC / Dalit',
  'સેનમા': 'SC / Dalit',   'સકનમદ': 'SC / Dalit',
  'સોઢા': 'SC / Dalit',    'સવઢદ': 'SC / Dalit',
  'પરમાર્ક': 'SC / Dalit', 'પરમદરક': 'SC / Dalit',
  'મહેતર': 'SC / Dalit',   'મહકતર': 'SC / Dalit',               // Mehtar (Valmiki)

  // ── Sindhi ─────────────────────────────────────────────────────────
  'આડવાણી': 'Sindhi',      'આડવદણન': 'Sindhi',
  'ચાંડવાણી': 'Sindhi',    'ચદનડવદણન': 'Sindhi',
  'મખીજાણી': 'Sindhi',     'મખનજદણન': 'Sindhi',
  'વાધવાણી': 'Sindhi',     'વદધવદણન': 'Sindhi',                // Vadhvani

  // ── Batch-added from others_to_classify.xlsx ──
  'ડેરૈયા': 'Muslim',
  'ડૅરૈયા': 'Muslim',
  'મેતર': 'Muslim',
  'રંગવાળા': 'Muslim',
  'આગરિયા': 'Muslim',
  'સારાણી': 'Muslim',
  'કાપડીયા': 'Muslim',
  'આગરીયા': 'Muslim',
  'વસાયા': 'Muslim',
  'ઘોઘાબોરી': 'Muslim',
  'દસાડીયા': 'Muslim',
  'કાબરીયા': 'Muslim',
  'મરચંટ': 'Muslim',
  'અલાણા': 'Muslim',
  'કાળવાતર': 'Muslim',
  'કળદોરીયા': 'Muslim',
  'વકીલ': 'Muslim',
  'લાતીવાલા': 'Muslim',
  'ખોલીયા': 'Muslim',
  'ગઢીયા': 'Muslim',
  'રંગરેજ': 'Muslim',
  'ચોકીયા': 'Muslim',
  'રાધનપુરા': 'Muslim',
  'બોળાતર': 'Muslim',
  'કુરૈશી': 'Muslim',
  'બાહલવાન': 'Muslim',
  'પરાસડા': 'Muslim',
  'લાઠીવાલા': 'Muslim',
  'સેતા': 'Muslim',
  'કડપી': 'Muslim',
  'લોટા': 'Muslim',
  'લાંડા': 'Muslim',
  'સમા': 'Muslim',
  'સુબા': 'Muslim',
  'પરાસરા': 'Muslim',
  'પાંચા': 'Muslim',
  'ગાહા': 'Muslim',
  'બુકેરા': 'Muslim',
  'જાળીયા': 'Muslim',
  'લોટિયા': 'Muslim',
  'હીરવાલા': 'Muslim',
  'કાકાણી': 'Muslim',
  'મુખી': 'Muslim',
  'માકડા': 'Muslim',
  'તુર્કી': 'Muslim',
  'આઢીયા': 'Muslim',
  'મર્ચન્ટ': 'Muslim',
  'અંતરી': 'Muslim',
  'કળદોરિયા': 'Muslim',
  'હંજડા': 'Muslim',
  'કલદોરીયા': 'Muslim',
  'રજાકભાઈ': 'Muslim',
  'કલ્યાણી': 'Muslim',
  'ધોધાબોરી': 'Muslim',
  'હબીબાણી': 'Muslim',
  'મકાની': 'Muslim',
  'ચુગડા': 'Muslim',
  'તેલીયા': 'Muslim',
  'ગઢેરા': 'Muslim',
  'ચારોલીયા': 'Muslim',
  'ભડા': 'Muslim',
  'બાવાણી': 'Muslim',
  'માંકડા': 'Muslim',
  'ઉંચડીયા': 'Muslim',
  'સલીમભાઈ': 'Muslim',
  'અમીનભાઈ': 'Muslim',
  'કલદોરિયા': 'Muslim',
  'ભલ્લા': 'Muslim',
  'અંસારી': 'Muslim',
  'મીઠાણી': 'Muslim',
  'જરગેલા': 'Muslim',
  'મમરાવાલા': 'Muslim',
  'ધનકોટ': 'Muslim',
  'રૂપાણી': 'Muslim',
  'અબમુબરીક': 'Muslim',
  'લાડા': 'Muslim',
  'મધરા': 'Muslim',
  'પ્રોફેસર': 'Muslim',
  'બાતવીલ': 'Muslim',
  'યુસુફભાઈ': 'Muslim',
  'સાહિલ': 'Muslim',
  'સેલિયા': 'Muslim',
  'પીઠડિયા': 'Muslim',
  'કકલ': 'Muslim',
  'ઇકબાલભાઈ': 'Muslim',
  'રહીમભાઈ': 'Muslim',
  'આજાબ': 'Muslim',
  'કગથરા': 'Muslim',
  'લોંડીયા': 'Muslim',
  'ડૅયા': 'Muslim',
  'જીગર': 'Muslim',
  'પ્રમાણી': 'Muslim',
  'કાથીવાલા': 'Muslim',
  'તેલિયા': 'Muslim',
  'યાફાઈ': 'Muslim',
  'કિકાણી': 'Muslim',
  'રસભર્યા': 'Muslim',
  'અલમુબ્રિક': 'Muslim',
  'મીયાવા': 'Muslim',
  'મોમિન': 'Muslim',
  'છત્તરિયા': 'Muslim',
  'હાસમાણી': 'Muslim',
  'રાઉમા': 'Muslim',
  'કાલાવાડીયા': 'Muslim',
  'ઇલ્યાસભાઈ': 'Muslim',
  'હનીફભાઈ': 'Muslim',
  'બીલિખયા': 'Muslim',
  'ઉસડીયા': 'Muslim',
  'સેરસીયા': 'Muslim',
  'ડૈરેયા': 'Muslim',
  'શેલોત': 'Muslim',
  'આકબાણી': 'Muslim',
  'મોભ': 'Muslim',
  'દલ': 'Muslim',
  'ઇલીયાસભાઈ': 'Muslim',
  'કાનીયા': 'Muslim',
  'સિરાજભાઈ': 'Muslim',
  'વાંકાનેરી': 'Muslim',
  'જાકા': 'Muslim',
  'રવજીયાણી': 'Muslim',
  'કલીવાલા': 'Muslim',
  'અમીરી': 'Muslim',
  'મીન્સારીયા': 'Muslim',
  'દાઉદાની': 'Muslim',
  'બોદીલા': 'Muslim',
  'સુધારા': 'Muslim',
  'અશારીયા': 'Muslim',
  'ટીનાવાલા': 'Muslim',
  'લવખનરવદલદ': 'Muslim',
  'બાજેર': 'Muslim',
  'ખલ્યાણી': 'Muslim',
  'કથીરી': 'Muslim',
  'હિરવાલા': 'Muslim',
  'ગુરુજી': 'Muslim',
  'લૈયા': 'Muslim',
  'લોયા': 'Muslim',

  // ── Batch-added from others_to_classify.xlsx ──
  'ડેરૈયા': 'Muslim',
  'ડૅરૈયા': 'Muslim',
  'મેતર': 'Muslim',
  'રંગવાળા': 'Muslim',
  'આગરિયા': 'Muslim',
  'સારાણી': 'Muslim',
  'કાપડીયા': 'Muslim',
  'આગરીયા': 'Muslim',
  'વસાયા': 'Muslim',
  'ઘોઘાબોરી': 'Muslim',
  'દસાડીયા': 'Muslim',
  'કાબરીયા': 'Muslim',
  'મરચંટ': 'Muslim',
  'અલાણા': 'Muslim',
  'કાળવાતર': 'Muslim',
  'કળદોરીયા': 'Muslim',
  'વકીલ': 'Muslim',
  'લાતીવાલા': 'Muslim',
  'ખોલીયા': 'Muslim',
  'ગઢીયા': 'Muslim',
  'રંગરેજ': 'Muslim',
  'ચોકીયા': 'Muslim',
  'રાધનપુરા': 'Muslim',
  'બોળાતર': 'Muslim',
  'કુરૈશી': 'Muslim',
  'બાહલવાન': 'Muslim',
  'પરાસડા': 'Muslim',
  'લાઠીવાલા': 'Muslim',
  'સેતા': 'Muslim',
  'કડપી': 'Muslim',
  'લોટા': 'Muslim',
  'લાંડા': 'Muslim',
  'સમા': 'Muslim',
  'સુબા': 'Muslim',
  'પરાસરા': 'Muslim',
  'પાંચા': 'Muslim',
  'ગાહા': 'Muslim',
  'બુકેરા': 'Muslim',
  'જાળીયા': 'Muslim',
  'લોટિયા': 'Muslim',
  'હીરવાલા': 'Muslim',
  'કાકાણી': 'Muslim',
  'મુખી': 'Muslim',
  'માકડા': 'Muslim',
  'તુર્કી': 'Muslim',
  'આઢીયા': 'Muslim',
  'મર્ચન્ટ': 'Muslim',
  'અંતરી': 'Muslim',
  'કળદોરિયા': 'Muslim',
  'હંજડા': 'Muslim',
  'કલદોરીયા': 'Muslim',
  'રજાકભાઈ': 'Muslim',
  'કલ્યાણી': 'Muslim',
  'ધોધાબોરી': 'Muslim',
  'હબીબાણી': 'Muslim',
  'મકાની': 'Muslim',
  'ચુગડા': 'Muslim',
  'તેલીયા': 'Muslim',
  'ગઢેરા': 'Muslim',
  'ચારોલીયા': 'Muslim',
  'ભડા': 'Muslim',
  'બાવાણી': 'Muslim',
  'માંકડા': 'Muslim',
  'ઉંચડીયા': 'Muslim',
  'સલીમભાઈ': 'Muslim',
  'અમીનભાઈ': 'Muslim',
  'કલદોરિયા': 'Muslim',
  'ભલ્લા': 'Muslim',
  'અંસારી': 'Muslim',
  'મીઠાણી': 'Muslim',
  'જરગેલા': 'Muslim',
  'મમરાવાલા': 'Muslim',
  'ધનકોટ': 'Muslim',
  'રૂપાણી': 'Muslim',
  'અબમુબરીક': 'Muslim',
  'લાડા': 'Muslim',
  'મધરા': 'Muslim',
  'પ્રોફેસર': 'Muslim',
  'બાતવીલ': 'Muslim',
  'યુસુફભાઈ': 'Muslim',
  'સાહિલ': 'Muslim',
  'સેલિયા': 'Muslim',
  'પીઠડિયા': 'Muslim',
  'કકલ': 'Muslim',
  'ઇકબાલભાઈ': 'Muslim',
  'રહીમભાઈ': 'Muslim',
  'આજાબ': 'Muslim',
  'કગથરા': 'Muslim',
  'લોંડીયા': 'Muslim',
  'ડૅયા': 'Muslim',
  'જીગર': 'Muslim',
  'પ્રમાણી': 'Muslim',
  'કાથીવાલા': 'Muslim',
  'તેલિયા': 'Muslim',
  'યાફાઈ': 'Muslim',
  'કિકાણી': 'Muslim',
  'રસભર્યા': 'Muslim',
  'અલમુબ્રિક': 'Muslim',
  'મીયાવા': 'Muslim',
  'મોમિન': 'Muslim',
  'છત્તરિયા': 'Muslim',
  'હાસમાણી': 'Muslim',
  'રાઉમા': 'Muslim',
  'કાલાવાડીયા': 'Muslim',
  'ઇલ્યાસભાઈ': 'Muslim',
  'હનીફભાઈ': 'Muslim',
  'બીલિખયા': 'Muslim',
  'ઉસડીયા': 'Muslim',
  'સેરસીયા': 'Muslim',
  'ડૈરેયા': 'Muslim',
  'શેલોત': 'Muslim',
  'આકબાણી': 'Muslim',
  'મોભ': 'Muslim',
  'દલ': 'Muslim',
  'ઇલીયાસભાઈ': 'Muslim',
  'કાનીયા': 'Muslim',
  'સિરાજભાઈ': 'Muslim',
  'વાંકાનેરી': 'Muslim',
  'જાકા': 'Muslim',
  'રવજીયાણી': 'Muslim',
  'કલીવાલા': 'Muslim',
  'અમીરી': 'Muslim',
  'મીન્સારીયા': 'Muslim',
  'દાઉદાની': 'Muslim',
  'બોદીલા': 'Muslim',
  'સુધારા': 'Muslim',
  'અશારીયા': 'Muslim',
  'ટીનાવાલા': 'Muslim',
  'લવખનરવદલદ': 'Muslim',
  'બાજેર': 'Muslim',
  'ખલ્યાણી': 'Muslim',
  'કથીરી': 'Muslim',
  'હિરવાલા': 'Muslim',
  'ગુરુજી': 'Muslim',
  'લૈયા': 'Muslim',
  'લોયા': 'Muslim',

  // ── Batch-added from others_to_classify.xlsx ──
  'ડેરૈયા': 'Muslim',
  'ડૅરૈયા': 'Muslim',
  'મોદન': 'Muslim',
  'મેતર': 'Muslim',
  'રંગવાળા': 'Muslim',
  'ગુજરાતી': 'Muslim',
  'આગરિયા': 'Muslim',
  'સારાણી': 'Muslim',
  'ભારમલ': 'Muslim',
  'આગરીયા': 'Muslim',
  'વસાયા': 'Muslim',
  'ઘોઘાબોરી': 'Muslim',
  'દસાડીયા': 'Muslim',
  'કાબરીયા': 'Muslim',
  'મરચંટ': 'Muslim',
  'અલાણા': 'Muslim',
  'કાળવાતર': 'Muslim',
  'કળદોરીયા': 'Muslim',
  'મતવા': 'Muslim',
  'વકીલ': 'Muslim',
  'લાતીવાલા': 'Muslim',
  'ખોલીયા': 'Muslim',
  'ગઢીયા': 'Muslim',
  'રંગરેજ': 'Muslim',
  'દેખૈયા': 'Muslim',
  'ચોકીયા': 'Muslim',
  'રાધનપુરા': 'Muslim',
  'બોળાતર': 'Muslim',
  'કુરૈશી': 'Muslim',
  'હાલારી': 'Muslim',
  'બાહલવાન': 'Muslim',
  'પરાસડા': 'Muslim',
  'લાઠીવાલા': 'Muslim',
  'સેતા': 'Muslim',
  'કડપી': 'Muslim',
  'લોટા': 'Muslim',
  'લાંડા': 'Muslim',
  'સમા': 'Muslim',
  'સુબા': 'Muslim',
  'પરાસરા': 'Muslim',
  'પાંચા': 'Muslim',
  'ગાહા': 'Muslim',
  'બુકેરા': 'Muslim',
  'જાળીયા': 'Muslim',
  'લોટિયા': 'Muslim',
  'હીરવાલા': 'Muslim',
  'કાકાણી': 'Muslim',
  'મુખી': 'Muslim',
  'માકડા': 'Muslim',
  'તુર્કી': 'Muslim',
  'આઢીયા': 'Muslim',
  'મર્ચન્ટ': 'Muslim',
  'અંતરી': 'Muslim',
  'કળદોરિયા': 'Muslim',
  'હંજડા': 'Muslim',
  'કલદોરીયા': 'Muslim',
  'રજાકભાઈ': 'Muslim',
  'કલ્યાણી': 'Muslim',
  'ધોધાબોરી': 'Muslim',
  'હબીબાણી': 'Muslim',
  'મકાની': 'Muslim',
  'ચુગડા': 'Muslim',
  'તેલીયા': 'Muslim',
  'ગઢેરા': 'Muslim',
  'યુનુસભાઈ': 'Muslim',
  'ચારોલીયા': 'Muslim',
  'ભડા': 'Muslim',
  'બાવાણી': 'Muslim',
  'માંકડા': 'Muslim',
  'ઉંચડીયા': 'Muslim',
  'સલીમભાઈ': 'Muslim',
  'અમીનભાઈ': 'Muslim',
  'કલદોરિયા': 'Muslim',
  'ભલ્લા': 'Muslim',
  'અંસારી': 'Muslim',
  'મીઠાણી': 'Muslim',
  'જરગેલા': 'Muslim',
  'મમરાવાલા': 'Muslim',
  'ધનકોટ': 'Muslim',
  'અગરિયા': 'Muslim',
  'રૂપાણી': 'Muslim',
  'અબમુબરીક': 'Muslim',
  'ખિમાણી': 'Muslim',
  'સોરા': 'Muslim',
  'લાડા': 'Muslim',
  'મધરા': 'Muslim',
  'પ્રોફેસર': 'Muslim',
  'બાતવીલ': 'Muslim',
  'યુસુફભાઈ': 'Muslim',
  'સાહિલ': 'Muslim',
  'સેલિયા': 'Muslim',
  'પીઠડિયા': 'Muslim',
  'કકલ': 'Muslim',
  'ઇકબાલભાઈ': 'Muslim',
  'રહીમભાઈ': 'Muslim',
  'આજાબ': 'Muslim',
  'કગથરા': 'Muslim',
  'લોંડીયા': 'Muslim',
  'ડૅયા': 'Muslim',
  'જીગર': 'Muslim',
  'પ્રમાણી': 'Muslim',
  'કાથીવાલા': 'Muslim',
  'તેલિયા': 'Muslim',
  'બસરાવાલા': 'Muslim',
  'ભિમાણિ': 'Muslim',
  'યાફાઈ': 'Muslim',
  'પેંતી': 'Muslim',
  'કિકાણી': 'Muslim',
  'રાજન': 'Muslim',
  'રસભર્યા': 'Muslim',
  'અલમુબ્રિક': 'Muslim',
  'મીયાવા': 'Muslim',
  'મોમિન': 'Muslim',
  'છત્તરિયા': 'Muslim',
  'હાસમાણી': 'Muslim',
  'ગઢનયદ': 'Muslim',
  'રાઉમા': 'Muslim',
  'કાલાવાડીયા': 'Muslim',
  'ઇલ્યાસભાઈ': 'Muslim',
  'હનીફભાઈ': 'Muslim',
  'બીલિખયા': 'Muslim',
  'ઉસડીયા': 'Muslim',
  'સેરસીયા': 'Muslim',
  'ડૈરેયા': 'Muslim',
  'શેલોત': 'Muslim',
  'આકબાણી': 'Muslim',
  'મોભ': 'Muslim',
  'દલ': 'Muslim',
  'ઇલીયાસભાઈ': 'Muslim',
  'કાનીયા': 'Muslim',
  'સિરાજભાઈ': 'Muslim',
  'વાંકાનેરી': 'Muslim',
  'જાકા': 'Muslim',
  'રવજીયાણી': 'Muslim',
  'કલીવાલા': 'Muslim',
  'અમીરી': 'Muslim',
  'મીન્સારીયા': 'Muslim',
  'દાઉદાની': 'Muslim',
  'બોદીલા': 'Muslim',
  'સુધારા': 'Muslim',
  'અશારીયા': 'Muslim',
  'ટીનાવાલા': 'Muslim',
  'લવખનરવદલદ': 'Muslim',
  'બાજેર': 'Muslim',
  'ખલ્યાણી': 'Muslim',
  'કથીરી': 'Muslim',
  'હિરવાલા': 'Muslim',
  'ગુરુજી': 'Muslim',
  'લૈયા': 'Muslim',
  'લોયા': 'Muslim',
  'મેહતા': 'Brahmin',
  'રાવળ': 'Brahmin',
  'શુકલ': 'Brahmin',
  'પંચાલ': 'Brahmin',
  'માંકડ': 'Brahmin',
  'રેવલીયા': 'Brahmin',
  'જયસ્વાલ': 'Brahmin',
  'ક્ષીરસાગર': 'Brahmin',
  'ભટ': 'Brahmin',
  'પડાયા': 'Brahmin',
  'વાહ': 'Brahmin',
  'માંગુકિયા': 'Brahmin',
  'ઓજા': 'Brahmin',
  'દાણી': 'Brahmin',
  'કનૈયા': 'Brahmin',
  'ભગત': 'Brahmin',
  'નિમ્બાર્ક': 'Brahmin',
  'ભાસ્કર': 'Brahmin',
  'અબજાણી': 'Brahmin',
  'દુબે': 'Brahmin',
  'નાંદવા': 'Brahmin',
  'ઉપાઘ્યાય': 'Brahmin',
  'છાયા': 'Brahmin',
  'લોલીયાણા': 'Brahmin',
  'ગોળવલકર': 'Brahmin',
  'પલાણ': 'Brahmin',
  'માથુર': 'Brahmin',
  'હિંગુ': 'Brahmin',
  'ચાતુર્વેદી': 'Brahmin',
  'શુકલા': 'Brahmin',
  'ભોજક': 'Brahmin',
  'મજીઠીયા': 'Vania / Jain',
  'ગાંઘી': 'Vania / Jain',
  'ગોરડીયા': 'Vania / Jain',
  'અગ્રાવત': 'Vania / Jain',
  'કાપડીયા': 'Vania / Jain',
  'દેસાઇ': 'Vania / Jain',
  'માંગુકીયા': 'Vania / Jain',
  'કવા': 'Vania / Jain',
  'સાપરીયા': 'Vania / Jain',
  'લાઠીયા': 'Vania / Jain',
  'કહદર': 'Vania / Jain',
  'દુધીયા': 'Vania / Jain',
  'વાસા': 'Vania / Jain',
  'વારૈયા': 'Vania / Jain',
  'ગોરડિયા': 'Vania / Jain',
  'નવાપરા': 'Vania / Jain',
  'સંઘરાજકા': 'Vania / Jain',
  'દામાણી': 'Vania / Jain',
  'ખંધેડિયા': 'Vania / Jain',
  'નાગદેવ': 'Vania / Jain',
  'કનાડીયા': 'Vania / Jain',
  'સંઘાણી': 'Vania / Jain',
  'ગોસળીયા': 'Vania / Jain',
  'રેવલિયા': 'Vania / Jain',
  'કંકુવાળા': 'Vania / Jain',
  'વડોદરીયા': 'Vania / Jain',
  'ભંડારી': 'Vania / Jain',
  'દોષી': 'Vania / Jain',
  'ગોઘારી': 'Vania / Jain',
  'ખંધેડીયા': 'Vania / Jain',
  'વળીયા': 'Vania / Jain',
  'યાજ્ઞીક': 'Vania / Jain',
  'સંધવી': 'Vania / Jain',
  'દીક્ષીત': 'Vania / Jain',
  'વડોદરિયા': 'Vania / Jain',
  'ખંઘેડીયા': 'Vania / Jain',
  'વસાવડા': 'Vania / Jain',
  'મોરી': 'Rajput / Kshatriya',
  'વાજા': 'Rajput / Kshatriya',
  'ટાંક': 'Rajput / Kshatriya',
  'પડીયા': 'Rajput / Kshatriya',
  'ખત્રી': 'Rajput / Kshatriya',
  'ભાલાલા': 'Rajput / Kshatriya',
  'નાકીયા': 'Rajput / Kshatriya',
  'ગુપ્તા': 'Rajput / Kshatriya',
  'સાગર': 'Rajput / Kshatriya',
  'સિસોદીયા': 'Rajput / Kshatriya',
  'ભાટીયા': 'Rajput / Kshatriya',
  'કલોતરા': 'Rajput / Kshatriya',
  'હાડા': 'Rajput / Kshatriya',
  'ખુમાણ': 'Rajput / Kshatriya',
  'રાઓલ': 'Rajput / Kshatriya',
  'ઘેલડા': 'Rajput / Kshatriya',
  'ચાપાનેરી': 'Soni',
  'માણીયા': 'Soni',
  'સુવંદા': 'Soni',
  'કાણકીયા': 'Soni',
  'કાણકિયા': 'Soni',
  'નાગપાલ': 'Soni',
  'વાવડીયા': 'Soni',
  'રામાનુજ': 'Soni',
  'સુંગધ': 'Soni',
  'વાવડિયા': 'Soni',
  'સેજપાલ': 'Soni',
  'નાવડિયા': 'Soni',
  'દિહોરા': 'Koli / OBC',
  'લકુમ': 'Koli / OBC',
  'શિયાળ': 'Koli / OBC',
  'કેદારી': 'Koli / OBC',
  'સાટીયા': 'Koli / OBC',
  'ભાગ્યા': 'Koli / OBC',
  'આલગોતર': 'Koli / OBC',
  'ભુત': 'Koli / OBC',
  'બાંભણીયા': 'Koli / OBC',
  'ડબલા': 'Koli / OBC',
  'મીઠાપરા': 'Koli / OBC',
  'જમોડ': 'Koli / OBC',
  'મુની': 'Koli / OBC',
  'ચારણીયા': 'Koli / OBC',
  'કાછેલા': 'Koli / OBC',
  'મતિયા': 'Koli / OBC',
  'દીહોરા': 'Koli / OBC',
  'જોધાણી': 'Koli / OBC',
  'હકાણી': 'Koli / OBC',
  'સધવા': 'Koli / OBC',
  'ગુરીયા': 'Koli / OBC',
  'ભુંગળીયા': 'Koli / OBC',
  'બાબરીયા': 'Koli / OBC',
  'ગોલાણીયા': 'Koli / OBC',
  'સાદડીયા': 'Koli / OBC',
  'દેવમુરારી': 'Koli / OBC',
  'ચિત્રોડા': 'Koli / OBC',
  'માંગુડા': 'Koli / OBC',
  'જગદીશભાઈ': 'Koli / OBC',
  'હરીયાણી': 'Koli / OBC',
  'કણજારા': 'Koli / OBC',
  'બાંભણિયા': 'Koli / OBC',
  'વેલારી': 'Koli / OBC',
  'નીમાવત': 'Koli / OBC',
  'નિમાવત': 'Koli / OBC',
  'વૈઠા': 'Koli / OBC',
  'સોમપુરા': 'Koli / OBC',
  'ધાપા': 'Koli / OBC',
  'મજીઠિયા': 'Koli / OBC',
  'કાચા': 'Koli / OBC',
  'ઠાઠાગર': 'Koli / OBC',
  'હડીયલ': 'Koli / OBC',
  'ઓધારિયા': 'Koli / OBC',
  'ઠુમ્મર': 'Koli / OBC',
  'જય': 'Koli / OBC',
  'ઘાપા': 'Koli / OBC',
  'બારીયા': 'Koli / OBC',
  'મોજીદ્રા': 'Koli / OBC',
  'ભીલ': 'Koli / OBC',
  'સિદ્ધપુરા': 'Koli / OBC',
  'સાળકિયા': 'Patel / Patidar',
  'સાળકીયા': 'Patel / Patidar',
  'વાઘાણી': 'Patel / Patidar',
  'કળથીયા': 'Patel / Patidar',
  'રેવાર': 'Patel / Patidar',
  'કુંભાણી': 'Patel / Patidar',
  'દાવડા': 'Patel / Patidar',
  'ગુડાળા': 'Patel / Patidar',
  'આસરા': 'Patel / Patidar',
  'આશરા': 'Patel / Patidar',
  'લાઠીગરા': 'Patel / Patidar',
  'ગોરજીયા': 'Patel / Patidar',
  'કલીવડા': 'Patel / Patidar',
  'ખીલોસીયા': 'Patel / Patidar',
  'ધુમડીયા': 'Patel / Patidar',
  'પડિયા': 'Patel / Patidar',
  'બરોલીયા': 'Patel / Patidar',
  'માકડિયા': 'Patel / Patidar',
  'ગોલાણી': 'Patel / Patidar',
  'અઢીયા': 'Patel / Patidar',
  'ટંકારીયા': 'Patel / Patidar',
  'પરબીયા': 'Patel / Patidar',
  'ધુમડિયા': 'Patel / Patidar',
  'દુધિયા': 'Patel / Patidar',
  'ભાલિયા': 'Patel / Patidar',
  'ભાલીયા': 'Patel / Patidar',
  'સાવડીયા': 'Patel / Patidar',
  'સાવડિયા': 'Patel / Patidar',
  'ચાવડીયા': 'Patel / Patidar',
  'ચોપડા': 'Patel / Patidar',
  'લખતરીયા': 'Patel / Patidar',
  'કળગથરા': 'Patel / Patidar',
  'કંકોશીયા': 'Patel / Patidar',
  'ઈટાલિયા': 'Patel / Patidar',
  'તલસાણીયા': 'Patel / Patidar',
  'કળથિયા': 'Patel / Patidar',
  'વિરડિયા': 'Patel / Patidar',
  'ગોટી': 'Patel / Patidar',
  'ગઢિયા': 'Patel / Patidar',
  'લાખણકીયા': 'Patel / Patidar',
  'કણઝરીયા': 'Patel / Patidar',
  'વિઠ્ઠલપુરા': 'Patel / Patidar',
  'સેંતા': 'Patel / Patidar',
  'કોટડીયા': 'Patel / Patidar',
  'પટોળીયા': 'Patel / Patidar',
  'ઉમરાળીયા': 'Patel / Patidar',
  'કોરડીયા': 'Patel / Patidar',
  'પીઠડીયા': 'Patel / Patidar',
  'કુવાડ': 'Patel / Patidar',
  'ડોબરીયા': 'Patel / Patidar',
  'બોરીચા': 'Ahir',
  'વાગડીયા': 'Ahir',
  'વાગડિયા': 'Ahir',
  'દરડી': 'Ahir',
  'બોરિચા': 'Ahir',
  'સભાડ': 'Ahir',
  'રેવર': 'Ahir',
  'સુગંધ': 'Khatri',
  'ધાંગધરીયા': 'Khatri',
  'બોસમીયા': 'Khatri',
  'કપૂર': 'Khatri',
  'ઘરણીયા': 'Khatri',
  'કપુર': 'Khatri',
  'છાટબાર': 'Khatri',
  'માલીયા': 'Khatri',
  'કીકાણી': 'Lohana',
  'ગણાત્રા': 'Lohana',
  'ચોલેરા': 'Lohana',
  'લોહાણા': 'Lohana',
  'ટોકલે': 'Lohana',
  'લુહાણા': 'Lohana',
  'ગોવાણી': 'Lohana',
  'ઠકરાર': 'Lohana',
  'કારીયા': 'Lohana',
  'મગીયા': 'Lohana',
  'મશરુ': 'Lohana',
  'માણેક': 'Lohana',
  'ખાટસુરીયા': 'Lohana',
  'મશરૂ': 'Lohana',
  'રૂપારેલીયા': 'Lohana',
  'ઘુમડીયા': 'SC / Dalit',
  'વાઢેર': 'SC / Dalit',
  'ટીમાણીયા': 'SC / Dalit',
  'ભેડા': 'SC / Dalit',
  'બગડા': 'SC / Dalit',
  'બોરીસા': 'SC / Dalit',
  'વડેરા': 'SC / Dalit',
  'ચૌધરી': 'SC / Dalit',
  'રાયકંગોર': 'Sikh',
  'સોહલા': 'Bharwad',
  'છાંટબાર': 'Bharwad',
  'મેન્ડોન્સા': 'Christian',
  'મેકવાન': 'Christian',

  // ── Batch from master voter_surname_jaati_classification.xlsx ──
  'આમદાણી': 'Muslim',
  'બુરહાદ્દીનસૈફુદ્દીન': 'Muslim',
  'બુરહાનુદીન': 'Muslim',
  'બોસેમિયા': 'Muslim',
  'હકીમુદ્દીનભાઈ': 'Muslim',
  'દાવૂદાની': 'Muslim',
  'ધરમાણી': 'Muslim',
  'ગનીયાણી': 'Muslim',
  'ગૌરાણી': 'Muslim',
  'હિમદાણી': 'Muslim',
  'હુસૈન': 'Muslim',
  'હુસેની': 'Muslim',
  'ખોરાણી': 'Muslim',
  'મરચનટ': 'Muslim',
  'મોલવી': 'Muslim',
  'અકરમ': 'Muslim',
  'અક્રમભાઈ': 'Muslim',
  'અબુબકર': 'Muslim',
  'અબ્બાસભાઈ': 'Muslim',
  'અલાના': 'Muslim',
  'અલી': 'Muslim',
  'અલીભાઈ': 'Muslim',
  'અલીમ': 'Muslim',
  'અલ્ફાજ': 'Muslim',
  'અશરફભાઈ': 'Muslim',
  'અસલમભાઈ': 'Muslim',
  'અસ્ફાક': 'Muslim',
  'અહમદખા': 'Muslim',
  'આગારીયા': 'Muslim',
  'આઝમભાઈ': 'Muslim',
  'આઝાબ': 'Muslim',
  'આદમભાઈ': 'Muslim',
  'આબિદભાઈ': 'Muslim',
  'આબીદભાઈ': 'Muslim',
  'આમનભાઈ': 'Muslim',
  'આમરણીયા': 'Muslim',
  'આરીફ': 'Muslim',
  'આરીફભાઈહિમદાણી': 'Muslim',
  'આલફદજ': 'Muslim',
  'આસીફભાઈ': 'Muslim',
  'ઇમરાન': 'Muslim',
  'ઇમરાનભાઈ': 'Muslim',
  'ઇમ્તિયાઝ': 'Muslim',
  'ઇરશાદ': 'Muslim',
  'ઇશાભાઈ': 'Muslim',
  'ઇસાભાઈ': 'Muslim',
  'ઇસુફીભાઈ': 'Muslim',
  'ઇસ્માઇલભાઈ': 'Muslim',
  'ઇસ્માઇલભાઈગોગદા': 'Muslim',
  'ઈમ્તીયાઝ': 'Muslim',
  'ઉણ્ડીયા': 'Muslim',
  'ઉવેશ': 'Muslim',
  'ઓઠા': 'Muslim',
  'કંડવીયા': 'Muslim',
  'કડદોયા': 'Muslim',
  'કડદોરિયા': 'Muslim',
  'કડદોરીયા': 'Muslim',
  'કલડોરિયા': 'Muslim',
  'કલદૌરીયા': 'Muslim',
  'કાબા': 'Muslim',
  'કાસમણી': 'Muslim',
  'કીટોરિયા': 'Muslim',
  'કુતુબુદ્દીન': 'Muslim',
  'કૂતુબદીનભાઈ': 'Muslim',
  'ખલફાન': 'Muslim',
  'ખુશા': 'Muslim',
  'ગધેરા': 'Muslim',
  'ગૌચ્ચર': 'Muslim',
  'જબ્બારભાઈ': 'Muslim',
  'જાફરભાઈ': 'Muslim',
  'જાળિયા': 'Muslim',
  'જીકરભાઈ': 'Muslim',
  'જીલાનીભાઈ': 'Muslim',
  'જુનેદભાઈ': 'Muslim',
  'જુબેર': 'Muslim',
  'જુબેરભાઈ': 'Muslim',
  'ઝાકીરહુસેન': 'Muslim',
  'ઝાહિદભાઈ': 'Muslim',
  'ડેરયા': 'Muslim',
  'ડૈયા': 'Muslim',
  'તેલવાનિ': 'Muslim',
  'તૈરૈયા': 'Muslim',
  'તોસીફ': 'Muslim',
  'તૌફીકભાઈ': 'Muslim',
  'દરૈયા': 'Muslim',
  'દાઉદભાઈ': 'Muslim',
  'દાદુ': 'Muslim',
  'દીનમંહમદભાઈ': 'Muslim',
  'દુરૈજા': 'Muslim',
  'દુસૈજા': 'Muslim',
  'દૈરૈયા': 'Muslim',
  'નદીમ': 'Muslim',
  'નિઝામભાઈ': 'Muslim',
  'નૂરમહમદભાઈ': 'Muslim',
  'નેહદી': 'Muslim',
  'નેહિંદ': 'Muslim',
  'નૌશાદભાઈ': 'Muslim',
  'ફ઼ારુકભાઈ': 'Muslim',
  'ફારુકભાઈ': 'Muslim',
  'ફિરોઝ': 'Muslim',
  'ફિરોઝભાઈ': 'Muslim',
  'ફૈજલ': 'Muslim',
  'ફૈસલભાઈ': 'Muslim',
  'બાઉદીનભાઈ': 'Muslim',
  'બિશરભાઈ': 'Muslim',
  'બોરાણીયા': 'Muslim',
  'મગરેબીયા': 'Muslim',
  'મન્દોરા': 'Muslim',
  'મયોદ્દીન': 'Muslim',
  'મસી': 'Muslim',
  'મહોડા': 'Muslim',
  'માટલી': 'Muslim',
  'માડવોયા': 'Muslim',
  'મિદાણી': 'Muslim',
  'મુર્તજા': 'Muslim',
  'મુર્તુજા': 'Muslim',
  'મુસ્તાક': 'Muslim',
  'મેલાડા': 'Muslim',
  'મેલોડા': 'Muslim',
  'મોજુબેર': 'Muslim',
  'મોણકા': 'Muslim',
  'મોહિન': 'Muslim',
  'યાકુબભાઈ': 'Muslim',
  'યૂસુફભાઈ': 'Muslim',
  'રફિક': 'Muslim',
  'રસુલભાઇ': 'Muslim',
  'રસૂલભાઈ': 'Muslim',
  'રહેમાન': 'Muslim',
  'રહેમાનભાઈ': 'Muslim',
  'રિયાઝભાઈ': 'Muslim',
  'રીઝવાનભાઈ': 'Muslim',
  'લીંબોડીયા': 'Muslim',
  'વસીમભાઈ': 'Muslim',
  'શકોરિયા': 'Muslim',
  'શેરશીયા': 'Muslim',
  'શેરસીયા': 'Muslim',
  'શેરિયાર': 'Muslim',
  'શેરીયા': 'Muslim',
  'સત્તારભાઈ': 'Muslim',
  'સમીર': 'Muslim',
  'સમીરભાઈ': 'Muslim',
  'સરિયા': 'Muslim',
  'સાજીદભાઈ': 'Muslim',
  'સાદીકભાઈ': 'Muslim',
  'સાહિરભાઈ': 'Muslim',
  'સાહીરભાઈ': 'Muslim',
  'સિનેમાળા': 'Muslim',
  'સીદીકભાઈ': 'Muslim',
  'સેલયા': 'Muslim',
  'સોહબભાઈ': 'Muslim',
  'સોહિલભાઈ': 'Muslim',
  'હવેજ': 'Muslim',
  'હસનભાઈ': 'Muslim',
  'હાંડા': 'Muslim',
  'હાજીભાઈ': 'Muslim',
  'હાજીહુસૈનભાઈ': 'Muslim',
  'હારસી': 'Muslim',
  'હારુન': 'Muslim',
  'હારુનભાઈ': 'Muslim',
  'હારૂન': 'Muslim',
  'હાલિઆ': 'Muslim',
  'હિમદભાઈ': 'Muslim',
  'હુસેનભાઈહોજેફાભાઈ': 'Muslim',
  'હોડા': 'Muslim',
  'ૐયામોહંમદઝુબેરગફારભાઈ': 'Muslim',
  'અબ્દુલકાદર': 'Muslim',
  'અબ્દુલમન્નાન': 'Muslim',
  'અબ્દુલમુનાફ': 'Muslim',
  'અબ્દુલરહીમ': 'Muslim',
  'અકબરઅલી': 'Muslim',
  'અમીરઅલી': 'Muslim',
  'અલીઅકબર': 'Muslim',
  'અલીરજા': 'Muslim',
  'કાસમઅલી': 'Muslim',
  'મુખ્તારઅલી': 'Muslim',
  'યૂસુફઅલી': 'Muslim',
  'રાજાકઅલી': 'Muslim',
  'શેરઅલી': 'Muslim',
  'બસરવાલા': 'Muslim',
  'બસરાવાળા': 'Muslim',
  'હુસેનબેગ': 'Muslim',
  'ફઝલઅબબદસ': 'Muslim',
  'અલ્તાફહુસેન': 'Muslim',
  'આબિદહુસેન': 'Muslim',
  'જાવેદહુસૈન': 'Muslim',
  'આદિલખાન': 'Muslim',
  'આરીફખાન': 'Muslim',
  'એઝાઝખાન': 'Muslim',
  'ગફારખાન': 'Muslim',
  'મહેબુબખાન': 'Muslim',
  'યૂસુફખાન': 'Muslim',
  'લક્ષ્મિધર': 'Muslim',
  'લક્ષ્મીધર': 'Muslim',
  'લક્ષ્મીધાર': 'Muslim',
  'લોડિયા': 'Muslim',
  'લોડીયા': 'Muslim',
  'સુફિયાનમહિડા': 'Muslim',
  'મંહમદભાઇ': 'Muslim',
  'મહંમદઅસ્લમ': 'Muslim',
  'મહમદઆમીર': 'Muslim',
  'મહમદઆરીશ': 'Muslim',
  'મહમદઆસીફભાઈ': 'Muslim',
  'મહમદજુનેદ': 'Muslim',
  'મહમદતોસીફ': 'Muslim',
  'મહમદફારૂક': 'Muslim',
  'મહમદભાઈ': 'Muslim',
  'મહમદહનીફ': 'Muslim',
  'મોંહમદઅસ્ફાકભાઈ': 'Muslim',
  'મોહંમદઅસ્ફાક': 'Muslim',
  'મોહમ્મદ્રાફિકભાઈ': 'Muslim',
  'જનબકદદબકનમહમદરફનકભદઈ': 'Muslim',
  'પત્થર': 'Muslim',
  'પંજ્વાણી': 'Muslim',
  'પાજવાની': 'Muslim',
  'અંજુમ': 'Muslim',
  'અફસાના': 'Muslim',
  'અયનબ': 'Muslim',
  'અસ્મા': 'Muslim',
  'આયશાબાનુ': 'Muslim',
  'ખાલિદાઇરશાદ': 'Muslim',
  'જન્નતબેન': 'Muslim',
  'જયનબરજાઅલી': 'Muslim',
  'જરીનાબેન': 'Muslim',
  'જેતુનબેન': 'Muslim',
  'તમન્નાઅસ્ફાક': 'Muslim',
  'દુરૈયાબેનસૈફુદ્દીન': 'Muslim',
  'નાઝમીન': 'Muslim',
  'ફરજાનાબેન': 'Muslim',
  'ફિઝાબેનઅકીલભાઈ': 'Muslim',
  'બિલ્કીસબેન': 'Muslim',
  'મહેજબીન': 'Muslim',
  'મિસબાઅસલમ': 'Muslim',
  'મીનાજબેન': 'Muslim',
  'મુસ્કાન': 'Muslim',
  'યાસ્મીન': 'Muslim',
  'રફિયાહારિસ': 'Muslim',
  'રાબિયાબેનરમઝાન': 'Muslim',
  'રિઝવાનાબેન': 'Muslim',
  'રુબીના': 'Muslim',
  'રેશ્મા': 'Muslim',
  'શહેનાજબેન': 'Muslim',
  'શીલૂ': 'Muslim',
  'શોહરા': 'Muslim',
  'સમીરાબેન': 'Muslim',
  'સલમા': 'Muslim',
  'સુલેહા': 'Muslim',
  'હસીનાબેનરઝાકભાઈ': 'Muslim',
  'હીનાઅસ્લમ': 'Muslim',
  'હૂસેના': 'Muslim',
  'ખોજેમા': 'Muslim',
  'હુસેનભાઈ': 'Muslim',
  'ચોટલિયા': 'Muslim',
  'ચોટલીયા': 'Muslim',
  'લોંડિઆ': 'Muslim',
  'લોંડિયા': 'Muslim',
  'રાયજાદા': 'Muslim',
  'કડિવાલા': 'Muslim',
  'કડિવાળ': 'Muslim',
  'ઘિયાવાડવાલા': 'Muslim',
  'છવાળા': 'Muslim',
  'તેજાબવાલો': 'Muslim',
  'ફુટવાલા': 'Muslim',
  'બિલ્ડીંગવાળા': 'Muslim',
  'બીલ્ડીંગવાળા': 'Muslim',
  'લીંબડીવાળા': 'Muslim',
  'વરલવાળા': 'Muslim',
  'નાગાણી': 'Muslim',
  'પટાન્': 'Muslim',
  'પઠણ': 'Muslim',
  'પ્રમાણિ': 'Muslim',
  'કુરેશિ': 'Muslim',
  'રેશિ': 'Muslim',
  'રાઘનપુરી': 'Muslim',
  'રિઝવી': 'Muslim',
  'સાખાની': 'Muslim',
  'શૈખ': 'Muslim',
  'સિધ્ધપુરી': 'Muslim',
  'સીદી': 'Muslim',
  'સીદાતાર': 'Muslim',
  'સવૈદ': 'Muslim',
  'સેવૈદ': 'Muslim',
  'સૈયેદ': 'Muslim',
  'તાજાણી': 'Muslim',
  'બરૈયા': 'Koli / OBC',
  'મોંડલ': 'Other',
  'મોડલ': 'Other',
  'પોલ': 'Other',
  'ભટ્રટી': 'Brahmin',
  'ભટક': 'Brahmin',
  'ભટગ': 'Brahmin',
  'ભાષ્કર': 'Brahmin',
  'ચાંપનેરી': 'Brahmin',
  'દિક્ષિત': 'Brahmin',
  'પરાજપે': 'Brahmin',
  'પરાજીપે': 'Brahmin',
  'મિશ્રા': 'Brahmin',
  'શુકુલ': 'Brahmin',
  'ઠદકર': 'Brahmin',
  'યાજ્ઞકિ': 'Brahmin',
  'મહતા': 'Brahmin',
  'ક્રિશ્ચીયન': 'Christian',
  'ક્રીશ્ચન': 'Christian',
  'થોમસ': 'Christian',
  'ડાંડિયા': 'Koli / OBC',
  'દરબાર': 'Rajput / Kshatriya',
  'ટેન': 'Christian',
  'વિન્સ્કી': 'Christian',
  'શીબા': 'Other',
  'હરમાન': 'Other',
  'સ્વાન': 'Other',
  'ગોળિયા': 'Koli / OBC',
  'ગોસલિયા': 'Koli / OBC',
  'ગોસલીયા': 'Koli / OBC',
  'ગોસાલિયા': 'Koli / OBC',
  'ચંપકભાઈ': 'Other',
  'ચરણદાસ': 'Other',
  'રામદેવભાઈવિનેશભાઈ': 'Other',
  'વંશ': 'Other',
  'ગાર્': 'Other',
  'ગુરૂજી': 'Other',
  'સદેવ': 'Other',
  'શકલ': 'Other',
  'નંદા': 'Other',
  'ભારતી': 'Other',
  'મુનિ': 'Vania / Jain',
  'આશરો': 'Vania / Jain',
  'ભનસાલી': 'Vania / Jain',
  'ગાલા': 'Vania / Jain',
  'સઁઘવી': 'Vania / Jain',
  'સઘવી': 'Vania / Jain',
  'સાંઘવી': 'Vania / Jain',
  'જોગી': 'Koli / OBC',
  'જોગીયા': 'Koli / OBC',
  'કાછિયા': 'Koli / OBC',
  'કડીયા': 'Koli / OBC',
  'ઢેબર': 'Koli / OBC',
  'કોરવાડિયા': 'Koli / OBC',
  'લખ્પોટા': 'Lohana',
  'જવદળકર': 'Other',
  'મુળે': 'Other',
  'શિંદે': 'Other',
  'શીંદે': 'Other',
  'મારવાડી': 'Other',
  'મોરિ': 'Koli / OBC',
  'નય્યર': 'Other',
  'ન્ય્યર': 'Other',
  'ભૈયા': 'Other',
  '|સરમાળી': 'Koli / OBC',
  'અખિયાણીયા': 'Koli / OBC',
  'અઘડા': 'Koli / OBC',
  'અભાણી': 'Koli / OBC',
  'ઇટાલિયા': 'Koli / OBC',
  'ઉંડાવિયા': 'Koli / OBC',
  'ઉડ': 'Koli / OBC',
  'ઉનવાળા': 'Koli / OBC',
  'ઉન્નડ': 'Koli / OBC',
  'ઓઘારિયા': 'Koli / OBC',
  'ઓઘારીયા': 'Koli / OBC',
  'ઓઘિયા': 'Koli / OBC',
  'ઓધરિયા': 'Koli / OBC',
  'કંકૈયા': 'Koli / OBC',
  'કંડોળીયા': 'Koli / OBC',
  'કકિડયા': 'Koli / OBC',
  'કગતરા': 'Koli / OBC',
  'કચ્છલા': 'Koli / OBC',
  'કમ્મર': 'Koli / OBC',
  'કયા': 'Koli / OBC',
  'કરછલા': 'Koli / OBC',
  'કલાવડિયા': 'Koli / OBC',
  'કારિયા': 'Koli / OBC',
  'કાલવડિયા': 'Koli / OBC',
  'કાલાવડિયા': 'Koli / OBC',
  'કાલિવડા': 'Koli / OBC',
  'કાલીવડા': 'Koli / OBC',
  'કોટિલા': 'Koli / OBC',
  'ખનરા': 'Koli / OBC',
  'ખાખ': 'Koli / OBC',
  'ખાટસૂરિયા': 'Koli / OBC',
  'ખાસુરીયા': 'Koli / OBC',
  'ખાસ્સુરીયા': 'Koli / OBC',
  'ખુંટ': 'Koli / OBC',
  'ખોરજીયો': 'Koli / OBC',
  'ગજરિયા': 'Koli / OBC',
  'ગઢાદરા': 'Koli / OBC',
  'ગળીયેલ': 'Koli / OBC',
  'ગોડ્કીયા': 'Koli / OBC',
  'ગોદિયા': 'Koli / OBC',
  'ગોબ્લિ': 'Koli / OBC',
  'ગૌદણા': 'Koli / OBC',
  'ઘંઘુકીયા': 'Koli / OBC',
  'ઘિયા': 'Koli / OBC',
  'ઘુમાડિયા': 'Koli / OBC',
  'ચોગયા': 'Koli / OBC',
  'જકડીયા': 'Koli / OBC',
  'જાજલ': 'Koli / OBC',
  'જાસોલીયા': 'Koli / OBC',
  'જેવરજકા': 'Koli / OBC',
  'ઝિંઝુવાડીયા': 'Koli / OBC',
  'ટિમાણીયા': 'Koli / OBC',
  'ટ્રમ્બાડિયા': 'Koli / OBC',
  'ડબ્લ્યુ': 'Koli / OBC',
  'ડલ્લુ': 'Koli / OBC',
  'ડોલિઆ': 'Koli / OBC',
  'તરકવાડીયા': 'Koli / OBC',
  'તલસાણિયા': 'Koli / OBC',
  'તવેર': 'Koli / OBC',
  'તુરકી': 'Koli / OBC',
  'ત્રંબાડીયા': 'Koli / OBC',
  'ત્રાંબાડીયા': 'Koli / OBC',
  'થડેશ્વર': 'Koli / OBC',
  'દસાડિયા': 'Koli / OBC',
  'દાણાધારિયા': 'Koli / OBC',
  'દુધરેજીયા': 'Koli / OBC',
  'દુધેલા': 'Koli / OBC',
  'દેગડા': 'Koli / OBC',
  'દેદરા': 'Koli / OBC',
  'ધરણિયા': 'Koli / OBC',
  'ધલવાણી': 'Koli / OBC',
  'પંચમીઆ': 'Koli / OBC',
  'પચમીઆ': 'Koli / OBC',
  'પનાળીયા': 'Koli / OBC',
  'પાંધી': 'Koli / OBC',
  'પિપરીયા': 'Koli / OBC',
  'પોંકિયા': 'Koli / OBC',
  'પોન્દા': 'Koli / OBC',
  'પૌદા': 'Koli / OBC',
  'પૌન્દા': 'Koli / OBC',
  'ફીચડીયા': 'Koli / OBC',
  'બરોલિયા': 'Koli / OBC',
  'બાલસ': 'Koli / OBC',
  'બેરા': 'Koli / OBC',
  'બેલા': 'Koli / OBC',
  'ભંગોરિયા': 'Koli / OBC',
  'ભઙોરિયા': 'Koli / OBC',
  'ભદિયાદ્રા': 'Koli / OBC',
  'ભાગીયા': 'Koli / OBC',
  'ભૂતરીયા': 'Koli / OBC',
  'મગરેલી': 'Koli / OBC',
  'મટિયા': 'Koli / OBC',
  'માથાકીયા': 'Koli / OBC',
  'મીનસારીયા': 'Koli / OBC',
  'મૂળીયા': 'Koli / OBC',
  'યોગયા': 'Koli / OBC',
  'રજોડીયા': 'Koli / OBC',
  'રાચ્છ': 'Koli / OBC',
  'રાયતા': 'Koli / OBC',
  'રાશિયા': 'Koli / OBC',
  'રેયા': 'Koli / OBC',
  'રેલીયા': 'Koli / OBC',
  'રૈવલિયા': 'Koli / OBC',
  'લંગળિયા': 'Koli / OBC',
  'લગાલિયા': 'Koli / OBC',
  'લાડકા': 'Koli / OBC',
  'લીંબડીયા': 'Koli / OBC',
  'લીબડીયા': 'Koli / OBC',
  'લેયા': 'Koli / OBC',
  'લોલિયાણા': 'Koli / OBC',
  'વાલોડરા': 'Koli / OBC',
  'વિરડીયા': 'Koli / OBC',
  'વિરપુરા': 'Koli / OBC',
  'વિરપૂરા': 'Koli / OBC',
  'શનિશ્વરા': 'Koli / OBC',
  'સચાણીયા': 'Koli / OBC',
  'સરમાળિ': 'Koli / OBC',
  'સલોન': 'Koli / OBC',
  'સાંકડેસા': 'Koli / OBC',
  'સાકડેસાં': 'Koli / OBC',
  'સાકરિયા': 'Koli / OBC',
  'સાકળીયા': 'Koli / OBC',
  'સાદડિયા': 'Koli / OBC',
  'સિમેજીયા': 'Koli / OBC',
  'સુરપાલ': 'Koli / OBC',
  'સોનપલા': 'Koli / OBC',
  'હાળિયા': 'Koli / OBC',
  'હેમતીયા': 'Koli / OBC',
  'બાબરિયા': 'Koli / OBC',
  'ભાડેશીયા': 'Koli / OBC',
  'છતરીયા': 'Koli / OBC',
  'છત્તરીયા': 'Koli / OBC',
  'દેસાર': 'Koli / OBC',
  'ધોધારિ': 'Koli / OBC',
  'ઘોઘારિ': 'Koli / OBC',
  'ઘનઘનકનયદ': 'Koli / OBC',
  'ઘવળકનયદ': 'Koli / OBC',
  'પટોલિયા': 'Koli / OBC',
  'સામંત': 'Koli / OBC',
  'સામ્નત': 'Koli / OBC',
  'ધામેલીયા': 'Koli / OBC',
  'લખધીરીયા': 'Koli / OBC',
  'સૂમારા': 'Koli / OBC',
  'રુપારેલીયા': 'Patel / Patidar',
  'વડાલીયા': 'Patel / Patidar',
  'પટૅલ': 'Patel / Patidar',
  'મજેઠીયા': 'Patel / Patidar',
  'પ્રજપતિ': 'Koli / OBC',
  'પ્રજપતી': 'Koli / OBC',
  'રાજપુત': 'Rajput / Kshatriya',
  'રુપેરા': 'Rajput / Kshatriya',
  'ચોહલા': 'Rajput / Kshatriya',
  'ચૌહલા': 'Rajput / Kshatriya',
  'ચૂડાસમા': 'Rajput / Kshatriya',
  'શક્તિરાજસિંહસરવૈયા': 'Rajput / Kshatriya',
  'સીસોદીયા': 'Rajput / Kshatriya',
  'સોધા': 'Rajput / Kshatriya',
  'નિનામા': 'Rajput / Kshatriya',
  'સોલંકિ': 'Rajput / Kshatriya',
  'સિબી': 'SC / Dalit',
  'સીબી': 'SC / Dalit',
  'ભંગી': 'SC / Dalit',
  'વાલ્મિકભાઈ': 'SC / Dalit',
  'વાલ્મીકભાઈ': 'SC / Dalit',
  'બેડિયા': 'SC / Dalit',
  'દંગી': 'SC / Dalit',
  'દાંગી': 'SC / Dalit',
  'સાંકળીયા': 'Koli / OBC',
  'ગુરુમુખસિંઘ': 'Sikh',
  'કૈલાશસિંઘ': 'Sikh',
  'સિન્ઘ': 'Sikh',
  'માસ્ટર': 'Other',
  'ગાન્ધી': 'Vania / Jain',
  'શાઁ': 'Vania / Jain',
}

// ── Sindhi surnames (Partition-origin community, Bhavnagar Sindhi colony) ──
// Distinct from Lohana even though both can end in -ાણી.
const SINDHI_SURNAMES = new Set([
  'આડવાણી', 'આહુજા', 'આસવાણી', 'અસરાણી', 'અડવાણી',
  'ભાટિયા', 'ભાવનાની', 'ભગનાની',
  'ચાવલા', 'ચાંડવાણી', 'છાબડિયા', 'ચંદવાણી',
  'દાવાણી', 'દરિયાણી',
  'ગંગવાણી', 'ગિડવાણી', 'ગુરનાની', 'ગોકલાણી',
  'હિંગોરાણી', 'હિંગોરાની', 'હરચંદાણી',
  'જગતાણી', 'જેઠવાણી', 'જેસવાણી',
  'કૃપલાણી', 'ખીમાણી', 'ખુશલાણી',
  'લાલવાણી', 'લખાણી',
  'મખીજાણી', 'મીરચંદાણી', 'મુલચંદાણી', 'મંગાણી', 'માખીજાણી',
  'નાગરાણી', 'નારવાણી',
  'પારવાણી', 'પંજવાણી',
  'રામચંદાણી', 'રૂપચંદાણી', 'રાજપાલ', 'રોહરા',
  'સબનાણી', 'સાવલાણી', 'શાહાણી', 'સુંદરાણી', 'સિપાહિમલાણી', 'શિવનાણી',
  'ટેકચંદાણી', 'તેજવાણી', 'તોલાણી', 'ટીલવાણી',
  'વાધવાણી', 'વધવાણી',
  'ઝમ્ટાણી', 'ઝમટાણી',
  // ── Additions from voter-data frequency audit ──
  'તલરેજા', 'તલેરજા',
  'કુકરેજા', 'કુકડેજા', 'કૂકરેજા', 'કૂકડેજા', 'કુક્રેજા', 'કુકેડજા', 'કુંકડેજા', 'કૂકડેજા', 'કડેજા', 'કેડજા',
  'ડોડેજા', 'દોદેજા', 'ડૉડેજા',
  'સુખેજા', 'સુહેજા', 'હાસેજા', 'હસેજા', 'રાહેજા', 'રહેજા', 'રામેજા', 'ગેહીજા', 'ગેહેજા', 'ગેહિજા', 'ગનેજા',
  'તુલસાણી', 'તુલશાણી',
  'બદાણી', 'બાદાણી',
  'માધવાણી', 'માઘવાણી', 'મધનાણી', 'માઘાણી',
  'પમનાણી', 'પમનાણા',
  'ચંદારાણા',
  'સિંધવાણી', 'સીધવાણી', 'સિધવાણી', 'સિંધવા', 'સિધવા',
  'ગોપલાણી', 'ગોપાણી', 'ગોપલાણિ',
  'ફતનાણી', 'ફતાણી', 'ફતણાની',
  'માખીજા', 'માખિજા', 'મખીજા', 'માખિજા',
  'માનકાણી', 'મનકાની', 'મલકાણી', 'મલકાણ', 'માલકાણી',
  'ઘનવાણી', 'ધનવાણી', 'ઘનવદણન', 'ધનવાની', 'ઘનવાણી',
  'ચંદાણી', 'ચંદાની', 'ચાંદાણી',
  'સચદેવ', 'સચદેવાણી', 'સચદકવદણન',
  'ગુલવાણી',
  'ગંગવાણી', 'ગંગાવાણી', 'ગંગાણી', 'ગાગવાણી', 'ગાગાણી', 'ગાગવાની',
  'કિમતાણી', 'કીમતાણી', 'કિંમતાણી', 'કીંમતાણી',
  'લેખવાણી', 'લખેવાણી',
  'રામનાણી', 'રામનાની',
  'પારવાણી', 'પરવાણી', 'પરવાની', 'પદરવદણન', 'પૂરસવાની', 'પુરવાણી', 'પુરસવાની', 'પારસવાણી', 'પરસવાણી', 'પરસણા',
  'કેવલાણી', 'કેલવાણી',
  'ઘામેજા', 'ધામેજા', 'ધામેચા',
  'રત્નાણી', 'રતનાણી',
  'ભોજવાણી',
  'મોટવાણી', 'મોતિરામાની', 'મોતીરામાની',
  'વાઘવાણી', 'વઘવા', 'વઢવાણી', 'વઢવાણિયા', 'વઢવાણીયા', 'વાઘવાની', 'વાધવાની', 'વાદવાણી',
  'શામલાણી', 'શામનાણી',
  'જુમાણી', 'જમાણી', 'જામ્બા',
  'અબલાણી',
  'વાસવાણી', 'વદસવદણન',
  'હંસરાજાણી', 'હનસરદજણન',
  'ગભરાણી',
  'જેસાણી', 'જસાણી', 'જૈસાણી',
  'સુખાણી', 'સુખવાણી', 'સુખડીયા', 'સુખડિયા',
  'નવલાણી',
  'દાસાણી',
  'મલાણી', 'મલાણા', 'મલમલા',
  'ખલાણી',
  'દયાણી', 'દયાણિ',
  'વેદાણી', 'વજાણી', 'વેજાણી', 'વનાણી', 'વેલાણી', 'વેજલાણી',
  'વિસાણી', 'વસાણી', 'વસદાણી', 'વાસાણી', 'વાનાણી',
  'સખીયાણી', 'સખયાણી', 'સખ્યાણી', 'સખાણી', 'સખીયાણી',
  'વકાણી', 'વાકાણી', 'વંકાણી',
  'ટોરાણી', 'તોરાણી',
  'કાલાણી',
  'જેમાણી', 'જેમાણિ',
  'ચુગાણી', 'છુગાણી', 'ચુંગાની', 'ચઘાની', 'છગાણી', 'છગ્ગાણી',
  'નાયાણી',
  'ગોયાણી', 'ગોયાની',
  'અમલાણી', 'એમદાણી', 'એમદાણિ', 'એમદાની', 'ઍમદાણી', 'આમદાણી',
  'આગીચા',
  'અંબાણી', 'અંતાણી',
  'રાઘાણી',
  'કાનાણી', 'કાન્હાણી', 'કાન્તાણી',
  'કાસમાણી', 'કાસમાની', 'કોસમાણી',
  'બેલાણી', 'બેલડિયા', 'બેલડીયા',
  'બુઢાણી', 'બુઢાઈ',
  'હમીરાણી', 'હમીદાણી', 'હમિદાણી', 'હમિદાની',
  'સોમાણી',
  'માવાણી',
  'મસાણી',
  'મેઘનાણી', 'મેઘનાની',
  'કપૂરાણી', 'કપુરાણી', 'કપૂરાની',
  'ભંભાણી', 'ભામાણી',
  'ભીમાણી',
  'હિરાણી', 'હીરાણી', 'હિરવાણી', 'હિરવાણીયા', 'હીરવાણીયા',
  'વિરાણી', 'વીરાણી',
  'મુલચંદાણી', 'મૂલચંદાણી', 'મુંલચંદાણી', 'મનલચનદદણન',
  'ભાલાણી', 'ભાલાનિ', 'ભલાણી', 'ભલવાણી',
  'રામાણી', 'રમચંદાણી', 'રામચંદાણી',
  'તારાચંદાણી', 'હરચંદાણી', 'ખુબચંદાણી', 'ખંડનાણી', 'સભાગચંદાણી', 'બાલચંદાણી', 'બદલચનદદણન',
  'ચોઈથાણી', 'ચોઇથાણી', 'ચોઇથાણિ',
  'ગીધવાણી', 'ગિદવાણી', 'ગીદવાણી', 'ગિદ્યવાણી',
  'તેલવાણી', 'તેલવાની',
  'છાબડીયા', 'છાબડિયા', 'છાબડા', 'છત્રાલિયા', 'છાબરાણી',
  'સંતવાણી', 'સેવાણી',
  'પેશવાણી', 'પેસવાણી', 'પેશ્વાણી',
  'તેજવાણી', 'ટીલવાણી', 'ટિલવાણી',
  'રફીકભાઈ', // Rajani/Lalvani variants
  'રવજાણી', 'રવજણન', 'જીવાણી', 'જિવાણી',
  'બદાણી',
  'કપનર', 'કાપરાણી',
  'કાલવાતર', 'કાલ્વાતર', 'કહ્વાતર',
  'આહુજા', 'આહૂજા', 'આદુજા', 'આહજા', 'આપુજા', 'અહુજા', 'આપુજ',
  'ચાવલા',
  'લાલાણી', 'લાલવાણી', 'લાલાવાણી', 'લદલવદણન', 'હલવાણી', 'ભાવનાણી', 'ભાવનાની',
  'લુવાણી', 'લુવાણા',
  'કુંદનાણી',
  'નાણાવટી',
  'ગોગદા', 'ગવગદદ',
  'નિયાલાણી', 'નીયાલાણી', 'નિહાલાણી',
  'રીજવાણી', 'રીજવાની',
  'અબ્યાણિયા',
  'મંગલાણી', 'મગલાણી', 'મંગાલાણી', 'મંગાણી', 'મંધરા', 'મંધ્રા', 'મૈંઘરા', 'મંદાણી', 'મન્દાણી', 'મંદયાણી', 'મંદિયાણી',
  'બ્રહ્મભટ્ટ', // Wrong set — remove
  'સંખયાણી', 'સખંયાણી',
  'જાદવાણી',
  'ઉત્તાણી', 'ઉતાણી', 'ઉતવાણી', 'ઊતરણી',
  'ભોજાણી',
  'દુબેજા',
  'ગીલાતર',
  'વેલાન',
  'હપાણી', 'હેમાણી', 'હેમાણિ',
  'થાવરાણી', 'ઠાકરવાણી', 'ઠાકુરાણી', 'ઠાકરાણી',
  'જાફરી', // actually Muslim — skip
  'દેવગામીયા', 'દેવગામિયા',
  'લખાણી', 'લાખાણી', 'લખાની', 'લાખાની', 'લખદનન', 'લખદણન',
  'નરસિંઘાણી', 'નરસીંગાણી', 'નારસાંગાણી', 'નરસંગાણી', 'નરસિંગાણી', 'નરીંગાણી',
  'ટેકાણી', 'ટેકચંદાણી',
  'મુલરાજાણી',
  'તલવાડી',
  'અખીયાણી', 'અખ્યાણી', 'આખીયાણી', 'અખીયાણા', 'અખ્યાણિયા', 'અખીયાણીયા',
  'ચંચલાણી',
  'લૂંભાણી', 'લુંભાણી',
  'લાકડિયા',
  'દેવજાણી', 'દેવજીયાણી',
  'ગુરૂનાણી', 'ગુરુનાણી', 'ગુરનાણી',
  'પંજવાણી', 'પંજવાનિ', 'પજવાણી', 'પનજવદણન',
  'કુંવરાણી',
  'પુંજાણી', 'પિંજાણી', 'પૂંજાણી',
  'સગતાણી', 'સંગતાણી', 'સનગતદણન',
  'હરસોરા', 'સોહરા', 'રોહરા',
  'રોકડિયા',
  'કટાર', 'કાંટાવાલા',
  'વાસવાણી',
  'કડવાણી', 'વાળૉદરા',
  'ચેતવાણી', 'ચેત્વાણી',
  'ખીલવાણી', 'ખીલાવાણી',
  'લસવકદન', 'લસવકદદ',
  'વતવાણી', 'તવલદણન', 'તવળકર',
  'ગોકલાણી', 'ગોકાણી',
  'અલવાણી',
  'બાવળીયા', 'બાવળિયા', 'બાવલિયા',
  'નેભરાણી', 'નેબરાણી',
  'હરદવાણી', 'હરદેવાણી',
  'શીડાણા', 'સીદાણા', 'સિધાના',
  'તૈબાણી', 'તૈયબાણી',
  'પરીયાણી', 'પિરવાણી', 'પીરવાણી', 'પિનલબેન',
  'વરીયાણી', 'વારવાણી',
  'આરવદણન', 'આરબયાણી', 'આરબિયાણી',
  'ખેતાણી',
  'બલાણી', 'વલેજા',
  'સમેજા',
  'જેઠવાણી', 'જકડદ',
  'ઘોધવાણી', 'ગોધવાણી',
  'આબ્યાણિયા', 'આંબલિયા', 'આંબલીયા',
  'ઠાપરાણી', 'ટોપરાણી', 'ટપરાણી',
  'સાદરાણી',
  'મેખિયા',
  'ઇજવાણી', 'ઈજવાણી',
  'મધનાણી', 'મગનાણી',
  'ભાનાણી',
  'રાધવાણી', 'રાધવાની',
  'રોહાડા', 'રોહડા', 'રોહિડા', 'રોહીડા', 'રોહેડા',
  'દફતરી', 'દફ્તરી', 'મલાડા',
  'કાર્વાણી', 'કારવાણી',
  'સરમાણી', 'શરમાણી', 'સર્માલિ', 'સરમાળી', 'સરમાલી', 'શરમાળી',
  'વાધવા', 'વધવા',
  'ઊંડવિયા', 'ઉંડવીયા', 'ઉંડવિયા', 'ઊંડવીયા', 'ઉડવીયા', 'ઊંડવીયા',
  'લોહિયા', 'લોહીયા',
  'બલદાણી', 'બદલાણી',
  'ભુપતાણી',
  'જીવાણી',
  'લાખેવાણી',
  'દુધાણી',
  'શાદિજા', 'શાદીજા', 'શાદીજી',
  'મારફાણી',
  'સિંધગુરનાની',
  'ભક્તાણી',
  'બહરાણી', 'ગુરનાણી',
  'ભાવનદાસ',
  'પાનગ્રાહી',
  'બચાણી',
  'મુસાણી', 'મોકાણી', 'મુગાણિ',

  // ── Batch-added Sindhi from xlsx ──
  'મસરાણી',
  'સાધવાણી',
  'હરવાણી',
  'ગોરવાણી',
  'ગાંગાણી',
  'હરમાણી',

  // ── Batch-added Sindhi from xlsx ──
  'મસરાણી',
  'સાધવાણી',
  'હરવાણી',
  'ગોરવાણી',
  'ગાંગાણી',
  'હરમાણી',

  // ── Batch-added Sindhi from xlsx ──
  'સાહિત્ય',
  'બાલાણી',
  'જગડ',
  'ચોહલા',
  'રંગલાણી',
  'પોંદા',
  'ચભાડીયા',
  'સવાણી',
  'ખટવાણી',
  'નાવાણી',
  'રાધાણી',
  'દોલાણી',
  'સાહિત્યા',
  'સાહીત્ય',
  'નરવાણી',
  'વિઠલાણી',
  'ટીમાણી',
  'મસરાણી',
  'લખુપોટા',
  'ગીઘવાણી',
  'થદાણી',
  'મચ્છર',
  'રામવાણી',
  'ચંદનાણી',
  'સાધવાણી',
  'હરિયાણી',
  'કાથરાણી',
  'સાઘવાણી',
  'તારવાણી',
  'હરવાણી',
  'કાંજાણી',
  'છતવાણી',
  'વેન્સીમલાણી',
  'ગોરવાણી',
  'ગાંગાણી',
  'ભરનયદનદ',
  'ચોટરાણી',
  'ભાનસાલી',
  'રાજાઈ',
  'હોટવાની',
  'સુરેજા',
  'ઠાકવાણી',
  'વંજાણી',
  'ભોપાણી',
  'સામનાણી',
  'મોનાણી',
  'હરમાણી',
  'વિધાણી',
  'ગુજરાની',
  'નોતવાણી',
  'રંગાણી',
  'હોતવાની',
  'નથવાણી',

  // ── Batch from master xlsx ──
  'અમેસર',
  'આગિચા',
  'ઉદાણી',
  'ઉમરાની',
  'કાશવાણી',
  'કીતમાણી',
  'કુંઢેજા',
  'કુદ્રુજા',
  'કૃતનાણી',
  'કેશવાણિ',
  'કોકરા',
  'ખનવાણી',
  'ખીરાણી',
  'ગંગવાની',
  'ગારડી',
  'ગોગાણિ',
  'ગોધાણી',
  'ગોલાણિ',
  'જુનેજા',
  'જુસેદા',
  'જુસેની',
  'જૂસેતા',
  'જોધવાણી',
  'ઝૂક્કર',
  'ટેબલા',
  'ટેવાણી',
  'ડેમલા',
  'તનાણી',
  'થોરી',
  'દતાણી',
  'દેવાનિ',
  'નરિયાણી',
  'નાણી',
  'નોતાણી',
  'પટ્ટાણી',
  'પાચા',
  'પુરસવાણી',
  'ફ્યુનાણી',
  'ફ્ળનાણી',
  'બદિયાણી',
  'ભયાણી',
  'ભાગડ',
  'ભાગોડી',
  'ભાલાણિ',
  'ભાલાની',
  'મંઘા',
  'મંધા',
  'મનવાણી',
  'મનસુખાણી',
  'માલાણી',
  'મેઠાણી',
  'મોહનાની',
  'મોહીનાની',
  'રજાણી',
  'રતવાણી',
  'રાયગોર',
  'લખવાણી',
  'વલેશા',
  'વાલેજા',
  'વિદાણી',
  'વિશરાણી',
  'વેજારાણી',
  'શાદી',
  'શિવનાની',
  'શીવનારી',
  'સચ્ચદેવાણી',
  'સપ્તેજા',
  'સુંખાણી',
  'સુખા',
  'સેંદાણી',
  'સેજાણી',
  'સૈતા',
  'હર્તાવાણી',
  'હાસેજ',
  'હાોજા',
  'હોટવાણી',
  'અદાણી',
])

// ── Muslim FIRST NAMES ──────────────────────────────────────────────────
// Many Muslims in Bhavnagar use neutral-looking surnames (Shah, Patel, etc.)
// so surname alone misses them.  We also check the voter's first name AND
// the relative's first name — if either is clearly Muslim, classify as Muslim.
const MUSLIM_FIRST_NAMES = new Set([
  // Men
  'અલી','અહમદ','અહેમદ','અબ્દુલ','અકબર','અનવર','અશરફ','અયુબ','અઝહર','અનિસ','અલ્તાફ','અરશદ','અસગર',
  'આરીફ','આસિફ','આઝાદ','આદિલ','આફતાબ','આમિર','આસમ','આકિલ','આલમ',
  'ઇકબાલ','ઇમરાન','ઇરફાન','ઇસ્માઇલ','ઇસ્માઈલ','ઇબ્રાહિમ','ઇલિયાસ','ઇજાઝ','ઇનામ',
  'ઉસ્માન','ઉમર','ઉમેર',
  'કરીમ','કાદર','કાસમ','કાશીફ','કલીમ','કૈસર','કાસિફ',
  'ખાલિદ','ખલીલ','ખુરશીદ','ખાલીદ',
  'ગની','ગુલામ','ગફ્ફાર','ગફાર',
  'જાવેદ','જુનેદ','જમાલ','જાકિર','જાફર','જુસબ','જુસુફ','જહાંગીર','જુબેર','જાવીદ','જાહિદ',
  'ઝુબેર','ઝાકિર','ઝહીર','ઝાહીદ','ઝુલ્ફીકાર','ઝફર',
  'તારિક','તાહિર','તૌફિક','તસલીમ','તૈયબ',
  'દાનિશ','દિલશાદ',
  'નઝીર','નઝીમ','નદીમ','નૌશાદ','નસીમ','નસીર','નુરુદ્દીન','નિસાર','નવાબ','નદીર',
  'ફારૂક','ફારુક','ફિરોઝ','ફૈઝલ','ફારુખ','ફઝલ','ફૈઝ','ફૈયાઝ',
  'બાબર','બિલાલ','બશીર','બહાદુર',
  'મોહમ્મદ','મહમ્મદ','મહંમદ','મુહમ્મદ','મુસ્તફા','મુનાફ','મનસૂર','મોઇન','મોહસીન','મુબારક','મકસૂદ','મુખ્તાર','મુનીર','મહેબૂબ','મુન્તઝીર','મુજાહિદ','મુનવ્વર','મિરાજ','મુનીફ',
  'રફીક','રશીદ','રહેમાન','રેહમાન','રિઝવાન','રિયાઝ','રમઝાન','રહીમ','રજ્જાક','રઈસ','રઝાક','રિહાન','રઝા',
  'સાકિર','સલીમ','સલમાન','સમીર','સોહેલ','સદીક','સત્તાર','સાબીર','સરફરાઝ','શાહિદ','શરીફ','સાજીદ','સોહૈલ','સુલેમાન','સાજિદ','શકીલ','શબ્બીર','સાદિક','શૌકત','શફીક','શમીમ','સાદિક','શકુર','સુહેલ',
  'હનીફ','હસન','હુસેન','હુસૈન','હાજી','હમીદ','હારુન','હસીન','હકીમ','હૈદર','હફીઝ',
  'યુસુફ','યુસૂફ','યાસીન','યાકૂબ','યાસીર','યામીન',
  'વસીમ','વારિસ','વલી','વહીદ',
  'જુસુબ','જુસફ','ઇસુબ',
  // Women
  'ફાતિમા','ફરીદા','ફરહાના','ફિરદૌસ','ફરઝાના','ફૌઝિયા',
  'આયેશા','આયશા','આમના','આફરીન','આસિયા','આયેશાબાનુ','અસ્મા',
  'રૂકૈયા','રૈહાના','રઝિયા','રેહાના','રોશની','રૂબીના','રુખસાના','રેશ્મા','રજિયા','રબિયા',
  'સાબીરા','સલમા','સનમ','સબા','સાયરા','સહરા','સાબરા','સમીના','સારા','સાનીયા','સજીદા',
  'શબાના','શાહિના','શહનાઝ','શગુફ્તા','શકીલા','શહરીન','શીરીન','શમીમા','શબીના',
  'ઝૈનબ','ઝેબા','ઝરીના','ઝીનત','ઝેબુન','ઝુબેદા','ઝુલેખા',
  'તસ્લીમા','તસનીમ','તબસ્સુમ','તાહિરા',
  'નજમા','નસીમા','નાઝિયા','નિલોફર','નૂરજહાં','નીલમ','નઝીમા','નિશાત','નાજીયા',
  'મુમતાઝ','મહેરુન','મેહરુન','મરિયમ','મુનીરા','મુબીના',
  'હસીના','હુસનબાનુ','હવા','હાજરા',
  'બિલકિસ','બીબી','બેગમ','બાનુ',
  'યાસ્મીન','યાસ્મિન',
])

// Muslim-name PREFIXES — for compound names like "અબ્દુલકરીમ", "મોહમ્મદઅલી"
const MUSLIM_PREFIXES = [
  'મોહમ્મદ','મહમ્મદ','મહંમદ','મુહમ્મદ',
  'અબ્દુલ','અબ્દ',
  'ગુલામ','અલ્લાહ',
  'નુરૂદ્દીન','નુરુદ્દીન','શમશુદ્દીન','સલાઉદ્દીન','જમાલુદ્દીન',
  'ઇબ્રાહિમ','ઇસ્માઇલ','ઇસ્માઈલ','ઇલિયાસ','ઇમરાન',
  'મુસ્તફા','મુબારક','મનસૂર','મુનવ્વર',
  'રેહમાન','રહેમાન','રહમાન',
  'ફારૂક','ફિરોઝ','ફૈઝલ',
  'હુસૈન','હુસેન','હબીબ','હકીમ',
  'ઝુબેર','ઝાકિર','ઝાહિદ','ઝાહીદ',
  'યુસુફ','યુસૂફ','યાકૂબ','યાસીન',
  'શેખ','સૈયદ','મૌલાના','હાજી','મુફ્તી','કાજી','કાઝી',
]

function firstNameIsMuslim(fullName) {
  if (!fullName) return false
  const first = fullName.trim().split(/\s+/)[0] || ''
  if (!first) return false
  if (MUSLIM_FIRST_NAMES.has(first)) return true
  for (const pfx of MUSLIM_PREFIXES) {
    if (first.startsWith(pfx)) return true
  }
  return false
}

// Muslim by AREA (Masjid / Idgah colonies)
const MUSLIM_AREA_PATTERNS = [
  '\u0AAE\u0AB8\u0A9C',                // 'મસજ' Masjid (garbled)
  '\u0AAE\u0ACD\u0AB8\u0A9C',          // 'મ્સજ'
  '\u0AAE\u0AB8\u0ACD\u0A9C',          // 'મસ્જ'
  'મસ્જિદ',
  'મસજીદ',
  '\u0A88\u0AA6\u0A97\u0AA6\u0AB9',    // Idgah garbled
  'ઇદગાહ', 'ઈદગાહ',
  'મોમીનવાડ', 'મવમનનવદડ',
  'કાઝીવાડ',  'કદઝનવદડ',
]

function inferJaati(voter) {
  const name = (voter.name || '').trim()
  const rel  = (voter.relative_name || '').trim()
  const area = voter.area || ''

  // 1 ── Muslim area → Muslim
  if (area) {
    for (const p of MUSLIM_AREA_PATTERNS) {
      if (area.includes(p)) return 'Muslim'
    }
  }

  // 2 ── Muslim FIRST NAME — catches Muslims with neutral surnames (Shah, Patel, Vohra, etc.)
  if (firstNameIsMuslim(name) || firstNameIsMuslim(rel)) {
    return 'Muslim'
  }

  if (!name) return 'Other'
  const words = name.split(/\s+/).filter(Boolean)
  const surname = words[words.length - 1] || ''

  // 3 ── Sindhi surname (distinct set; avoids Lohana overlap)
  if (SINDHI_SURNAMES.has(surname)) return 'Sindhi'

  // 4 ── Surname lookup (exact)
  if (SURNAME_MAP[surname]) return SURNAME_MAP[surname]

  // 5 ── Surname prefix match (catches OCR-trailing-glyph variants)
  if (surname.length >= 3) {
    for (const key of Object.keys(SURNAME_MAP)) {
      if (key.length >= 3 && (surname.startsWith(key) || key.startsWith(surname))) {
        const overlap = Math.min(surname.length, key.length)
        if (overlap >= 3) return SURNAME_MAP[key]
      }
    }
  }

  return 'Other'
}

// ── Display order & colours ─────────────────────────────────────────────
const CATEGORY_ORDER = [
  'Muslim',
  'Vania / Jain',
  'Brahmin',
  'Patel / Patidar',
  'Rajput / Kshatriya',
  'Lohana',
  'Koli / OBC',
  'SC / Dalit',
  'Sindhi',
  'Soni',
  'Khatri',
  'Ahir',
  'Bharwad',
  'Christian',
  'Sikh',
  'Other',
]
const CATEGORY_COLORS = {
  'Muslim':             { badge: 'bg-green-600 text-white',  bar: 'bg-green-500'  },
  'Vania / Jain':       { badge: 'bg-yellow-500 text-white', bar: 'bg-yellow-400' },
  'Brahmin':            { badge: 'bg-orange-600 text-white', bar: 'bg-orange-500' },
  'Patel / Patidar':    { badge: 'bg-blue-600 text-white',   bar: 'bg-blue-500'   },
  'Rajput / Kshatriya': { badge: 'bg-red-500 text-white',    bar: 'bg-red-400'    },
  'Lohana':             { badge: 'bg-purple-600 text-white', bar: 'bg-purple-500' },
  'Koli / OBC':         { badge: 'bg-teal-600 text-white',   bar: 'bg-teal-500'   },
  'SC / Dalit':         { badge: 'bg-indigo-600 text-white', bar: 'bg-indigo-500' },
  'Sindhi':             { badge: 'bg-pink-600 text-white',   bar: 'bg-pink-500'   },
  'Soni':               { badge: 'bg-amber-500 text-white',  bar: 'bg-amber-400'  },
  'Khatri':             { badge: 'bg-cyan-600 text-white',   bar: 'bg-cyan-500'   },
  'Ahir':               { badge: 'bg-rose-600 text-white',   bar: 'bg-rose-500'   },
  'Bharwad':            { badge: 'bg-lime-600 text-white',   bar: 'bg-lime-500'   },
  'Christian':          { badge: 'bg-sky-600 text-white',    bar: 'bg-sky-500'    },
  'Sikh':               { badge: 'bg-slate-700 text-white',  bar: 'bg-slate-600'  },
  'Other':              { badge: 'bg-gray-500 text-white',   bar: 'bg-gray-400'   },
}

// ── Build dynamic Muslim-surname set ────────────────────────────────────
// If a surname not already mapped has >=40% voters (min 4 voters) with
// Muslim first names (voter OR relative), reclassify ALL bearers as Muslim.
function buildMuslimSurnameSet(voters) {
  if (!voters) return new Set()
  const bySurname = new Map()  // surname → { total, muslim }
  for (const v of voters) {
    const nm = (v.name || '').trim()
    if (!nm) continue
    const surname = nm.split(/\s+/).pop() || ''
    if (!surname) continue
    if (SURNAME_MAP[surname] || SINDHI_SURNAMES.has(surname)) continue  // already classified
    const rec = bySurname.get(surname) || { total: 0, muslim: 0 }
    rec.total += 1
    if (firstNameIsMuslim(nm) || firstNameIsMuslim(v.relative_name || '')) {
      rec.muslim += 1
    }
    bySurname.set(surname, rec)
  }
  const out = new Set()
  for (const [sur, rec] of bySurname) {
    if (rec.total >= 4 && rec.muslim / rec.total >= 0.4) out.add(sur)
  }
  return out
}

export default function JaatiAnalysis({ voters, loading }) {
  // Dynamic Muslim surname set (surnames where >=40% bearers have Muslim first names)
  const muslimSurnameSet = useMemo(() => buildMuslimSurnameSet(voters), [voters])

  const inferJaatiDyn = (v) => {
    const j = inferJaati(v)
    if (j !== 'Other') return j
    const nm = (v.name || '').trim()
    if (!nm) return 'Other'
    const surname = nm.split(/\s+/).pop() || ''
    if (muslimSurnameSet.has(surname)) return 'Muslim'
    return 'Other'
  }

  const jaatiStats = useMemo(() => {
    if (!voters) return null
    const counts = {}
    for (const v of voters) {
      const j = inferJaatiDyn(v)
      counts[j] = (counts[j] || 0) + 1
    }
    return CATEGORY_ORDER
      .filter(c => counts[c])
      .map(name => ({
        name,
        count: counts[name],
        badge: CATEGORY_COLORS[name].badge,
        bar:   CATEGORY_COLORS[name].bar,
      }))
  }, [voters])

  // Build surname breakdown per category
  const surnamesByJaati = useMemo(() => {
    if (!voters) return {}
    const map = {}   // category → Map(surname → count)
    for (const v of voters) {
      const j = inferJaatiDyn(v)
      const nm = (v.name || '').trim()
      if (!nm) continue
      const surname = nm.split(/\s+/).pop() || '(blank)'
      if (!map[j]) map[j] = new Map()
      map[j].set(surname, (map[j].get(surname) || 0) + 1)
    }
    // Convert to sorted arrays
    const out = {}
    for (const [k, m] of Object.entries(map)) {
      out[k] = [...m.entries()].sort((a, b) => b[1] - a[1])
    }
    return out
  }, [voters])

  const boothJaati = useMemo(() => {
    if (!voters) return {}
    const byBooth = {}
    for (const v of voters) {
      const pn = v.part_no || '?'
      if (!byBooth[pn]) byBooth[pn] = { total: 0 }
      const j = inferJaatiDyn(v)
      byBooth[pn][j] = (byBooth[pn][j] || 0) + 1
      byBooth[pn].total += 1
    }
    return byBooth
  }, [voters])

  const topJaati = jaatiStats?.slice(0, 6) || []
  const muslimStat = jaatiStats?.find(j => j.name === 'Muslim')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mr-3" />
        Loading voter data for community analysis...
      </div>
    )
  }

  if (!voters) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center text-yellow-700">
        <div className="text-3xl mb-2">⚠️</div>
        <p className="font-semibold">Voter data not loaded yet.</p>
        <p className="text-sm mt-1">Please open the Search tab first to trigger data loading, then return here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 flex gap-2">
        <span className="text-lg shrink-0">⚠️</span>
        <span>
          <strong>Disclaimer:</strong> Electoral rolls do not contain caste / religion data.
          Categorisation is inferred from the voter's <strong>surname</strong> (last word of
          the name) using a mapping of the most common Bhavnagar-area surnames, and from
          the <strong>polling area name</strong> (Masjid / Idgah → Muslim). The
          <strong>"Other"</strong> bucket includes voters whose surname was corrupted by
          the PDF's OCR process and cannot be reliably mapped — these are NOT a real
          community. All figures are <strong>estimates</strong> — verify with community
          surveys before use.
        </span>
      </div>

      {/* Summary cards */}
      {muslimStat && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-700">{muslimStat.count.toLocaleString('en-IN')}</div>
            <div className="text-sm font-medium text-green-600 mt-0.5">Muslim Voters</div>
            <div className="text-xs text-green-500 mt-0.5">{(muslimStat.count / voters.length * 100).toFixed(1)}% of ward</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{(voters.length - muslimStat.count).toLocaleString('en-IN')}</div>
            <div className="text-sm font-medium text-blue-600 mt-0.5">Hindu / Other Voters</div>
            <div className="text-xs text-blue-500 mt-0.5">{((voters.length - muslimStat.count) / voters.length * 100).toFixed(1)}% of ward</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-700">{voters.length.toLocaleString('en-IN')}</div>
            <div className="text-sm font-medium text-orange-600 mt-0.5">Total Voters</div>
            <div className="text-xs text-orange-500 mt-0.5">Ward 6, Bhavnagar</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">{Math.ceil(voters.length * 0.55).toLocaleString('en-IN')}</div>
            <div className="text-sm font-medium text-purple-600 mt-0.5">Win Target (55%)</div>
            <div className="text-xs text-purple-500 mt-0.5">Votes needed to win</div>
          </div>
        </div>
      )}

      {/* Overall distribution */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h2 className="font-bold text-gray-800 mb-1">
          Community Distribution (Estimated) — {voters.length.toLocaleString('en-IN')} voters
        </h2>
        <div className="flex flex-wrap gap-2 mb-5">
          {jaatiStats?.map(j => (
            <span key={j.name} className={`px-3 py-1.5 rounded-full text-xs font-semibold ${j.badge}`}>
              {j.name} ({j.count.toLocaleString('en-IN')})
            </span>
          ))}
        </div>
        <div className="space-y-2.5">
          {jaatiStats?.map(j => (
            <div key={j.name} className="flex items-center gap-3">
              <div className="w-40 text-xs text-gray-600 text-right shrink-0 truncate">{j.name}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${j.bar}`}
                  style={{ width: `${Math.max(0.5, j.count / voters.length * 100).toFixed(1)}%`, minWidth: '8px' }}
                />
              </div>
              <div className="w-32 text-xs text-gray-500 shrink-0">
                {j.count.toLocaleString('en-IN')} ({(j.count / voters.length * 100).toFixed(1)}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Surname breakdown by category */}
      <SurnameBreakdown surnamesByJaati={surnamesByJaati} />

      {/* Booth-wise table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 bg-blue-900 text-white font-semibold text-sm">
          Booth-wise Community Breakdown (Top 6 categories)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs">
                <th className="text-left px-4 py-2.5 text-gray-600 font-semibold">Booth</th>
                <th className="text-right px-3 py-2.5 text-gray-600 font-semibold">Total</th>
                {topJaati.map(j => (
                  <th key={j.name} className="text-right px-3 py-2.5 text-gray-600 font-semibold">{j.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(boothJaati)
                .filter(([k]) => k !== '?' && k !== '')
                .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                .map(([pn, counts]) => (
                  <tr key={pn} className="border-b border-gray-50 hover:bg-orange-50">
                    <td className="px-4 py-2 font-medium text-orange-600">Booth {pn}</td>
                    <td className="px-3 py-2 text-right font-bold">{(counts.total || 0).toLocaleString('en-IN')}</td>
                    {topJaati.map(j => (
                      <td key={j.name} className={`px-3 py-2 text-right ${
                        j.name === 'Muslim' && (counts[j.name] || 0) > 0 ? 'text-green-700 font-semibold' : 'text-gray-600'
                      }`}>
                        {(counts[j.name] || 0).toLocaleString('en-IN')}
                        {j.name === 'Muslim' && counts.total > 0 && (counts[j.name] || 0) > 0
                          ? <span className="text-xs text-green-500 ml-1">({((counts[j.name]||0)/counts.total*100).toFixed(0)}%)</span>
                          : null}
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Surname breakdown: show which surnames are grouped into which jaati ──
function SurnameBreakdown({ surnamesByJaati }) {
  const [expanded, setExpanded] = useState({})
  const [search, setSearch] = useState('')

  const toggle = (cat) => setExpanded(p => ({ ...p, [cat]: !p[cat] }))

  // If searching, find which category each matching surname belongs to
  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.trim()
    const results = []
    for (const cat of CATEGORY_ORDER) {
      const list = surnamesByJaati[cat] || []
      for (const [sur, count] of list) {
        if (sur.includes(q)) results.push({ cat, surname: sur, count })
      }
    }
    return results.sort((a, b) => b.count - a.count).slice(0, 100)
  }, [search, surnamesByJaati])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-indigo-900 text-white font-semibold text-sm flex items-center justify-between">
        <span>Surname → Jaati Mapping (from actual voter data)</span>
        <input
          type="text"
          placeholder="Search surname..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs px-3 py-1 rounded bg-white text-gray-800 w-48"
        />
      </div>

      {searchResults ? (
        <div className="p-4">
          {searchResults.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-4">
              No surname matching "<span className="font-mono">{search}</span>" found.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {searchResults.map(({ cat, surname, count }, i) => {
                const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']
                return (
                  <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${col.badge}`}>
                    {surname} <span className="opacity-90">({count})</span>
                    <span className="ml-1 opacity-80">· {cat}</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {CATEGORY_ORDER.map(cat => {
            const list = surnamesByJaati[cat] || []
            if (list.length === 0) return null
            const total = list.reduce((s, [, c]) => s + c, 0)
            const col = CATEGORY_COLORS[cat] || CATEGORY_COLORS['Other']
            const isOpen = !!expanded[cat]
            const shown = isOpen ? list : list.slice(0, 15)
            return (
              <div key={cat} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${col.badge}`}>
                      {cat}
                    </span>
                    <span className="text-xs text-gray-500">
                      {list.length} unique surnames · {total.toLocaleString('en-IN')} voters
                    </span>
                  </div>
                  {list.length > 15 && (
                    <button
                      onClick={() => toggle(cat)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      {isOpen ? '− Show top 15' : `+ Show all ${list.length}`}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {shown.map(([surname, count]) => (
                    <span
                      key={surname}
                      className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-mono"
                      title={`${count} voters`}
                    >
                      {surname} <span className="text-gray-500">({count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
