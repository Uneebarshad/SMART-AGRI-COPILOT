/**
 * Static district list (frontend-spec.md §5.1) — `/welcome` makes no network
 * calls, so districts live here as labeled static data. Punjab's 36 districts
 * lead (the agri heartland), then ICT and other provinces' major districts.
 * `name.ur` renders in Urdu; other locales fall back to the English name.
 */
export const DISTRICTS = [
  // Punjab
  { id: 'attock', name: { en: 'Attock', ur: 'اٹک' } },
  { id: 'bahawalnagar', name: { en: 'Bahawalnagar', ur: 'بہاولنگر' } },
  { id: 'bahawalpur', name: { en: 'Bahawalpur', ur: 'بہاولپور' } },
  { id: 'bhakkar', name: { en: 'Bhakkar', ur: 'بھکر' } },
  { id: 'chakwal', name: { en: 'Chakwal', ur: 'چکوال' } },
  { id: 'chiniot', name: { en: 'Chiniot', ur: 'چنیوٹ' } },
  { id: 'dera-ghazi-khan', name: { en: 'Dera Ghazi Khan', ur: 'ڈیرہ غازی خان' } },
  { id: 'faisalabad', name: { en: 'Faisalabad', ur: 'فیصل آباد' } },
  { id: 'gujranwala', name: { en: 'Gujranwala', ur: 'گوجرانوالہ' } },
  { id: 'gujrat', name: { en: 'Gujrat', ur: 'گجرات' } },
  { id: 'hafizabad', name: { en: 'Hafizabad', ur: 'حافظ آباد' } },
  { id: 'jhang', name: { en: 'Jhang', ur: 'جھنگ' } },
  { id: 'jhelum', name: { en: 'Jhelum', ur: 'جہلم' } },
  { id: 'kasur', name: { en: 'Kasur', ur: 'قصور' } },
  { id: 'khanewal', name: { en: 'Khanewal', ur: 'خانیوال' } },
  { id: 'khushab', name: { en: 'Khushab', ur: 'خوشاب' } },
  { id: 'lahore', name: { en: 'Lahore', ur: 'لاہور' } },
  { id: 'layyah', name: { en: 'Layyah', ur: 'لیہ' } },
  { id: 'lodhran', name: { en: 'Lodhran', ur: 'لودھراں' } },
  { id: 'mandi-bahauddin', name: { en: 'Mandi Bahauddin', ur: 'منڈی بہاؤالدین' } },
  { id: 'mianwali', name: { en: 'Mianwali', ur: 'میانوالی' } },
  { id: 'multan', name: { en: 'Multan', ur: 'ملتان' } },
  { id: 'muzaffargarh', name: { en: 'Muzaffargarh', ur: 'مظفر گڑھ' } },
  { id: 'nankana-sahib', name: { en: 'Nankana Sahib', ur: 'ننکانہ صاحب' } },
  { id: 'narowal', name: { en: 'Narowal', ur: 'نارووال' } },
  { id: 'okara', name: { en: 'Okara', ur: 'اوکاڑہ' } },
  { id: 'pakpattan', name: { en: 'Pakpattan', ur: 'پاکپتن' } },
  { id: 'rahim-yar-khan', name: { en: 'Rahim Yar Khan', ur: 'رحیم یار خان' } },
  { id: 'rajanpur', name: { en: 'Rajanpur', ur: 'رجن پور' } },
  { id: 'rawalpindi', name: { en: 'Rawalpindi', ur: 'راولپنڈی' } },
  { id: 'sahiwal', name: { en: 'Sahiwal', ur: 'ساہیوال' } },
  { id: 'sargodha', name: { en: 'Sargodha', ur: 'سرگودھا' } },
  { id: 'sheikhupura', name: { en: 'Sheikhupura', ur: 'شیخوپورہ' } },
  { id: 'sialkot', name: { en: 'Sialkot', ur: 'سیالکوٹ' } },
  { id: 'toba-tek-singh', name: { en: 'Toba Tek Singh', ur: 'ٹوبہ ٹیک سنگھ' } },
  { id: 'vehari', name: { en: 'Vehari', ur: 'ویہاری' } },
  // Islamabad Capital Territory
  { id: 'islamabad', name: { en: 'Islamabad', ur: 'اسلام آباد' } },
  // Sindh (major districts)
  { id: 'karachi', name: { en: 'Karachi', ur: 'کراچی' } },
  { id: 'hyderabad', name: { en: 'Hyderabad', ur: 'حیدرآباد' } },
  { id: 'sukkur', name: { en: 'Sukkur', ur: 'سکھر' } },
  { id: 'larkana', name: { en: 'Larkana', ur: 'لاڑکانہ' } },
  { id: 'shaheed-benazirabad', name: { en: 'Shaheed Benazirabad', ur: 'شہید بینظیرآباد' } },
  // Khyber Pakhtunkhwa (major districts)
  { id: 'peshawar', name: { en: 'Peshawar', ur: 'پشاور' } },
  { id: 'mardan', name: { en: 'Mardan', ur: 'مردان' } },
  { id: 'swat', name: { en: 'Swat', ur: 'سوات' } },
  { id: 'dera-ismail-khan', name: { en: 'Dera Ismail Khan', ur: 'ڈیرہ اسماعیل خان' } },
  { id: 'abbottabad', name: { en: 'Abbottabad', ur: 'ایبٹ آباد' } },
  // Balochistan (major district)
  { id: 'quetta', name: { en: 'Quetta', ur: 'کوئٹہ' } },
];

/** Localized display name for a district entry; falls back to English. */
export function districtName(district, lang) {
  return district?.name?.[lang] ?? district?.name?.en ?? '';
}
