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
const VIRTUE_READ = ['read', 'recit', 'virtue', 'merit', 'reward', 'benefit', 'lire', 'lecture', 'mérite', 'vertu', 'leer', 'lectura', 'virtud', 'mérito', 'lesen', 'vorzug', 'tugend', 'okum', 'fazilet', 'faziyet', 'чтени', 'читать', 'достоинств', 'награ', '读', '诵', '贵', 'पढ़', 'पाठ', 'फ़ज़ीलत', 'फजीलत', 'पुण्य', 'membaca', ' baca', 'keutamaan', 'pagbasa', 'pagbabasa', 'kabutihan', 'kahalagahan', 'קריא', 'מעלת', 'việc đọc', 'đọc kinh', 'đọc qur', 'lợi ích', 'ân phúc', 'पढ्नु', 'पढ्न', 'महिमा', 'leggere', 'lettura', 'läsa', 'läsning', 'förtjänst', 'lukem', 'ansio', 'فضل', 'قراءة', 'تلاوة', 'پڑھ', 'فضیلت']
const FORGIVE = ['forgiv', 'istighfar', 'istigfar', 'repent', 'pardon', 'perdón', 'vergebung', 'reue', 'tövbe', 'istiğfar', 'af dile', 'прощени', 'истигфар', 'покаяни', '宽恕', '求饶', '饶恕', '求恕', '忏悔', 'क्षमा', 'माफ़ी', 'माफी', 'इस्तिग़फ़ार', 'इस्तिग्फार', 'तौबा', 'ampun', 'tobat', 'taubat', 'kapatawaran', 'patawad', 'pagsisisi', 'מחילה', 'סליחה', 'אסתגפאר', 'תשובה', 'tha thứ', 'sám hối', 'perdono', 'pentim', 'förlåtelse', 'anteeks', 'katumu', 'استغفار', 'مغفرة', 'توبة', 'توبه', 'مغفرت', 'معافی']
const PRAYER = ['prayer', ' pray', 'salah', 'salat', 'namaz', 'prière', ' prier', 'oración', 'rezar', 'gebet', ' beten', 'молитв', 'намаз', '礼拜', '拜功', '祈祷', 'नमाज़', 'नमाज', 'sholat', 'shalat', 'dasal', 'darasal', 'dalangin', 'panalangin', 'תפיל', 'צלאה', 'preghier', 'pregare', ' bön ', 'bönen', 'bönens', ' ber ', 'rukou', 'lễ nguyện', 'cầu nguyện', 'صلاة', 'صلاه', 'الصلوات', 'نماز']
const FAST = ['fast', 'ramadan', 'ramazan', 'рамадан', 'пост ', 'поста', '斋', 'रमज़ान', 'रमजान', 'रोज़ा', 'रोजा', 'puasa', 'ayuno', 'ayuno', 'jeûn', 'fasten', 'oruç', 'צום', 'רמדאן', 'nhịn chay', 'digiun', 'fasta', 'paast', 'صيام', 'صوم', 'رمضان', 'روزہ', 'روزه']
const ZAKAT = ['zakat', 'zakah', 'zekat', 'закят', 'закат', '天课', 'ज़कात', 'जकात', 'زكاة', 'زکوٰۃ', 'زکات', 'זכאת']
const CHARITY = ['charity', 'sadaqa', 'sadaka', 'aumône', 'caridad', 'limosna', 'almosen', 'spende', 'милостын', 'садак', 'благотвор', '施舍', '慈善', 'दान', 'सदका', 'sedekah', 'kawanggawa', 'limos', 'צדקה', 'từ thiện', 'bố thí', 'carità', 'elemosin', 'välgörenhet', 'allmosa', 'hyväntekeväisyy', 'almu', 'صدقة', 'صدقہ', 'خیرات']
const HAJJ = ['hajj', ' haj ', 'hadj', ' hac ', ' hacc', 'хадж', '朝觐', ' हज', ' haji', 'חג׳', "חג'", ' حج', 'الحج', 'hành hương', 'pellegrinaggio', 'pilgrim', 'peregrin', 'pèlerinage', 'pilgerfahrt', 'vallfärd', 'pyhiinvaell']
const UMRAH = ['umrah', 'umra', 'omra', 'عمرة', 'عمره', 'умр', '副朝', 'उमरा', 'עומרה', 'عمرہ']
const WUDU = ['wudu', 'wudhu', 'ablution', 'abdest', 'омовени', 'вуду', '小净', '净礼', 'वुज़ू', 'वुजू', 'ablución', 'abluzion', 'waschung', 'tvagning', 'pesu', 'וודוא', 'רחצה', 'tẩy uế', 'وضوء', 'وضو']
const MUHAMMAD = ['muhammad', 'mohammed', 'mohamed', 'muhammed', 'mahoma', 'maometto', 'мухаммад', 'магомет', '穆罕默德', 'मुहम्मद', 'मोहम्मद', 'מוחמד', 'محمد']
const ALLAH = ['allah', ' god', 'gott', ' dieu', ' dios', ' бог', 'аллах', '神', '真主', 'ईश्वर', 'भगवान', 'अल्लाह', 'tuhan', 'diyos', 'אלוהים', 'אללה', ' dio ', ' gud', 'jumala', 'thượng đế', 'الله', 'خدا']
const NAMES = ['name', ' nom', 'nombre', 'namen', 'isim', 'имен', 'имя', '名', 'नाम', ' nama', 'pangalan', 'שמות', ' שם ', ' tên ', ' nome', ' nomi ', ' namn', 'nimi', 'nime', 'asma', 'اسماء', ' اسم', ' نام', ' 99 ']
const PARENTS = ['parent', 'mother', 'father', ' mère', ' père', 'padre', 'madre', 'eltern', 'mutter', 'vater', ' anne', ' baba', 'ebeveyn', 'родител', 'мать', 'отец', '父母', '母亲', '父亲', 'माता', 'पिता', 'orang tua', ' ibu ', 'magulang', 'הורים', 'אמא', 'אבא', 'cha mẹ', 'genitori', 'föräldr', 'vanhem', 'äiti', 'الوالدين', 'والدين', 'الام', 'ماں', 'باپ', 'والدین', 'आमाबुबा', 'आमा']
const PATIENCE = ['patien', 'sabr', 'paciencia', 'geduld', 'sabır', 'терпени', 'сабр', '忍耐', '耐心', 'धैर्य', 'सब्र', 'sabar', 'pasensya', 'tiyaga', 'סבלנות', 'kiên nhẫn', 'pazienza', 'tålamod', 'kärsiv', 'صبر']
const MERCY = ['mercy', 'compassion', 'miséricorde', 'misericordia', 'barmherzig', 'merhamet', 'милосерди', 'милость', '怜悯', '仁慈', '慈悲', 'दया', 'रहमत', 'rahmat', 'kasih sayang', ' awa ', 'habag', 'רחמים', 'nhân từ', 'thương xót', 'misericord', 'barmhärt', ' armo', 'رحمة', 'رحمت']
const HONESTY = ['honest', 'truthful', 'sincer', 'honnête', 'vérité', 'honestidad', 'verdad', 'wahrheit', 'ehrlich', 'dürüst', 'doğru', 'честн', 'правд', '诚实', 'ईमानदार', ' सच', 'jujur', 'katapatan', 'יושר', 'אמת', 'trung thực', 'onest', 'ärlig', 'sanning', 'rehell', 'totuu', 'صدق', 'سچ']
const INTENTION = ['intention', 'niyyah', 'niyya', 'intención', 'absicht', 'niyet', 'намерени', '意图', '举意', 'नीयत', 'नियत', ' niat', 'intensyon', 'hangarin', 'כוונה', 'ý định', 'intenzion', 'avsikt', 'aikomu', 'نية', 'نیت']
const ANGER = ['anger', 'angry', 'colère', ' ira ', 'enojo', ' zorn', ' wut', 'öfke', 'гнев', 'злост', '愤怒', '生气', 'क्रोध', 'गुस्सा', 'marah', 'galit', 'כעס', 'tức giận', 'rabbia', 'ilska', 'vrede', ' viha', 'suuttu', 'غضب', 'غصہ', 'रिस']
const KNOWLEDGE = ['knowledge', 'connaissance', ' savoir', 'conocimiento', 'wissen', ' ilim', 'bilgi', 'знани', '知识', 'ज्ञान', 'इल्म', ' ilmu', 'kaalaman', 'ידע', 'tri thức', 'conoscenza', 'kunskap', ' tieto', 'علم']
const DUA = ['dua ', ' du a ', 'supplication', 'invocation', 'súplica', 'bittgebet', ' dua', 'дуа', 'мольб', '祈求', '都阿', 'दुआ', ' doa ', 'cầu xin', 'invocazion', 'supplica', 'åkallan', 'دعاء', ' دعا ']
const DHIKR = ['dhikr', 'zikr', 'adhkar', 'azkar', 'remembrance', 'souvenir', 'recuerdo', 'gedenken', 'zikir', 'зикр', 'азкар', 'поминани', '记主', '赞念', 'ज़िक्र', 'जिक्र', 'अज़्कार', 'dzikir', 'pag-alala', 'זיכר', "אד'כאר", 'tưởng niệm', 'ricordo', 'åminnelse', 'muistam', 'ذكر', 'اذكار', 'ذکر', 'اذکار']
const MORNING_EVENING = ['morning', 'evening', ' matin', ' soir', 'mañana', ' tarde', 'morgen', ' abend', 'sabah', 'akşam', ' утр', 'вечер', '早晨', '早上', '晚上', '傍晚', 'सुबह', 'शाम', ' pagi', 'petang', ' sore', 'umaga', ' gabi', 'בוקר', 'ערב', 'buổi sáng', 'buổi chiều', 'mattin', ' sera ', 'morgon', 'kväll', ' aamu', ' ilta', 'صباح', 'مساء', 'صبح', ' شام', 'बिहान', 'बेलुका']
const SLEEP = ['sleep', 'dormir', 'schlaf', 'uyku', ' uyu', ' сон', 'спать', ' сна', '睡', 'नींद', 'सोने', 'tidur', 'tulog', 'שינה', 'đi ngủ', 'giấc ngủ', 'sonno', 'dormi', 'sömn', ' sova', ' uni ', 'nukku', 'نوم', 'نیند', 'सुत्ने', 'निद्रा']
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

