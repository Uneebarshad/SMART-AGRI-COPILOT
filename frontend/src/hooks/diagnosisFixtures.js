/**
 * Diagnosis fixture data (frontend-spec.md §22-I): labeled stand-ins shaped
 * like the §15.6 response, one bundle per demo outcome. The hook selects by
 * crop/notes so every result state (diagnosed at each confidence tier, healthy,
 * uncertain) is reachable deterministically. Bundles carry all three languages
 * so saved scans keep localizing after a language switch.
 */

export const FIXTURE_DELAY_MS = 7000;

function wheatLeafRust() {
  return {
    en: {
      disease: { id: 'leaf-rust', name: 'Wheat leaf rust' },
      confidence: 0.87,
      severity: 'moderate',
      symptoms: [
        'Orange-red powdery spots on the upper side of leaves',
        'Spots spread quickly in cool, humid weather',
        'Badly infected leaves turn yellow and dry out',
      ],
      treatment_steps: [
        'Spray a recommended fungicide (e.g., propiconazole) within 3 days of seeing spots',
        'Spray early morning or after 5 pm when the wind is low',
        'Use the dose recommended per acre — do not add extra chemicals',
        'Repeat the spray after 10–14 days if spots are still spreading',
      ],
      prevention: [
        'Grow rust-resistant wheat varieties',
        'Avoid very dense sowing so air can move through the crop',
        'Remove and burn infected crop remains after harvest',
      ],
    },
    ur: {
      disease: { id: 'leaf-rust', name: 'گندم کی پتی زنگ' },
      confidence: 0.87,
      severity: 'moderate',
      symptoms: [
        'پتوں کی اوپری سطح پر نارنجی سرخ سفوفی دھبے',
        'ٹھنڈی اور نم موسم میں دھبے تیزی سے پھیلتے ہیں',
        'زیادہ متاثر پتے پیلے ہو کر خشک ہو جاتے ہیں',
      ],
      treatment_steps: [
        'دھبے نظر آنے کے 3 دن کے اندر تجویز کردہ فنگسائیڈ (مثلاً پروپیکونازول) اسپرے کریں',
        'صبح سویرے یا شام 5 بجے کے بعد اسپرے کریں جب ہوا کم ہو',
        'فی ایکڑ تجویز کردہ خوراک استعمال کریں — اضافی کیمیکل نہ ملایں',
        'اگر دھبے پھیلتے رہیں تو 10 تا 14 دن بعد اسپرے دہرائیں',
      ],
      prevention: [
        'زنگ کے خلاف مزاحم گندم کی اقسام بوئیں',
        'بہت گہری بوائی سے بچیں تاکہ فصل میں ہوا گزر سکے',
        'فصل کٹنے کے بعد متاثر باقیات نکال کر جلا دیں',
      ],
    },
    'ur-Latn': {
      disease: { id: 'leaf-rust', name: 'Gandum ki patti zang' },
      confidence: 0.87,
      severity: 'moderate',
      symptoms: [
        'Paton ki oopri satah par narangi surkh safoofi daagh',
        'Thandi aur nam mausam mein daagh tezi se phailte hain',
        'Zyada mutaasir pattay peelay ho kar khushk ho jate hain',
      ],
      treatment_steps: [
        'Daagh nazar aane ke 3 din ke andar tajweez karda fungicide (masalan propiconazole) spray karein',
        'Subah sewere ya shaam 5 bajay ke baad spray karein jab hawa kam ho',
        'Fiy eker tajweez karda khoraq istemal karein — izafi chemical na milayen',
        'Agar daagh phailte rahen to 10 ta 14 din baad spray dohrayen',
      ],
      prevention: [
        'Zang ke khilaf muzahim gandum ki iqsam boayen',
        'Bohat gehri boai se bachein taakay fasal mein hawa guzar sake',
        'Fasal katne ke baad mutaasir baqiyat nikaal kar jala dein',
      ],
    },
  };
}

