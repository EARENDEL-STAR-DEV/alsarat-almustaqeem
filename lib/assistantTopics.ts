// Multilingual topic recognition for the site assistant (app/api/ai/chat/route.ts).
//
// All of the site's searchable content is Arabic, so a question asked in any other
// language can't be keyword-matched against it. Instead the question is matched against
// this glossary: each topic lists, for every site language, the words people use for it,
// and points at the exact site content that answers it. Arabic questions go through the
// same glossary first, because these hand-picked answers are more accurate than the
// keyword search (which, for example, matches "الجنة" inside "اللجنة").
//
// Matching rules (see normalizeQuery): the query is lowercased, Latin accents and Arabic
// diacritics are removed, punctuation becomes spaces, and the result is padded with a
// space on each side. A keyword that begins or ends with a space therefore only matches
// at a word boundary (" fe " is the whole Spanish word, not part of "café").
//
// A topic has one or more keyword groups and matches when every group has a hit. The
// topic with the most groups wins (so "pillars" + "faith" beats "pillars" alone); ties
// go to whichever topic comes first in TOPICS, which is why specific topics are listed
// before broad ones like "Islam" or "Allah".

export type TopicPick =
  | { faq: string }
  | { quran: [number, number] }
  | { hadith: number }
  | { adhkar: string }
  | { prophet: number }
  | { asma: number[] }
  | { seerah: string }
  | { live: string }

export interface Topic {
  id: string
  groups: string[][]
  picks: TopicPick[]
}