// ── Second batch: occasions, worship details, character, the unseen, more prophets ──
const LAYLAT_QADR = ['laylat al qadr', 'laylatul qadr', 'lailatul qadar', 'lailat al qadr', 'night of power', 'night of decree', 'qadr night', 'nuit du destin', 'noche del decreto', 'nacht der bestimmung', 'kadir gecesi', 'ночь предопредел', 'ночь могуществ', 'ляйлят', '盖德尔夜', 'शब ए क़द्र', 'शब ए कद्र', 'शबे कद्र', 'gabi ng kapangyarihan', 'ליל אל קדר', 'đêm định mệnh', 'notte del destino', 'maktens natt', 'voiman yö', 'ليلة القدر', 'شب قدر']
const SALAWAT = ['salawat', 'durood', 'darood', 'blessings on the prophet', 'blessings upon the prophet', 'prière sur le prophète', 'bendiciones sobre el profeta', 'segenswunsch', 'salavat', 'салават', 'дуруд', '赞圣', 'दुरूद', 'दरूद', 'selawat', 'shalawat', 'sholawat', 'צלוואת', 'chúc phúc cho nabi', 'benedizioni sul profeta', 'välsignelse över profeten', 'siunaus profeetalle', 'الصلاة على النبي', 'صلوات', 'درود']
const ADHAN = ['adhan', ' azan', 'call to prayer', 'appel à la prière', 'llamada a la oración', 'gebetsruf', ' ezan', 'азан', '宣礼', '唤拜', 'अज़ान', 'अजान', 'adzan', 'tawag sa pagdarasal', 'אד׳אן', 'עזאן', 'kêu gọi cầu nguyện', 'richiamo alla preghiera', 'böneutrop', 'rukouskutsu', 'الاذان', ' اذان']
const ISTIKHARA = ['istikhara', 'istikharah', 'istiharah', 'istihare', 'истихар', '求选', 'इस्तिख़ारा', 'इस्तिखारा', 'אסתח׳ארה', 'استخارة', 'استخارہ']
const AYAT_KURSI = ['kursi', 'kursiy', 'throne verse', 'verset du trône', 'aleya del trono', 'thronvers', 'курси', '宝座经文', 'कुर्सी', 'פסוק הכס', 'ghế ngai', 'versetto del trono', 'tronversen', 'valtaistuinjae', 'الكرسي', 'كرسي']
const FATIHA = ['fatiha', 'fatihah', 'opening chapter', 'фатих', '开端章', 'फ़ातिहा', 'फातिहा', 'פאתחה', 'الفاتحة', 'فاتحہ']
const ISRA = [' isra ', 'isra miraj', 'miraj', ' mi raj', 'mirac', 'night journey', 'ascension', 'voyage nocturne', 'viaje nocturno', 'nachtreise', 'himmelfahrt', 'мирадж', ' исра', 'ночное путешеств', '夜行', '登霄', 'मेराज', 'मेअराज', 'इसरा', 'mikraj', 'paglalakbay sa gabi', 'מסע הלילה', 'hành trình đêm', 'viaggio notturno', 'ascensione', 'nattresan', 'yömatka', 'الاسراء', 'المعراج', 'معراج']
const CONQUEST = ['conquest', ' fath', 'conquête', 'conquista', 'eroberung', 'fetih', 'fethi', 'завоева', 'взятие', '征服', '光复', 'विजय', 'फ़तह', 'fathu', 'penaklukan', 'pagsakop', 'כיבוש', 'chinh phục', 'erövring', 'valloitu', 'فتح']
const BADR = [' badr', 'бадр', 'बद्र', '白德尔', 'בדר', 'بدر']
const UHUD = ['uhud', 'ohod', 'ухуд', 'उहुद', '吴侯德', 'אוחד', 'غزوة احد', 'معركة احد', 'جبل احد']
const KHADIJA = ['khadija', 'khadidja', 'hatice', 'хадидж', '赫蒂彻', 'ख़दीजा', 'खदीजा', 'chadidscha', 'חדיג׳ה', 'خديجة', 'خدیجہ']
const QIBLA = ['qibla', 'kıble', 'kibla', 'кибл', '朝向', 'क़िबला', 'किबला', 'קיבלה', 'القبلة', 'قبلة', 'قبلہ']
const REVELATION = ['revelation', ' hira', 'révélation', 'revelación', 'offenbarung', 'vahiy', 'вахий', 'откровени', 'ниспослани', '启示', '降示', 'वह्य', 'wahyu', 'paghahayag', 'התגלות', 'חירא', 'mặc khải', 'rivelazion', 'uppenbarelse', 'ensimmäinen ilmoitus', 'الوحي', 'حراء', ' وحی']
const FUNERAL = ['funeral', 'janazah', 'janaza', ' grave', 'burial', 'funérailles', 'enterrement', ' tombe', 'entierro', 'tumba', 'beerdigung', 'begräbnis', ' grab ', 'cenaze', ' kabir', ' mezar', 'похорон', 'джаназ', 'могил', '葬礼', '殡礼', '坟墓', 'जनाज़ा', 'जनाजा', 'क़ब्र', 'कब्र', 'jenazah', 'kubur', 'libing', 'puntod', 'הלוויה', ' קבר', 'tang lễ', 'ngôi mộ', 'sepoltura', ' tomba', 'begravning', ' grav ', 'hautaj', ' hauta', 'جنازة', 'الجنازة', 'القبر', ' قبر', 'جنازہ', 'मलामी', 'चिहान']
const SICK = ['sick', 'illness', 'disease', ' heal', 'malad', 'enferm', 'krank', 'hastal', 'болезн', 'больн', '生病', '疾病', 'बीमार', 'रोग', 'sakit', 'karamdaman', 'מחלה', 'חולה', 'bệnh', 'malatt', 'sjuk', 'sairau', 'sairas', 'مرض', 'المريض', 'بیمار', 'बिरामी']
const DISTRESS = ['anxiety', 'anxious', 'worry', ' sad ', 'sadness', 'grief', 'depress', 'stress', 'distress', 'angoisse', 'anxiété', 'tristesse', 'inquiét', 'ansiedad', 'tristeza', 'preocupa', 'angst', 'sorge', 'traurig', 'kummer', 'kaygı', 'üzüntü', 'endişe', 'тревог', 'грусть', 'печал', ' горе', 'беспокой', '焦虑', '忧愁', '悲伤', '烦恼', 'चिंता', 'चिन्ता', 'उदास', 'दुख', 'परेशान', 'cemas', 'sedih', 'gelisah', 'pagkabalisa', 'kalungkutan', 'malungkot', 'חרדה', 'עצב', 'דאגה', 'lo âu', 'buồn', 'ansia', 'tristezza', 'ångest', ' oro ', ' sorg', 'ahdistu', ' suru', 'huoli', 'الهم', 'حزن', 'قلق', 'كرب', ' غم', 'پریشان']
const RAIN = [' rain', 'pluie', 'lluvia', ' regen ', 'yağmur', 'дожд', '雨', 'बारिश', 'वर्षा', 'बर्षा', 'hujan', ' ulan', 'גשם', 'trời mưa', 'cơn mưa', 'khi mưa', 'pioggia', ' regn', ' sade', 'مطر', 'بارش']
const MOSQUE = ['mosque', 'masjid', 'mosquée', 'mezquita', 'moschee', ' cami', 'mescit', 'мечет', '清真寺', 'मस्जिद', 'moske', 'מסגד', 'nhà thờ hồi giáo', 'thánh đường', 'moschea', 'moské', 'moskei', 'moskee', 'مسجد']
const DEBT = ['debt', ' loan', 'dette', 'deuda', 'schulden', 'borç', ' долг', '债', 'क़र्ज़', 'कर्ज', 'utang', 'hutang', 'חוב', 'trả nợ', 'món nợ', 'khoản nợ', 'debito', 'debiti', ' skuld', 'velka', 'velat', 'قضاء الدين', 'الديون', 'قرض']
const ENVY = ['envy', 'jealous', 'evil eye', ' envie', 'jalous', 'mauvais oeil', 'mauvais œil', 'envidia', 'mal de ojo', ' neid', 'böser blick', 'haset', 'kıskan', 'nazar', 'зависть', 'сглаз', '嫉妒', '毒眼', 'ईर्ष्या', 'नज़र', 'iri hati', 'dengki', 'inggit', 'usog', 'קנאה', 'עין הרע', 'ghen tị', 'đố kỵ', 'invidia', 'malocchio', 'avund', 'onda ögat', 'kateus', 'kateel', 'pahan silmän', 'الحسد', 'حسد']
const MARRIAGE = ['marriage', ' marry', 'wedding', 'spouse', ' wife', 'husband', 'mariage', 'épou', 'matrimonio', 'casarse', 'esposa', ' ehe ', 'heirat', 'hochzeit', 'evlilik', 'nikah', 'evlen', 'брак', 'женить', 'замуж', 'никах', 'супруг', '婚', '妻子', '丈夫', 'शादी', 'विवाह', 'निकाह', 'pernikahan', 'menikah', ' kasal', ' asawa', 'נישואי', 'חתונה', 'hôn nhân', 'kết hôn', 'sposar', 'äktenskap', ' gifta', 'avioliit', 'naimi', 'زواج', 'نكاح', 'شادی', 'बिहे']
const CHILDREN = [' child', ' kids', 'daughter', ' son ', ' sons ', 'enfant', 'niño', ' hijo', 'kinder', 'çocuk', ' дет', 'ребен', '孩子', '子女', '儿童', 'बच्च', 'संतान', ' anak', ' bata ', 'mga bata', 'ילד', 'con cái', 'trẻ em', 'bambin', ' figli', ' barn', 'lapsi', 'lapset', 'lasten', 'الاطفال', 'الاولاد', 'اولاد', ' طفل', 'بچ', 'छोरा', 'बालबालिका']
const SIN = [' sin ', ' sins', 'sinful', 'péché', 'pecado', 'sünde', 'günah', ' грех', '罪', 'पाप', 'गुनाह', ' dosa', 'kasalanan', 'חטא', 'tội lỗi', 'peccat', ' synd', 'synti', 'ذنب', 'الذنوب', 'الكبائر', 'معصية', 'گناہ']
const DESTINY = ['destiny', 'predestin', ' fate', 'qadar', ' destin', 'schicksal', 'vorherbestimm', ' kader', 'судьб', 'предопредел', 'кадар', '命运', '前定', '天命', 'भाग्य', 'तक़दीर', 'तकदीर', 'takdir', 'tadhana', 'kapalaran', 'גורל', 'định mệnh', 'số phận', ' öde ', 'förutbestäm', 'kohtalo', 'ennalta määr', ' القدر', ' قدر ', 'القضاء والقدر', 'تقدیر']
const JUDGMENT = ['judgment', 'judgement', 'resurrection', 'hereafter', 'afterlife', 'jugement', 'résurrection', 'au delà', 'juicio', 'resurrección', 'más allá', 'jüngst', 'auferstehung', 'jenseits', 'kıyamet', 'ahiret', 'ahret', 'судн', 'воскресени', 'загробн', 'кияма', 'ахира', '审判', '复活', '后世', '末日', 'क़यामत', 'कयामत', 'आख़िरत', 'आखिरत', 'परलोक', 'kiamat', 'akhirat', 'paghuhukom', 'kabilang buhay', 'יום הדין', 'תחיית', 'העולם הבא', 'phán xét', 'đời sau', 'giudizio', 'resurrezion', 'aldilà', 'domedag', 'uppståndelse', 'livet efter', 'tuomiopäiv', 'ylösnousem', 'tuonpuolei', 'القيامة', 'الاخرة', 'البعث', 'قیامت', 'اخرت']
const HELL = [' hell ', 'hellfire', 'jahannam', 'enfer', 'infierno', 'hölle', 'cehennem', ' ад ', ' ада ', 'геенн', 'джаханнам', '地狱', '火狱', 'जहन्नम', 'नरक', 'neraka', 'impyerno', 'גיהנום', 'địa ngục', 'inferno', 'helvete', 'helvet', 'helvetti', 'النار', 'جهنم']
const NEIGHBOR = ['neighbo', 'voisin', 'vecino', 'nachbar', 'komşu', 'сосед', '邻居', 'पड़ोस', 'tetangga', 'kapitbahay', 'שכן', 'hàng xóm', 'vicin', 'granne', 'naapuri', 'الجار', ' جار ', 'پڑوس', 'छिमेकी']
const SPEECH = ['tongue', 'lying', ' lie ', ' lies', 'gossip', 'backbit', 'mensonge', 'médisance', 'mentira', 'chisme', 'zunge', 'lüge', 'lästern', 'yalan', 'gıybet', 'ложь', 'сплетн', 'злослови', '说谎', '谎言', '背谈', 'झूठ', 'चुगली', 'lidah', 'bohong', 'ghibah', 'gibah', ' dila', 'kasinungalingan', 'tsismis', 'שקר', 'רכילות', 'lưỡi', 'nói dối', 'bugia', 'menzogn', 'pettegol', 'tunga', 'lögn', 'skvaller', 'valhe', 'juoru', 'اللسان', 'الكذب', 'الغيبة', 'جھوٹ', 'غیبت', 'झुटो']
const SHAYTAN = ['satan', 'shaytan', 'shaitan', 'devil', 'jinn', 'diable', 'demonio', 'teufel', 'şeytan', ' cin ', 'шайтан', 'сатан', 'дьявол', 'джинн', '恶魔', '魔鬼', '撒旦', '精灵', 'शैतान', 'जिन्न', 'setan', ' jin ', 'demonyo', 'diyablo', 'שטן', 'ma quỷ', 'diavolo', 'djävul', 'paholai', 'saatana', 'الشيطان', 'شيطان', 'الجن ', 'شیطان']
const HALAL = ['halal', 'haram', 'lawful', 'forbidden', 'licite', 'interdit', 'lícito', 'prohibido', 'erlaubt', 'verboten', 'helal', 'халяль', 'харам', 'запрещ', '合法', '禁止', 'हलाल', 'हराम', 'bawal', 'מותר', 'אסור', 'được phép', 'bị cấm', 'lecito', 'proibito', 'tillåtet', 'förbjud', 'sallittu', 'kielletty', 'حلال', 'حرام']
const KINDNESS = ['ihsan', 'kindness', 'excellence', 'bienfaisance', 'bonté', 'bondad', 'güte', 'iyilik', 'доброт', 'ихсан', '善待', '行善', 'भलाई', 'एहसान', 'kebaikan', 'kabaitan', 'חסד', 'lòng tốt', 'gentilezza', 'bontà', 'vänlighet', 'ystävällisyy', 'hyvyy', 'الاحسان', 'احسان', 'नेकी']
const SUNNAH = ['sunnah', 'sunna ', 'bid ah', 'bidah', 'bidat', 'bid at', 'sünnet', 'сунн', 'бида', '圣行', 'सुन्नत', 'बिदअत', 'סונה', 'السنة', 'البدعة', 'بدعة', 'سنت', 'بدعت']
const BROTHERHOOD = ['brotherhood', 'ummah', 'fraternité', 'hermandad', 'brüderlichkeit', 'kardeşlik', 'ümmet', 'братств', 'умма', '兄弟情', '团结', 'भाईचारा', 'भाइचारा', 'उम्मत', 'persaudaraan', 'ukhuwah', 'kapatiran', 'אחווה', 'tình huynh đệ', 'fratellanza', 'broderskap', 'veljeys', 'الاخوة', 'اخوة', 'الامة', 'بھائی چارہ']
const GRATITUDE = ['gratitude', 'grateful', 'thankful', 'shukr', 'reconnaissance', 'gratitud', 'agradecimiento', 'dankbarkeit', 'şükür', 'şükr', 'благодарност', 'шукр', '感恩', 'शुक्र अदा', 'कृतज्ञ', 'syukur', 'pasasalamat', 'הכרת תודה', 'biết ơn', 'gratitudine', 'tacksamhet', 'kiitollis', 'الشكر', 'شكر الله', 'شكر النعم', 'شکر گزار', 'आभार']
const TAWAKKUL = ['tawakkul', 'trust in allah', 'trust in god', 'reliance on', 'confiance en dieu', 'confianza en dios', 'gottvertrauen', 'tevekkül', 'таваккуль', 'упован', '托靠', 'तवक्कुल', 'tawakal', 'pagtitiwala sa', 'בטחון באללה', 'phó thác', 'fiducia in dio', 'tillit till', 'luottamus jumalaan', 'التوكل', 'توكل', 'توکل']
const TAQWA = ['taqwa', 'piety', 'god conscious', 'piété', 'piedad', 'gottesfurcht', 'takva', 'таква', 'богобояз', '敬畏', 'तक़वा', 'तकवा', 'takwa', 'kabanalan', 'יראת', 'kính sợ', 'pietà', 'gudsfruktan', 'jumalanpel', 'التقوى', 'تقوى', 'تقویٰ']
const DUNYA = ['dunya', 'this world', 'worldly', 'materialism', 'vie d ici bas', 'este mundo', 'diesseits', 'мирск', 'этот мир', '今世', '尘世', 'दुनिया', 'dunia', 'העולם הזה', 'thế gian', 'mondo terreno', 'denna värld', 'tämä maailma', 'الدنيا', 'دنیا']
const MODESTY = ['modesty', 'shyness', 'hayaa', 'al haya', 'pudeur', 'modestie', 'pudor', 'modestia', 'schamhaftigkeit', 'стыдлив', 'скромност', '羞耻', '知耻', 'हया', 'शर्म', 'rasa malu', 'kahihiyan', 'צניעות', 'nết na', 'pudore', 'blygsamhet', 'kainous', 'الحياء', 'حياء', 'حیا']
const LOVE_OF_ALLAH = ['love of allah', 'love allah', 'allah love', 'god love', 'love of god', 'amour de dieu', 'amor de dios', 'amor a dios', 'liebe gottes', 'liebe zu allah', 'allah sevgisi', 'любовь аллаха', 'любовь к аллаху', '真主喜爱', '爱真主', 'अल्लाह से मोहब्बत', 'अल्लाह का प्यार', 'cinta allah', 'pag ibig ng diyos', 'אהבת אללה', 'tình yêu của allah', 'amore di dio', 'guds kärlek', 'jumalan rakkau', 'محبة الله', 'حب الله', 'اللہ کی محبت', 'अल्लाहको माया']
const JUSTICE = ['justice', 'fairness', 'justicia', 'gerechtigkeit', 'adalet', 'справедлив', '公正', '正义', 'न्याय', 'इंसाफ', 'keadilan', 'katarungan', 'צדק', 'công bằng', 'giustizia', 'rättvisa', 'oikeudenmukai', 'العدل', ' عدل', 'انصاف']
const MARY = [' mary', 'maryam', ' marie', 'maría', ' maria', 'meryem', ' мари', 'марьям', '玛丽亚', '麦尔彦', 'मरियम', 'מרים', 'đức mẹ', 'مريم']
const GREETING = ['greeting', ' salam', 'assalam', 'salutation', 'saludo', 'gruß', 'gruss', ' selam', 'приветстви', 'салям', '问候', '色兰', 'सलाम', 'अभिवादन', 'pagbati', 'ברכת שלום', 'lời chào', 'saluto', 'hälsning', 'tervehd', ' السلام عليكم', 'افشاء السلام', 'رد السلام', ' سلام']
const HUD = [' hud ', ' houd', ' худ', '呼德', 'हूद', ' הוד ', ' هود']
const SALIH = ['salih', 'saleh', 'салих', '撒立哈', 'सालेह', 'सालिह', 'סאלח', 'النبي صالح', 'قصة صالح', 'ناقة صالح', 'نبي الله صالح']
const LUT = [' lut ', 'prophet lot', 'people of lot', ' loth', ' lût', ' лут', 'пророк лот', '鲁特', '罗得', 'लूत', ' לוט', ' لوط']
const ISMAIL = ['ismail', 'ishmael', 'ismaël', 'ismael', 'исмаил', '易司马仪', 'इस्माईल', 'इस्माइल', 'ישמעאל', 'ismaele', 'اسماعيل', 'اسماعیل']
const ISHAQ = ['ishaq', 'isaac', 'isaak', 'ishak', 'исаак', 'исхак', '易司哈格', 'इसहाक', 'יצחק', 'isacco', 'iisak', 'اسحاق']
const YAQUB = ['yaqub', 'yaqoob', 'jacob', 'jakob', 'yakup', 'яков', 'якуб', '叶尔孤白', 'याकूब', 'יעקב', 'giacobbe', 'jaakob', 'يعقوب', 'یعقوب']
const AYYUB = ['ayyub', ' ayub', 'prophet job', 'eyyub', 'eyüp', 'айюб', ' иов', '安优卜', 'अय्यूब', 'איוב', 'giobbe', ' ijob', 'ايوب', 'ایوب']
const ZAKARIYA = ['zakariya', 'zakaria', 'zechariah', 'zacharie', 'zacarías', 'zacharias', 'zekeriya', 'закария', 'захари', '宰凯里雅', 'ज़करिया', 'जकरिया', 'זכריה', 'zaccaria', 'sakarja', 'زكريا', 'زکریا']
const YAHYA = ['yahya', 'john the baptist', 'jean baptiste', 'juan el bautista', 'johannes der täufer', 'яхья', 'иоанн', '叶哈雅', 'यह्या', 'יוחנן', 'giovanni battista', 'johannes döparen', 'johannes kastaja', 'يحيى', 'یحییٰ']
const IDRIS = ['idris', 'enoch', 'hénoch', ' enoc', 'идрис', '易德立斯', 'इदरीस', 'חנוך', 'ادريس', 'ادریس']
const HARUN = ['harun', 'haroon', 'aaron', 'аарон', 'харун', '哈伦', 'हारून', 'אהרן', 'aronne', 'هارون']
const SHUAYB = ['shuayb', 'shuaib', 'shoaib', 'jethro', 'şuayb', 'шуайб', '舒阿卜', 'शुऐब', 'יתרו', 'شعيب']