function cottonLeafCurl() {
  return {
    en: {
      disease: { id: 'cotton-leaf-curl', name: 'Cotton leaf curl virus' },
      confidence: 0.68,
      severity: 'low',
      symptoms: [
        'Leaves curl upward and thicken',
        'Yellow patches appear between the leaf veins',
        'Young plants grow slowly and stay small',
      ],
      treatment_steps: [
        'Pull out visibly infected plants and burn them away from the field',
        'Control whitefly with a recommended pesticide — it spreads the virus',
        'Strengthen the remaining plants with balanced fertilizer and steady watering',
      ],
      prevention: [
        'Plant cotton varieties tolerant to leaf curl virus',
        'Use yellow sticky traps or neem oil early in the season to manage whitefly',
        'Keep field borders clear of weeds that host whitefly',
      ],
    },
    ur: {
      disease: { id: 'cotton-leaf-curl', name: 'کپاس کا پتہ گھٹاؤ وائرس' },
      confidence: 0.68,
      severity: 'low',
      symptoms: [
        'پتے اوپر کی طرف مڑ کر موٹے ہو جاتے ہیں',
        'پتے کی رگوں کے درمیان پیلی دھاریاں نظر آتی ہیں',
        'ننھے پودے آہستہ بڑھتے ہیں اور چھوٹے رہتے ہیں',
      ],
      treatment_steps: [
        'متاثر پودے اکھاڑ کر کھیت سے دور جلا دیں',
        'سفید مکھی کے لیے تجویز کردہ کیٹ کش اسپرے کریں — یہی وائرس پھیلاتی ہے',
        'باقی پودوں کو متوازن کھاد اور باقاعدہ پانی سے مضبوط کریں',
      ],
      prevention: [
        'پتہ گھٹاؤ کے خلاف برداشت والی کپاس کی اقسام بوئیں',
        'سیزن کے شروع میں پیلی چپکنی پٹیاں یا نیم کا تیل استعمال کریں',
        'کھیت کے کنارے سفید مکھی والے خار پاتوں سے صاف رکھیں',
      ],
    },
    'ur-Latn': {
      disease: { id: 'cotton-leaf-curl', name: 'Kapas ka patta ghatao virus' },
      confidence: 0.68,
      severity: 'low',
      symptoms: [
        'Pattay oopar ki taraf mur kar mote ho jate hain',
        'Pattay ki ragon ke darmiyan peeli dahariyan nazar aati hain',
        'Nanhe poday aahista barhte hain aur chhote rehte hain',
      ],
      treatment_steps: [
        'Mutaasir poday ukhaar kar kheet se door jala dein',
        'Safaid makhi ke liye tajweez karda keet kash spray karein — yehi virus phelati hai',
        'Baqi podon ko mutawazan khaad aur baqaida paani se mazboot karein',
      ],
      prevention: [
        'Patta ghatao ke khilaf bardasht wali kapas ki iqsam boayen',
        'Season ke shuru mein peeli chipakni pattiyan ya neem ka tel istemal karein',
        'Kheet ke kinare safaid makhi wale khaar patton se saaf rakhein',
      ],
    },
  };
}