export function normalizeQuery(text: string): string {
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    // Latin combining accents only: Devanagari vowel signs are also combining marks
    // and must stay, or Hindi and Nepali words would no longer match.
    .replace(/[̀-ͯ]/g, '')
    // Arabic diacritics, tatweel, and the hamza/madda marks that NFD splits off أ إ آ,
    // which leaves a bare ا so all spellings of a word compare equal.
    .replace(/[ً-ٰٕـ]/g, '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
  return ` ${cleaned.trim()} `
}

// Keywords go through the same normalization (minus the padding) so they can be
// written naturally, with accents and hamzas.
function normalizeKeyword(k: string): string {
  const lead = k.startsWith(' ') ? ' ' : ''
  const trail = k.endsWith(' ') ? ' ' : ''
  return lead + normalizeQuery(k).trim() + trail
}

const PILLAR = ['pillar', 'ركن', 'اركان', 'ارکان', '支柱', '基柱', '功修', 'pilar', 'pilier', 'säule', 'saule', ' şart', 'rükün', 'rukun', 'столп', 'основ', 'स्तंभ', 'स्तम्भ', 'haligi', 'עמוד', 'יסוד', 'עיקר', 'trụ cột', 'pilastr', 'pelare', 'pelar', 'pilari', 'pilarit']
const ISLAM_OR_FIVE = ['islam', 'إسلام', 'اسلام', '伊斯兰', 'ислам', 'इस्लाम', 'אסלאם', 'איסלאם', 'hồi giáo', 'five', 'cinq', 'cinco', 'fünf', ' beş ', 'пять', '五', 'पाँच', 'पांच', ' lima ', 'limang', 'חמש', ' năm ', 'cinque', ' fem ', 'viisi', 'خمس', 'پانچ']
const FAITH = ['faith', 'belief', ' iman', 'إيمان', 'ایمان', '信仰', '伊玛尼', '信德', ' fe ', 'creencia', ' foi ', 'croyance', 'glaube', ' веры', ' вера', 'веров', 'иман', 'ईमान', 'आस्था', 'विश्वास', 'pananampalataya', 'אמונה', 'đức tin', 'niềm tin', ' fede', ' tron', ' tro ', 'trons', 'usko']
const QURAN = ['quran', 'qur an', 'koran', 'koraan', 'coran', 'corano', 'kuran', 'коран', '古兰', '可兰', 'क़ुरआन', 'कुरआन', 'कुरान', 'क़ुरान', 'قران', 'קוראן', 'quran']
const VIRTUE_READ = ['read', 'recit', 'virtue', 'merit', 'reward', 'benefit', 'lire', 'lecture', 'mérite', 'vertu', 'leer', 'lectura', 'virtud', 'mérito', 'lesen', 'vorzug', 'tugend', 'okum', 'fazilet', 'faziyet', 'чтени', 'читать', 'достоинств', 'награ', '读', '诵', '贵', 'पढ़', 'पाठ', 'फ़ज़ीलत', 'फजीलत', 'पुण्य', 'membaca', ' baca', 'keutamaan', 'pagbasa', 'pagbabasa', 'kabutihan', 'kahalagahan', 'קריא', 'מעלת', ' đọc', 'lợi ích', 'ân phúc', 'पढ्नु', 'पढ्न', 'महिमा', 'leggere', 'lettura', 'läsa', 'läsning', 'förtjänst', 'lukem', 'ansio', 'فضل', 'قراءة', 'تلاوة', 'پڑھ', 'فضیلت']
const FORGIVE = ['forgiv', 'istighfar', 'istigfar', 'repent', 'pardon', 'perdón', 'vergebung', 'reue', 'tövbe', 'istiğfar', 'af dile', 'прощени', 'истигфар', 'покаяни', '宽恕', '求饶', '饶恕', '求恕', '忏悔', 'क्षमा', 'माफ़ी', 'माफी', 'इस्तिग़फ़ार', 'इस्तिग्फार', 'तौबा', 'ampun', 'tobat', 'taubat', 'kapatawaran', 'patawad', 'pagsisisi', 'מחילה', 'סליחה', 'אסתגפאר', 'תשובה', 'tha thứ', 'sám hối', 'perdono', 'pentim', 'förlåtelse', 'anteeks', 'katumu', 'استغفار', 'مغفرة', 'توبة', 'توبه', 'مغفرت', 'معافی']
const PRAYER = ['prayer', ' pray', 'salah', 'salat', 'namaz', 'prière', ' prier', 'oración', 'rezar', 'gebet', ' beten', 'молитв', 'намаз', '礼拜', '拜功', '祈祷', 'नमाज़', 'नमाज', 'sholat', 'shalat', 'dasal', 'darasal', 'dalangin', 'panalangin', 'תפיל', 'צלאה', 'preghier', 'pregare', ' bön ', 'bönen', 'bönens', ' ber ', 'rukou', 'lễ nguyện', 'cầu nguyện', 'صلاة', 'صلاه', 'الصلوات', 'نماز']
const FAST = ['fast', 'ramadan', 'ramazan', 'рамадан', 'пост ', 'поста', '斋', 'रमज़ान', 'रमजान', 'रोज़ा', 'रोजा', 'puasa', 'ayuno', 'ayuno', 'jeûn', 'fasten', 'oruç', 'צום', 'רמדאן', 'nhịn chay', 'digiun', 'fasta', 'paast', 'صيام', 'صوم', 'رمضان', 'روزہ', 'روزه']
const ZAKAT = ['zakat', 'zakah', 'zekat', 'закят', 'закат', '天课', 'ज़कात', 'जकात', 'زكاة', 'زکوٰۃ', 'زکات', 'זכאת']
const CHARITY = ['charity', 'sadaqa', 'sadaka', 'aumône', 'caridad', 'limosna', 'almosen', 'spende', 'милостын', 'садак', 'благотвор', '施舍', '慈善', 'दान', 'सदका', 'sedekah', 'kawanggawa', 'limos', 'צדקה', 'từ thiện', 'bố thí', 'carità', 'elemosin', 'välgörenhet', 'allmosa', 'hyväntekeväisyy', 'almu', 'صدقة', 'صدقہ', 'خیرات']
const HAJJ = ['hajj', ' haj ', 'hadj', ' hac ', ' hacc', 'хадж', '朝觐', ' हज', ' haji', 'חג׳', "חג'", ' حج', 'الحج', 'hành hương', 'pellegrinaggio', 'pilgrim', 'peregrin', 'pèlerinage', 'pilgerfahrt', 'vallfärd', 'pyhiinvaell']
const UMRAH = ['umrah', 'umra', 'omra', 'عمرة', 'عمره', 'умр', '副朝', 'उमरा', 'עומרה', 'عمرہ']
const WUDU = ['wudu', 'wudhu', 'ablution', 'abdest', 'омовени', 'вуду', '小净', '净礼', 'वुज़ू', 'वुजू', 'ablución', 'abluzion', 'waschung', 'tvagning', 'pesu', 'וודוא', 'רחצה', 'tẩy', 'وضوء', 'وضو']
const MUHAMMAD = ['muhammad', 'mohammed', 'mohamed', 'muhammed', 'mahoma', 'maometto', 'мухаммад', 'магомет', '穆罕默德', 'मुहम्मद', 'मोहम्मद', 'מוחמד', 'محمد']
const ALLAH = ['allah', ' god', 'gott', ' dieu', ' dios', ' бог', 'аллах', '神', '真主', 'ईश्वर', 'भगवान', 'अल्लाह', 'tuhan', 'diyos', 'אלוהים', 'אללה', ' dio ', ' gud', 'jumala', 'thượng đế', 'الله', 'خدا']
const NAMES = ['name', ' nom', 'nombre', 'namen', 'isim', 'имен', 'имя', '名', 'नाम', ' nama', 'pangalan', 'שמות', ' שם ', ' tên ', ' nome', ' nomi ', ' namn', 'nimi', 'nime', 'asma', 'اسماء', ' اسم', ' نام', ' 99 ']
const PARENTS = ['parent', 'mother', 'father', ' mère', ' père', 'padre', 'madre', 'eltern', 'mutter', 'vater', ' anne', ' baba', 'ebeveyn', 'родител', 'мать', 'отец', '父母', '母亲', '父亲', 'माता', 'पिता', 'orang tua', ' ibu ', 'magulang', 'הורים', 'אמא', 'אבא', 'cha mẹ', 'genitori', 'föräldr', 'vanhem', 'äiti', 'الوالدين', 'والدين', 'الام', 'ماں', 'باپ', 'والدین', 'आमाबुबा', 'आमा']
const PATIENCE = ['patien', 'sabr', 'paciencia', 'geduld', 'sabır', 'терпени', 'сабр', '忍耐', '耐心', 'धैर्य', 'सब्र', 'sabar', 'pasensya', 'tiyaga', 'סבלנות', 'kiên nhẫn', 'pazienza', 'tålamod', 'kärsiv', 'صبر']
const MERCY = ['mercy', 'compassion', 'miséricorde', 'misericordia', 'barmherzig', 'merhamet', 'милосерди', 'милость', '怜悯', '仁慈', '慈悲', 'दया', 'रहमत', 'rahmat', 'kasih sayang', ' awa ', 'habag', 'רחמים', 'nhân từ', 'thương xót', 'misericord', 'barmhärt', ' armo', 'رحمة', 'رحمت']
const HONESTY = ['honest', 'truthful', 'sincer', 'honnête', 'vérité', 'honestidad', 'verdad', 'wahrheit', 'ehrlich', 'dürüst', 'doğru', 'честн', 'правд', '诚实', 'ईमानदार', ' सच', 'jujur', 'katapatan', 'יושר', 'אמת', 'trung thực', 'onest', 'ärlig', 'sanning', 'rehell', 'totuu', 'صدق', 'سچ']
const INTENTION = ['intention', 'niyyah', 'niyya', 'intención', 'absicht', 'niyet', 'намерени', '意图', '举意', 'नीयत', 'नियत', ' niat', 'intensyon', 'hangarin', 'כוונה', 'ý định', 'intenzion', 'avsikt', 'aikomu', 'نية', 'نیت']
const ANGER = ['anger', 'angry', 'colère', ' ira ', 'enojo', ' zorn', ' wut', 'öfke', 'гнев', 'злост', '愤怒', '生气', 'क्रोध', 'गुस्सा', 'marah', 'galit', 'כעס', 'tức giận', 'giận', 'rabbia', 'ilska', 'vrede', ' viha', 'suuttu', 'غضب', 'غصہ', 'रिस']
const KNOWLEDGE = ['knowledge', 'connaissance', ' savoir', 'conocimiento', 'wissen', ' ilim', 'bilgi', 'знани', '知识', 'ज्ञान', 'इल्म', ' ilmu', 'kaalaman', 'ידע', 'tri thức', 'conoscenza', 'kunskap', ' tieto', 'علم']
const DUA = ['dua ', ' du a ', 'supplication', 'invocation', 'súplica', 'bittgebet', ' dua', 'дуа', 'мольб', '祈求', '都阿', 'दुआ', ' doa ', 'cầu xin', 'invocazion', 'supplica', 'åkallan', 'دعاء', ' دعا ']
const DHIKR = ['dhikr', 'zikr', 'adhkar', 'azkar', 'remembrance', 'souvenir', 'recuerdo', 'gedenken', 'zikir', 'зикр', 'азкар', 'поминани', '记主', '赞念', 'ज़िक्र', 'जिक्र', 'अज़्कार', 'dzikir', 'pag-alala', 'זיכר', "אד'כאר", 'tưởng niệm', 'ricordo', 'åminnelse', 'muistam', 'ذكر', 'اذكار', 'ذکر', 'اذکار']
const MORNING_EVENING = ['morning', 'evening', ' matin', ' soir', 'mañana', ' tarde', 'morgen', ' abend', 'sabah', 'akşam', ' утр', 'вечер', '早晨', '早上', '晚上', '傍晚', 'सुबह', 'शाम', ' pagi', 'petang', ' sore', 'umaga', ' gabi', 'בוקר', 'ערב', 'buổi sáng', 'buổi chiều', 'mattin', ' sera ', 'morgon', 'kväll', ' aamu', ' ilta', 'صباح', 'مساء', 'صبح', ' شام', 'बिहान', 'बेलुका']
const SLEEP = ['sleep', 'dormir', 'schlaf', 'uyku', ' uyu', ' сон', 'спать', ' сна', '睡', 'नींद', 'सोने', 'tidur', 'tulog', 'שינה', ' ngủ', 'sonno', 'dormi', 'sömn', ' sova', ' uni ', 'nukku', 'نوم', 'نیند', 'सुत्ने', 'निद्रा']
const TRAVEL = ['travel', 'journey', 'voyage', 'viaje', 'reise', 'seyahat', 'yolculuk', 'путешеств', 'поездк', '旅行', '出行', 'यात्रा', 'सफ़र', 'perjalanan', ' safar', 'paglalakbay', 'נסיעה', 'du lịch', 'viaggio', ' resa ', 'resor', ' matka', 'سفر']
const FOOD = ['food', ' eat', 'nourriture', 'manger', ' repas', 'comida', ' comer', ' essen', 'yemek', ' еда', ' пищ', '食', '吃', 'खाना', 'भोजन', 'makan', 'pagkain', ' kain', 'אוכל', 'ăn uống', ' cibo', 'mangiare', ' mat ', ' äta', 'ruoka', ' syö', 'طعام', 'اكل', 'کھانا']
const JESUS = ['jesus', 'jésus', ' isa ', ' issa ', 'иисус', ' иса', '耶稣', '尔撒', 'ईसा', 'यीशु', 'yesus', 'hesus', 'ישו', 'עיסא', 'giê su', 'gesù', 'jeesus', 'عيسى', 'عیسیٰ', 'عیسی']
const MOSES = ['moses', 'moïse', 'moisés', ' mose ', ' musa', 'моисе', 'муса', '摩西', '穆萨', 'मूसा', 'משה', 'מוסא', 'môi se', ' moose', 'موسى', 'موسیٰ']
const ABRAHAM = ['abraham', 'ibrahim', 'авраам', 'ибрахим', '易卜拉欣', '亚伯拉罕', 'इब्राहीम', 'इब्राहिम', 'אברהם', 'abramo', 'aabraham', 'ابراهيم', 'ابراہیم']
const NOAH = ['noah', ' noé', ' noe ', ' nuh', ' ной', 'нух', '挪亚', '努哈', 'नूह', 'נח', 'noè', ' noak', ' nooa', 'نوح']
const ADAM = ['adam', 'адам', '阿丹', '亚当', 'आदम', 'אדם', 'aadam', 'ادم', 'آدم']
const JOSEPH = ['joseph', 'yusuf', ' josef', 'юсуф', 'иосиф', '优素福', '约瑟', 'यूसुफ', 'יוסף', 'giuseppe', 'joosef', 'giô sép', 'يوسف', 'یوسف']
const JONAH = ['jonah', ' jonas', 'yunus', 'юнус', ' иона', '尤努斯', '约拿', 'यूनुस', 'יונה', 'giona', ' joona', 'giô na', 'يونس']
const DAVID = ['david', 'dawud', 'davud', 'давуд', 'давид', '达伍德', '大卫', 'दाऊद', 'דוד', 'davide', 'daavid', 'đa vít', 'داود']
const SOLOMON = ['solomon', 'sulayman', 'süleyman', 'сулейман', 'соломон', '苏莱曼', '所罗门', 'सुलैमान', 'שלמה', 'salomone', 'salomo', 'salomon', 'sa lô môn', 'سليمان', 'سلیمان']
const PROPHETS = ['prophet', 'messenger', 'prophète', 'profeta', 'peygamber', 'пророк', '先知', '使者', 'पैगम्बर', 'पैगंबर', 'नबी', ' nabi', 'propeta', 'נביא', 'nhà tiên tri', 'profet', 'نبي', 'انبياء', 'نبی', 'پیغمبر', 'رسول']
const HIJRA = ['hijra', 'hijrah', 'hégire', 'hégira', 'hidschra', 'hicret', 'хиджр', '迁徙', 'हिजरत', 'הג׳רה', "הג'רה", 'egira', 'هجرة', 'ہجرت']
const SEERAH = ['seerah', 'sirah', ' sira', 'biograph', 'biografía', 'biografie', 'siyer', 'биограф', 'сира', '生平', '传记', 'जीवनी', 'सीरत', 'talambuhay', 'ביוגרפיה', 'סירה', 'tiểu sử', 'biografia', 'biografi', 'elämäkerta', 'سيرة', 'سیرت']
const PARADISE = ['paradise', 'heaven', 'jannah', 'paradis', 'paraíso', 'paradies', 'cennet', ' рай', '天堂', '乐园', 'जन्नत', 'स्वर्ग', 'surga', 'langit', 'גן עדן', 'thiên đàng', 'paradiso', 'paratiisi', 'الجنة', 'جنت']
const DEATH = ['death', ' die ', ' mort', 'muerte', ' tod ', 'ölüm', 'смерт', '死', 'मृत्यु', 'मौत', 'kematian', 'kamatayan', 'מוות', 'cái chết', ' morte', 'döden', 'kuolem', 'الموت', ' موت']
const ANGELS = ['angel', ' ange', 'ángel', 'engel', 'melek', 'ангел', '天使', 'फ़रिश्त', 'फरिश्त', 'malaikat', 'anghel', 'מלאך', 'מלאכים', 'thiên thần', 'ängl', 'enkel', 'ملائكة', 'ملائکہ', 'فرشت', 'स्वर्गदूत']
const FRIDAY = ['friday', 'jumu', 'vendredi', 'viernes', 'freitag', ' cuma', 'пятниц', 'джума', '主麻', '聚礼', 'जुमा', 'शुक्रवार', 'jumat', 'biyernes', 'שישי', 'thứ sáu', 'venerd', 'fredag', 'perjanta', 'الجمعة', 'جمعہ']
const MAKKAH = ['kaaba', ' kaba', 'mecca', 'makkah', 'mekka', 'mekke', 'mecque', ' meca', 'мекк', 'кааб', '麦加', '克尔白', 'मक्का', 'काबा', 'mekah', 'מכה', 'כעבה', 'مكة', 'الكعبة', 'مکہ', 'کعبہ']
const CHARACTER = ['character', 'manners', 'akhlaq', 'caractère', 'carácter', 'carattere', 'ahlak', 'нрав', 'характер', '品德', '品格', 'अख़लाक़', 'अखलाक', 'akhlak', 'ugali', 'מידות', 'đạo đức', 'karaktär', 'luonne', 'اخلاق', 'چال چلن']
const TAWHID = ['tawhid', 'tawheed', 'tauhid', 'توحيد', 'توحید', 'monothe', 'monoteí', 'תווחיד', 'תוחיד', 'monoteism', 'tevhid', 'единобожи', 'таухид', 'एकेश्वरवाद', 'तौहीद', 'keesaan', 'pagkakaisa ng diyos', 'ייחוד', 'מונותאיזם', 'độc thần', 'yksijumal', '认主独一', '唯一', '一神']
const WHO_IS = [' who ', 'qui est', 'quién', ' wer ', ' kim', ' кто', '谁', 'कौन', 'siapa', 'sino ', ' מי ', ' ai ', ' chi ', ' vem ', ' kuka', ' من هو', ' کون', 'को हु']

export const TOPICS: Topic[] = [
  { id: 'pillarsIman', groups: [PILLAR, FAITH], picks: [{ quran: [2, 285] }, { quran: [4, 136] }] },
  { id: 'pillarsIslam', groups: [PILLAR, ISLAM_OR_FIVE], picks: [{ faq: 'what-is-islam' }, { hadith: 2 }] },
  { id: 'quranVirtue', groups: [QURAN, VIRTUE_READ], picks: [{ hadith: 109 }, { quran: [35, 29] }] },
  { id: 'morningEvening', groups: [MORNING_EVENING], picks: [{ adhkar: 'S26' }] },
  { id: 'istighfar', groups: [FORGIVE], picks: [{ quran: [71, 10] }, { hadith: 37 }, { adhkar: 'S128' }] },
  { id: 'tawhid', groups: [TAWHID], picks: [{ quran: [112, 1] }, { faq: 'who-is-allah' }, { hadith: 126 }] },
  { id: 'fasting', groups: [FAST], picks: [{ faq: 'what-is-ramadan' }, { quran: [2, 183] }, { hadith: 112 }] },
  { id: 'zakat', groups: [ZAKAT], picks: [{ quran: [9, 103] }, { hadith: 2 }] },
  { id: 'umrah', groups: [UMRAH], picks: [{ quran: [2, 196] }, { adhkar: 'S114' }] },
  { id: 'hajj', groups: [HAJJ], picks: [{ faq: 'what-is-hajj' }, { quran: [3, 97] }, { adhkar: 'S114' }] },
  { id: 'wudu', groups: [WUDU], picks: [{ adhkar: 'S7' }, { adhkar: 'S8' }, { hadith: 20 }] },
  { id: 'prayer', groups: [PRAYER], picks: [{ faq: 'why-muslims-pray' }, { quran: [29, 45] }] },
  { id: 'charity', groups: [CHARITY], picks: [{ quran: [2, 261] }, { hadith: 42 }] },
  { id: 'parents', groups: [PARENTS], picks: [{ quran: [17, 23] }, { hadith: 151 }] },
  { id: 'patience', groups: [PATIENCE], picks: [{ quran: [2, 153] }, { hadith: 20 }] },
  { id: 'mercy', groups: [MERCY], picks: [{ quran: [21, 107] }, { quran: [7, 156] }, { hadith: 31 }] },
  { id: 'honesty', groups: [HONESTY], picks: [{ quran: [9, 119] }, { hadith: 23 }] },
  { id: 'intention', groups: [INTENTION], picks: [{ hadith: 1 }] },
  { id: 'anger', groups: [ANGER], picks: [{ hadith: 14 }, { adhkar: 'S81' }] },
  { id: 'knowledge', groups: [KNOWLEDGE], picks: [{ quran: [20, 114] }, { hadith: 118 }] },
  { id: 'sleep', groups: [SLEEP], picks: [{ adhkar: 'S27' }] },
  { id: 'travel', groups: [TRAVEL], picks: [{ adhkar: 'S95' }] },
  { id: 'food', groups: [FOOD], picks: [{ adhkar: 'S68' }, { adhkar: 'S69' }] },
  { id: 'dua', groups: [DUA], picks: [{ quran: [2, 186] }, { adhkar: 'S34' }] },
  { id: 'dhikr', groups: [DHIKR], picks: [{ quran: [13, 28] }, { adhkar: 'S129' }] },
  { id: 'friday', groups: [FRIDAY], picks: [{ quran: [62, 9] }, { hadith: 96 }] },
  { id: 'paradise', groups: [PARADISE], picks: [{ quran: [3, 133] }, { hadith: 129 }] },
  { id: 'death', groups: [DEATH], picks: [{ quran: [3, 185] }] },
  { id: 'angels', groups: [ANGELS], picks: [{ quran: [35, 1] }, { quran: [2, 285] }] },
  { id: 'character', groups: [CHARACTER], picks: [{ hadith: 23 }, { hadith: 16 }] },
  { id: 'makkah', groups: [MAKKAH], picks: [{ quran: [3, 96] }, { live: 'quran-tv' }] },
  { id: 'hijra', groups: [HIJRA], picks: [{ seerah: 'هجرة' }] },
  { id: 'jesus', groups: [JESUS], picks: [{ faq: 'jesus-in-islam' }, { prophet: 24 }] },
  { id: 'moses', groups: [MOSES], picks: [{ prophet: 15 }] },
  { id: 'abraham', groups: [ABRAHAM], picks: [{ prophet: 6 }] },
  { id: 'noah', groups: [NOAH], picks: [{ prophet: 3 }] },
  { id: 'joseph', groups: [JOSEPH], picks: [{ prophet: 11 }] },
  { id: 'jonah', groups: [JONAH], picks: [{ prophet: 18 }] },
  { id: 'david', groups: [DAVID], picks: [{ prophet: 20 }] },
  { id: 'solomon', groups: [SOLOMON], picks: [{ prophet: 21 }] },
  { id: 'adam', groups: [ADAM], picks: [{ prophet: 1 }] },
  { id: 'muhammad', groups: [MUHAMMAD], picks: [{ prophet: 25 }, { quran: [33, 40] }] },
  { id: 'asmaAllah', groups: [NAMES, ALLAH], picks: [{ quran: [7, 180] }, { asma: [1, 2, 3, 4, 5] }] },
  { id: 'whoIsAllah', groups: [WHO_IS, ALLAH], picks: [{ faq: 'who-is-allah' }, { quran: [112, 1] }] },
  { id: 'seerah', groups: [SEERAH], picks: [{ prophet: 25 }, { seerah: 'هجرة' }] },
  { id: 'prophets', groups: [PROPHETS], picks: [{ quran: [4, 163] }, { prophet: 25 }] },
  { id: 'quran', groups: [QURAN], picks: [{ quran: [2, 2] }, { quran: [17, 9] }] },
  { id: 'islam', groups: [ISLAM_OR_FIVE.slice(0, 9)], picks: [{ faq: 'what-is-islam' }, { hadith: 2 }] },
  { id: 'allah', groups: [ALLAH], picks: [{ faq: 'who-is-allah' }, { quran: [112, 1] }] },
]

const NORMALIZED: Array<{ topic: Topic; groups: string[][] }> = TOPICS.map((topic) => ({
  topic,
  groups: topic.groups.map((g) => g.map(normalizeKeyword)),
}))

export function matchTopic(query: string): Topic | null {
  const q = normalizeQuery(query)
  let best: Topic | null = null
  let bestScore = 0
  for (const { topic, groups } of NORMALIZED) {
    const allHit = groups.every((g) => g.some((k) => q.includes(k)))
    if (allHit && groups.length > bestScore) {
      best = topic
      bestScore = groups.length
    }
  }
  return best
}