export const TOPICS: Topic[] = [
  { id: 'pillarsIman', groups: [PILLAR, FAITH], picks: [{ quran: [2, 285] }, { quran: [4, 136] }] },
  { id: 'pillarsIslam', groups: [PILLAR, ISLAM_OR_FIVE], picks: [{ faq: 'what-is-islam' }, { hadith: 2 }] },
  { id: 'quranVirtue', groups: [QURAN, VIRTUE_READ], picks: [{ hadith: 109 }, { quran: [35, 29] }] },
  { id: 'morningEvening', groups: [MORNING_EVENING], picks: [{ adhkar: 'S26' }] },
  // Specific occasions and adhkar come before the broad topics (prayer, dua, death...)
  // they would otherwise tie with, e.g. "call to prayer" must reach adhan, not prayer.
  { id: 'laylatQadr', groups: [LAYLAT_QADR], picks: [{ quran: [97, 1] }, { quran: [97, 3] }] },
  { id: 'salawat', groups: [SALAWAT], picks: [{ quran: [33, 56] }, { adhkar: 'S106' }] },
  { id: 'adhan', groups: [ADHAN], picks: [{ adhkar: 'S14' }] },
  { id: 'istikhara', groups: [ISTIKHARA], picks: [{ adhkar: 'S25' }] },
  { id: 'ayatKursi', groups: [AYAT_KURSI], picks: [{ quran: [2, 255] }] },
  { id: 'fatiha', groups: [FATIHA], picks: [{ quran: [1, 2] }, { quran: [1, 5] }, { quran: [1, 6] }] },
  { id: 'isra', groups: [ISRA], picks: [{ quran: [17, 1] }, { seerah: 'الإسراء' }] },
  { id: 'conquestMakkah', groups: [CONQUEST, MAKKAH], picks: [{ seerah: 'فتح مكة' }] },
  { id: 'badr', groups: [BADR], picks: [{ seerah: 'بدر' }] },
  { id: 'uhud', groups: [UHUD], picks: [{ seerah: 'غزوة أحد' }] },
  { id: 'khadija', groups: [KHADIJA], picks: [{ seerah: 'خديجة' }] },
  { id: 'qibla', groups: [QIBLA], picks: [{ quran: [2, 144] }, { seerah: 'القبلة' }] },
  { id: 'revelation', groups: [REVELATION], picks: [{ seerah: 'نزول الوحي' }, { quran: [96, 1] }] },
  { id: 'funeral', groups: [FUNERAL], picks: [{ adhkar: 'S54' }, { adhkar: 'S59' }] },
  { id: 'sickness', groups: [SICK], picks: [{ quran: [26, 80] }, { adhkar: 'S48' }] },
  { id: 'distress', groups: [DISTRESS], picks: [{ quran: [94, 5] }, { adhkar: 'S33' }, { adhkar: 'S34' }] },
  { id: 'rain', groups: [RAIN], picks: [{ adhkar: 'S62' }, { adhkar: 'S63' }] },
  { id: 'mosque', groups: [MOSQUE], picks: [{ adhkar: 'S11' }, { adhkar: 'S12' }] },
  { id: 'debt', groups: [DEBT], picks: [{ adhkar: 'S40' }] },
  { id: 'envy', groups: [ENVY], picks: [{ hadith: 30 }, { adhkar: 'S124' }] },
  { id: 'marriage', groups: [MARRIAGE], picks: [{ quran: [30, 21] }, { adhkar: 'S78' }] },
  { id: 'children', groups: [CHILDREN], picks: [{ hadith: 44 }, { adhkar: 'S47' }] },
  // Prophets by name. Muhammad stays further down: his name appears in many questions
  // that are really about something else ("what did the Prophet Muhammad say about...").
  { id: 'jesus', groups: [JESUS], picks: [{ faq: 'jesus-in-islam' }, { prophet: 24 }] },
  { id: 'moses', groups: [MOSES], picks: [{ prophet: 15 }] },
  { id: 'abraham', groups: [ABRAHAM], picks: [{ prophet: 6 }] },
  { id: 'noah', groups: [NOAH], picks: [{ prophet: 3 }] },
  { id: 'joseph', groups: [JOSEPH], picks: [{ prophet: 11 }] },
  { id: 'jonah', groups: [JONAH], picks: [{ prophet: 18 }] },
  { id: 'david', groups: [DAVID], picks: [{ prophet: 20 }] },
  { id: 'solomon', groups: [SOLOMON], picks: [{ prophet: 21 }] },
  { id: 'adam', groups: [ADAM], picks: [{ prophet: 1 }] },
  { id: 'hud', groups: [HUD], picks: [{ prophet: 4 }] },
  { id: 'salih', groups: [SALIH], picks: [{ prophet: 5 }] },
  { id: 'lut', groups: [LUT], picks: [{ prophet: 7 }] },
  { id: 'ismail', groups: [ISMAIL], picks: [{ prophet: 8 }] },
  { id: 'ishaq', groups: [ISHAQ], picks: [{ prophet: 9 }] },
  { id: 'yaqub', groups: [YAQUB], picks: [{ prophet: 10 }] },
  { id: 'ayyub', groups: [AYYUB], picks: [{ prophet: 13 }] },
  { id: 'zakariya', groups: [ZAKARIYA], picks: [{ prophet: 22 }] },
  { id: 'yahya', groups: [YAHYA], picks: [{ prophet: 23 }] },
  { id: 'idris', groups: [IDRIS], picks: [{ prophet: 2 }] },
  { id: 'harun', groups: [HARUN], picks: [{ prophet: 16 }] },
  { id: 'shuayb', groups: [SHUAYB], picks: [{ prophet: 12 }] },
  { id: 'mary', groups: [MARY], picks: [{ quran: [3, 42] }, { quran: [19, 16] }] },
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
  { id: 'halal', groups: [HALAL], picks: [{ hadith: 4 }] },
  { id: 'hijra', groups: [HIJRA], picks: [{ seerah: 'هجرة' }] },
  { id: 'destiny', groups: [DESTINY], picks: [{ quran: [54, 49] }, { quran: [57, 22] }] },
  { id: 'judgment', groups: [JUDGMENT], picks: [{ quran: [99, 7] }, { quran: [99, 8] }] },
  { id: 'hell', groups: [HELL], picks: [{ quran: [66, 6] }] },
  { id: 'neighbor', groups: [NEIGHBOR], picks: [{ hadith: 13 }] },
  { id: 'speech', groups: [SPEECH], picks: [{ hadith: 13 }, { hadith: 10 }] },
  { id: 'sin', groups: [SIN], picks: [{ quran: [39, 53] }, { hadith: 151 }] },
  { id: 'shaytan', groups: [SHAYTAN], picks: [{ quran: [114, 1] }, { quran: [114, 4] }, { adhkar: 'S44' }] },
  { id: 'kindness', groups: [KINDNESS], picks: [{ quran: [16, 90] }, { hadith: 15 }] },
  { id: 'sunnah', groups: [SUNNAH], picks: [{ hadith: 24 }, { hadith: 3 }] },
  { id: 'brotherhood', groups: [BROTHERHOOD], picks: [{ quran: [49, 10] }, { hadith: 30 }] },
  { id: 'gratitude', groups: [GRATITUDE], picks: [{ quran: [14, 7] }, { quran: [2, 152] }] },
  { id: 'tawakkul', groups: [TAWAKKUL], picks: [{ quran: [65, 3] }, { hadith: 40 }] },
  { id: 'taqwa', groups: [TAQWA], picks: [{ quran: [65, 2] }, { hadith: 16 }] },
  { id: 'dunya', groups: [DUNYA], picks: [{ hadith: 35 }, { quran: [57, 20] }] },
  { id: 'modesty', groups: [MODESTY], picks: [{ hadith: 17 }] },
  { id: 'loveOfAllah', groups: [LOVE_OF_ALLAH], picks: [{ hadith: 33 }, { hadith: 26 }] },
  { id: 'justice', groups: [JUSTICE], picks: [{ quran: [5, 8] }, { quran: [4, 135] }] },
  { id: 'greeting', groups: [GREETING], picks: [{ adhkar: 'S107' }, { quran: [4, 86] }] },
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