function maizeRust() {
  return {
    en: {
      disease: { id: 'maize-common-rust', name: 'Maize common rust' },
      confidence: 0.52,
      severity: 'moderate',
      symptoms: [
        'Small raised brown-orange pustules on the leaves',
        'Pustules often appear in bands across the leaf',
        'Heavily infected leaves dry out from the tip',
      ],
      treatment_steps: [
        'If the infection is light, no spray is usually needed',
        'For severe infection, spray a recommended fungicide before tasseling',
        'Improve field drainage — rust spreads in damp conditions',
      ],
      prevention: [
        'Choose rust-tolerant maize seed',
        'Avoid excess nitrogen fertilizer',
        'Rotate maize with a non-cereal crop',
      ],
    },
    ur: {
      disease: { id: 'maize-common-rust', name: 'مکئی کی عام زنگ' },
      confidence: 0.52,
      severity: 'moderate',
      symptoms: [
        'پتوں پر چھوٹے اُٹھے ہوئے بھورے نارنجی چھالے',
        'چھالے اکثر پتے پر پٹیوں کی صورت نظر آتے ہیں',
        'زیادہ متاثر پتے نوک سے خشک ہو جاتے ہیں',
      ],
      treatment_steps: [
        'اگر بیماری ہلکی ہو تو عموماً اسپرے کی ضرورت نہیں',
        'شدید صورت میں ٹاسل بننے سے پہلے تجویز کردہ فنگسائیڈ اسپرے کریں',
        'کھیت کی نکاسی بہتر کریں — نم حالت میں زنگ پھیلتی ہے',
      ],
      prevention: [
        'زنگ برداشت کرنے والا مکئی کا بیج چنیں',
        'زیادہ نائٹروجن کھاد سے پرہیز کریں',
        'مکئی کے بعد کوئی اناج کے علاوہ فصل بوئیں',
      ],
    },
    'ur-Latn': {
      disease: { id: 'maize-common-rust', name: 'Makai ki aam zang' },
      confidence: 0.52,
      severity: 'moderate',
      symptoms: [
        'Paton par chhote uthe hue bhoore narangi chhaale',
        'Chhaale aksar patta par pattiyon ki soorat mein nazar aate hain',
        'Zyada mutaasir pattay noke se khushk ho jate hain',
      ],
      treatment_steps: [
        'Agar bimari halki ho to aam tor par spray ki zaroorat nahi',
        'Shadeed soorat mein taasal banne se pehle tajweez karda fungicide spray karein',
        'Kheet ki nikasi behtar karein — nam haalat mein zang phailti hai',
      ],
      prevention: [
        'Zang bardasht karne wala makai ka beej chunein',
        'Zyada nitrogen khaad se parhez karein',
        'Makai ke baad koi anaj ke ilawa fasal boayen',
      ],
    },
  };
}

function riceBlast() {
  return {
    en: {
      disease: { id: 'rice-blast', name: 'Rice blast' },
      confidence: 0.91,
      severity: 'high',
      symptoms: [
        'Eye-shaped grey-brown spots with dark borders on leaves',
        'Spots join together and kill whole leaves quickly',
        'Neck blast dries the whole panicle upright',
      ],
      treatment_steps: [
        'Spray a recommended fungicide (e.g., tricyclazole) immediately',
        'Drain the field for a few days if it is flooded',
        'Apply potassium to strengthen the plants',
        'Treat seed with a fungicide before sowing next season',
      ],
      prevention: [
        'Use blast-resistant varieties',
        'Avoid excess nitrogen — it makes plants more prone to blast',
        'Keep plant spacing around 22–25 cm for airflow',
      ],
    },
    ur: {
      disease: { id: 'rice-blast', name: 'چاول کا بلاسٹ' },
      confidence: 0.91,
      severity: 'high',
      symptoms: [
        'پتوں پر آنکھ کی شکل کے سرمئی بھورے دھبے جن کے کنارے گہرے ہوں',
        'دھبے آپس میں مل کر پورے پتے کو جلد ختم کر دیتے ہیں',
        'گرے کی بلاسٹ پورا چھٹا سیدھا خشک کر دیتا ہے',
      ],
      treatment_steps: [
        'فوراً تجویز کردہ فنگسائیڈ (مثلاً ٹرائی سائیکلازول) اسپرے کریں',
        'اگر کھیت میں پانی کھڑا ہو تو چند دن نکاسی کریں',
        'پودوں کو مضبوط کرنے کے لیے پوٹاش ڈالیں',
        'اگلے سیزن کے لیے بیج کو فنگسائیڈ سے ٹریٹ کریں',
      ],
      prevention: [
        'بلاسٹ مزاحم اقسام استعمال کریں',
        'زیادہ نائٹروجن سے پرہیز کریں — اس سے بلاسٹ کا خطرہ بڑھتا ہے',
        'ہوا کے گزر کے لیے پودوں کے درمیان 22 تا 25 سینٹی میٹر فاصلہ رکھیں',
      ],
    },
    'ur-Latn': {
      disease: { id: 'rice-blast', name: 'Chawal ka blast' },
      confidence: 0.91,
      severity: 'high',
      symptoms: [
        'Paton par aankh ki shakal ke sarmei bhoore daagh jin ke kinare gehre hon',
        'Daagh aapas mein milkar poora patta jald khatam kar dete hain',
        'Gharay ki blast poora chhtha seedha khushk kar deta hai',
      ],
      treatment_steps: [
        'Foran tajweez karda fungicide (masalan tricyclazole) spray karein',
        'Agar kheet mein paani khara ho to Chand din nikasi karein',
        'Podon ko mazboot karne ke liye potash dalein',
        'Aglay season ke liye beej ko fungicide se treat karein',
      ],
      prevention: [
        'Blast muzahim iqsam istemal karein',
        'Zyada nitrogen se parhez karein — is se blast ka khatra barhta hai',
        'Hawa ke guzar ke liye podon ke darmiyan 22 ta 25 cm faasla rakhein',
      ],
    },
  };
}

