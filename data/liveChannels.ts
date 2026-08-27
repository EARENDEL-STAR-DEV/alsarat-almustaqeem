export interface LiveChannel {
  id: string
  nameAr: string
  nameEn: string
  logo: string
  officialWebsite: string
  livePage: string
  descriptionAr: string
  descriptionEn: string
  category: 'tv' | 'radio'
  statusAr: string
  buttonAr: string
}

export const LIVE_CHANNELS: LiveChannel[] = [
  {
    id: 'quran-tv',
    nameAr: 'قناة القرآن الكريم السعودية',
    nameEn: 'Saudi Quran TV Channel',
    logo: '📖',
    officialWebsite: 'https://www.sba.sa/ar/tv-channel/quran-tv',
    livePage: 'https://aloula.sba.sa/ar/live/quran',
    descriptionAr: 'البث المباشر الرسمي لقناة القرآن الكريم من المسجد الحرام بمكة المكرمة، تابعة لهيئة الإذاعة والتلفزيون السعودية.',
    descriptionEn: 'Official live broadcast of the Saudi Quran TV Channel from Masjid al-Haram in Makkah.',
    category: 'tv',
    statusAr: 'بث مباشر',
    buttonAr: 'تشغيل',
  },
  {
    id: 'sunnah-tv',
    nameAr: 'قناة السنة النبوية',
    nameEn: 'Sunnah TV Channel',
    logo: '🕌',
    officialWebsite: 'https://www.sba.sa/ar/tv-channel/alsunah-alnabawia-tv',
    livePage: 'https://aloula.sba.sa/ar/live/sunna',
    descriptionAr: 'البث المباشر الرسمي لقناة السنة النبوية من المسجد النبوي بالمدينة المنورة، تابعة لهيئة الإذاعة والتلفزيون السعودية.',
    descriptionEn: 'Official live broadcast of the Sunnah TV Channel from Masjid an-Nabawi in Madinah.',
    category: 'tv',
    statusAr: 'بث مباشر',
    buttonAr: 'تشغيل',
  },
  {
    id: 'quran-radio',
    nameAr: 'إذاعة القرآن الكريم السعودية',
    nameEn: 'Saudi Quran Radio',
    logo: '🎧',
    officialWebsite: 'https://www.sba.sa/ar/radio-channel/radio-quran',
    livePage: 'https://radioplus.sba.sa/ar/live/4',
    descriptionAr: 'البث الصوتي المباشر الرسمي لإذاعة القرآن الكريم على مدار الساعة، تابعة لهيئة الإذاعة والتلفزيون السعودية.',
    descriptionEn: 'Official live audio broadcast of Saudi Quran Radio, 24 hours a day.',
    category: 'radio',
    statusAr: 'مشغل صوت مباشر',
    buttonAr: 'تشغيل / إيقاف',
  },
  {
    id: 'nidaa-al-islam-radio',
    nameAr: 'إذاعة نداء الإسلام',
    nameEn: 'Nidaa Al-Islam Radio',
    logo: '📻',
    officialWebsite: 'https://www.sba.sa/ar/radio-channel/radio-neda',
    livePage: 'https://radioplus.sba.sa/ar/live/1',
    descriptionAr: 'البث الصوتي المباشر الرسمي لإذاعة نداء الإسلام من مكة المكرمة، تابعة لهيئة الإذاعة والتلفزيون السعودية.',
    descriptionEn: 'Official live audio broadcast of Nidaa Al-Islam Radio from Makkah.',
    category: 'radio',
    statusAr: 'مشغل صوت مباشر',
    buttonAr: 'تشغيل / إيقاف',
  },
]