function healthyResult() {
  return {
    en: {
      care_tips: [
        'Water regularly, preferably in the morning',
        'Check leaves weekly so early spots are caught fast',
        'Follow the fertilizer schedule recommended for your crop',
      ],
    },
    ur: {
      care_tips: [
        'باقاعدہ پانی دیں، ترجیحاً صبح کے وقت',
        'ہر ہفتے پتے دیکھیں تاکہ ابتدائی دھبے فوراً پکڑے جائیں',
        'اپنی فصل کے لیے تجویز کردہ کھاد کے شیڈول پر چلیں',
      ],
    },
    'ur-Latn': {
      care_tips: [
        'Baqaida paani dein, tarjeehan subah ke waqt',
        'Har haftay pattay dekhein taakay ibtidai daagh foran pakde jayen',
        'Apni fasal ke liye tajweez karda khaad ke schedule par chalein',
      ],
    },
  };
}

function uncertainResult() {
  return {
    en: { retake_tips: true },
    ur: { retake_tips: true },
    'ur-Latn': { retake_tips: true },
  };
}

const SCAN_BUNDLES = {
  wheat: wheatLeafRust(),
  cotton: cottonLeafCurl(),
  maize: maizeRust(),
  rice: riceBlast(),
  healthy: healthyResult(),
  uncertain: uncertainResult(),
};

/** Demo scan the dashboard fixture links to (useDashboard.js → /diagnosis/s-202). */
export const SEED_SCAN = {
  id: 's-202',
  crop: 'wheat',
  created_at: '2026-09-01T09:30:00Z',
  result: SCAN_BUNDLES.wheat,
};

const HEALTHY_NOTES = /healthy|صحت|sehat/i;
const UNCERTAIN_NOTES = /blur|dark|uncertain|دھند|dhund/i;

/** Picks the demo outcome: notes may ask for healthy/uncertain; else by crop. */
export function pickScanKind({ crop, notes = '' }) {
  if (HEALTHY_NOTES.test(notes)) return 'healthy';
  if (UNCERTAIN_NOTES.test(notes)) return 'uncertain';
  if (crop === 'other') return 'uncertain';
  return SCAN_BUNDLES[crop] ? crop : 'wheat';
}

export function getScanBundle(kind) {
  return SCAN_BUNDLES[kind] ?? SCAN_BUNDLES.wheat;
}

let fixtureSequence = 0;

export function nextScanId() {
  fixtureSequence += 1;
  return `s-${Date.now().toString(36)}${fixtureSequence.toString(36)}`;
}

/** Builds the §15.6-shaped response for the requested language. */
export function buildScanResponse(kind, language) {
  const bundle = getScanBundle(kind);
  const localized = bundle[language] ?? bundle.en;
  const response = {
    id: nextScanId(),
    status: kind === 'healthy' || kind === 'uncertain' ? kind : 'diagnosed',
    image_url: null,
    created_at: new Date().toISOString(),
  };
  if (response.status === 'diagnosed') {
    response.disease = localized.disease;
    response.confidence = localized.confidence;
    response.severity = localized.severity;
    response.symptoms = localized.symptoms;
    response.treatment_steps = localized.treatment_steps;
    response.prevention = localized.prevention;
  } else if (kind === 'healthy') {
    response.care_tips = localized.care_tips;
  }
  return { response, bundle, kind };
}
