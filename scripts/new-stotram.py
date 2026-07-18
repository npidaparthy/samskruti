#!/usr/bin/env python3
"""
Scaffold a new stotram entry.
Usage: python3 scripts/new-stotram.py <slug>

Creates:
  data/stotram/<slug>/
    <slug>.txt          (placeholder)
    <slug>_meta.json    (pre-filled)
Then appends to data/stotram/stotrams.json.
"""
import json, sys, textwrap
from pathlib import Path

STOTRAMS_JSON = Path('data/stotram/stotrams.json')

CATALOGUE = {
  'shiva-manasa-puja': {
    'title_te': 'శివ మానస పూజ', 'title_sa': 'शिव मानस पूजा', 'title_en': 'Śiva Mānasa Pūjā',
    'tags': ['shiva', 'shankaracharya', 'puja'], 'theme': 'blue',
    'desc_en': 'A hymn of mental worship (mānasa pūjā) of Lord Śiva by Ādi Śaṅkarācārya. The devotee offers the elements of elaborate ritual — bathing, flowers, incense, lamp, food — purely through thought and imagination, transcending the need for external materials. Closes with the declaration that the mind itself is the supreme offering.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన శివుని మానస పూజా స్తోత్రం. భక్తుడు స్నానం, పుష్పాలు, ధూపం, దీపం, నైవేద్యం అన్నింటినీ మనసులోనే సమర్పించి పూజ చేస్తాడు. బాహ్య వస్తువులు అవసరంలేని మానసిక ఆరాధన యొక్క గొప్పతనాన్ని చెప్తుంది.',
    'desc_sa': 'आदिशङ्करविरचिता शिवस्य मानसपूजा। भक्तः स्नानं पुष्पं धूपं दीपं नैवेद्यं च मनसैव समर्पयति। बाह्यद्रव्यनिरपेक्षायाः मानसिकपूजायाः माहात्म्यं वर्ण्यते।',
  },
  'surya-shatakam': {
    'title_te': 'సూర్య శతకమ్', 'title_sa': 'सूर्यशतकम्', 'title_en': 'Sūrya Śatakam',
    'tags': ['surya', 'kavya'], 'theme': 'gold',
    'desc_en': 'One hundred verses in praise of Sūrya (the Sun god) by the poet Mayūra, composed as an act of penance and devotion after he was struck with leprosy. Mayūra composed these verses lying before the Sun temple, and tradition holds he was cured. A celebrated example of devotional Sanskrit poetry.',
    'desc_te': 'కవి మయూరుడు రచించిన సూర్యదేవుని స్తుతిలో వంద శ్లోకాలు. కుష్టు వ్యాధితో బాధపడుతూ సూర్యాలయం ముందు పడుకొని ఈ శ్లోకాలు రచించాడు; ఆ తర్వాత నయమైందని ప్రతీతి. సంస్కృత భక్తి కవిత్వంలో ఒక అమూల్యమైన కృతి.',
    'desc_sa': 'कविमयूरविरचितं सूर्यस्य शतश्लोकात्मकं स्तोत्रम्। कुष्ठरोगपीडितो मयूरः सूर्यालयसमक्षं शयानः इदं स्तोत्रं रचयामास, ततश्च रोगमुक्तोऽभवदिति परम्परा।',
  },
  'meenakshi-pancha-ratnam': {
    'title_te': 'మీనాక్షీ పంచరత్నమ్', 'title_sa': 'मीनाक्षी पञ्चरत्नम्', 'title_en': 'Mīnākṣī Pañcaratnam',
    'tags': ['devi', 'meenakshi', 'shankaracharya', 'shakta'], 'theme': 'rose',
    'desc_en': 'Five gem-like verses on Goddess Mīnākṣī of Madurai by Ādi Śaṅkarācārya, composed during his visit to the Mīnākṣī Sundareśvara temple. Each verse glorifies her beauty, grace, and compassion. "Pañcaratnam" (five jewels) indicates five perfectly crafted stanzas.',
    'desc_te': 'ఆది శంకరాచార్యులు మదురై మీనాక్షీ సుందరేశ్వర ఆలయ సందర్శన సమయంలో రచించిన ఐదు శ్లోకాలు. మీనాక్షీదేవి యొక్క అందం, కరుణ మరియు దివ్య తేజస్సును ప్రతి శ్లోకం కీర్తిస్తుంది.',
    'desc_sa': 'आदिशङ्करेण मदुरायाः मीनाक्षीसुन्दरेश्वरमन्दिरदर्शनकाले विरचितानि पञ्चरत्नानि। प्रत्येकं श्लोकं देव्याः सौन्दर्यं करुणां च वर्णयति।',
  },
  'guru-ashtakam': {
    'title_te': 'గురు అష్టకమ్', 'title_sa': 'गुरु अष्टकम्', 'title_en': 'Guru Aṣṭakam',
    'tags': ['guru', 'shankaracharya', 'vedanta'], 'theme': 'saffron',
    'desc_en': 'Eight verses by Ādi Śaṅkarācārya emphasising the supreme importance of the Guru. Each verse describes a person who has achieved worldly success — wealth, beauty, fame, family — but declares that without devotion to the Guru, all is worthless. A powerful teaching on the guru-disciple relationship.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన గురు మహిమను వర్ణించే ఎనిమిది శ్లోకాలు. సంపద, సౌందర్యం, కీర్తి ఉన్నా గురుపాదభక్తి లేకుండా అన్నీ వ్యర్థమే అని ప్రతి శ్లోకం చాటుతుంది.',
    'desc_sa': 'आदिशङ्करविरचितम् गुरुमाहात्म्यप्रतिपादकम् अष्टकम्। ऐश्वर्यसौन्दर्ययशःकुटुम्बसम्पन्नोऽपि गुरुपादभक्तिविहीनः सर्वं व्यर्थमिति प्रत्येकश्लोके उच्यते।',
  },
  'ganesha-pancha-ratnam': {
    'title_te': 'గణేశ పంచరత్నమ్', 'title_sa': 'गणेश पञ्चरत्नम्', 'title_en': 'Gaṇeśa Pañcaratnam',
    'tags': ['ganesha', 'shankaracharya'], 'theme': 'orange',
    'desc_en': 'Five jewel-like verses on Lord Gaṇeśa by Ādi Śaṅkarācārya, offering praise of the elephant-headed deity as the remover of obstacles, lord of all beginnings, and son of Śiva-Pārvatī. Recited at the start of any auspicious undertaking.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన గణేశుని స్తుతిలో ఐదు రత్నాల వంటి శ్లోకాలు. విఘ్ననాశనుడు, శివపార్వతుల పుత్రుడు అయిన గజాననుని కీర్తిస్తాయి. శుభకార్యాల ఆరంభంలో పారాయణ చేస్తారు.',
    'desc_sa': 'आदिशङ्करविरचितानि गणेशस्य पञ्चरत्नात्मकानि स्तोत्राणि। विघ्ननाशनं शिवपार्वतीनन्दनं गजाननं स्तुवन्ति। शुभकार्यारम्भे पठनीयम्।',
  },
  'ganesha-bhujanga-stotram': {
    'title_te': 'గణేశ భుజంగ స్తోత్రమ్', 'title_sa': 'गणेश भुजङ्ग स्तोत्रम्', 'title_en': 'Gaṇeśa Bhujaṅga Stotram',
    'tags': ['ganesha', 'shankaracharya'], 'theme': 'orange',
    'desc_en': 'A stotram on Lord Gaṇeśa composed in the Bhujaṅgaprayāta metre — a serpentine rhythm that flows in undulating waves, traditionally associated with Śiva and Śakti hymns. Attributed to Ādi Śaṅkarācārya. Praises Gaṇeśa as the cosmic lord who grants wisdom, prosperity, and liberation.',
    'desc_te': 'భుజంగ ప్రయాత వృత్తంలో రచించిన గణేశ స్తోత్రం. ఈ వృత్తం సర్పం వలె ప్రవహించే లయను కలిగి ఉంటుంది. శంకరాచార్యులకు ఆపాదించబడిన ఈ స్తోత్రం జ్ఞానం, సంపద మరియు మోక్షాన్ని ఇచ్చే గణేశుని కీర్తిస్తుంది.',
    'desc_sa': 'भुजङ्गप्रयातवृत्ते विरचितं गणेशस्तोत्रम्, आदिशङ्करकृतमिति प्रसिद्धम्। ज्ञानसम्पन्मोक्षप्रदं गणेशं स्तौति।',
  },
  'maha-lakshmi-ashtakam': {
    'title_te': 'మహాలక్ష్మ్యష్టకమ్', 'title_sa': 'महालक्ष्म्यष्टकम्', 'title_en': 'Mahālakṣmy Aṣṭakam',
    'tags': ['lakshmi', 'devi', 'shakta'], 'theme': 'gold',
    'desc_en': 'Eight verses on Goddess Mahālakṣmī from the Padma Purāṇa, invoking her as the bestower of wealth, prosperity, courage, and liberation. Each verse addresses her with a different epithet and closes with a prayer for her grace. One of the most widely recited Lakṣmī stotras across India.',
    'desc_te': 'పద్మ పురాణం నుండి తీసుకోబడిన మహాలక్ష్మీ అష్టకం. సంపద, ధైర్యం మరియు మోక్షాన్ని ప్రసాదించే దేవిని వేర్వేరు నామాలతో స్తుతిస్తుంది. భారతదేశంలో విస్తృతంగా పఠించే లక్ష్మీ స్తోత్రాలలో ఒకటి.',
    'desc_sa': 'पद्मपुराणान्तर्गतं महालक्ष्म्याः अष्टकम्। ऐश्वर्यधैर्यमोक्षप्रदां देवीं नानानामभिः स्तुवन्ति। भारतदेशे सर्वत्र प्रसिद्धं लक्ष्मीस्तोत्रम्।',
  },
  'ashta-lakshmi-stotram': {
    'title_te': 'అష్టలక్ష్మీ స్తోత్రమ్', 'title_sa': 'अष्टलक्ष्मी स्तोत्रम्', 'title_en': 'Aṣṭalakṣmī Stotram',
    'tags': ['lakshmi', 'devi', 'shakta'], 'theme': 'gold',
    'desc_en': 'A stotram invoking the eight forms of Goddess Lakṣmī: Ādi (primordial), Dhana (wealth), Dhānya (grain), Gaja (elephant/prosperity), Santāna (progeny), Vīra (courage), Vijaya (victory), and Vidyā (knowledge). Each form is praised with dedicated verses. Popular in South Indian households for Friday worship.',
    'desc_te': 'అష్టలక్ష్మీ స్తోత్రం — ఆది, ధన, ధాన్య, గజ, సంతాన, వీర, విజయ, విద్యా అనే ఎనిమిది లక్ష్మీ స్వరూపాలను కీర్తిస్తుంది. దక్షిణ భారతంలో శుక్రవారం పూజలో విశేషంగా పారాయణ చేస్తారు.',
    'desc_sa': 'आदिधनधान्यगजसन्तानवीरविजयविद्याभिः अष्टाभिः लक्ष्मीरूपैः स्तोत्रम्। दक्षिणभारते शुक्रवारपूजायां विशेषतः पठ्यते।',
  },
  'matru-panchakam': {
    'title_te': 'మాతృ పంచకమ్', 'title_sa': 'मातृ पञ्चकम्', 'title_en': 'Mātṛ Pañcakam',
    'tags': ['shankaracharya', 'vedanta'], 'theme': 'green',
    'desc_en': 'Five verses attributed to Ādi Śaṅkarācārya, composed as an expression of grief and love upon the death of his mother Āryāmbā. Having taken sannyāsa, he was traditionally barred from performing her funeral rites, but according to tradition, he returned and performed them. These verses express a son\'s deep filial devotion.',
    'desc_te': 'ఆది శంకరాచార్యులు తన తల్లి ఆర్యాంబ మరణించినప్పుడు రచించారని చెప్పే ఐదు శ్లోకాలు. సన్న్యాసిగా అంత్యేష్టి చేయడం నిషిద్ధమైనా, తల్లి పట్ల కుమారుని అనురాగాన్ని ఈ శ్లోకాలు హృదయస్పర్శిగా చెప్తాయి.',
    'desc_sa': 'आदिशङ्करेण मातुः आर्याम्बायाः मरणे रचितानि पञ्चपद्यानि। सन्न्यासिनोऽपि मातरि गाढं पुत्रस्नेहं हृदयङ्गमरूपेण व्यञ्जयन्ति।',
  },
  'vishnu-panchayudha-stotram': {
    'title_te': 'విష్ణు పంచాయుధ స్తోత్రమ్', 'title_sa': 'विष्णु पञ्चायुध स्तोत्रम्', 'title_en': 'Viṣṇu Pañcāyudha Stotram',
    'tags': ['vishnu', 'vaishnavism'], 'theme': 'indigo',
    'desc_en': 'A stotram praising the five divine weapons of Lord Viṣṇu: Sudarśana Cakra (discus), Pāñcajanya (conch), Kaumodakī (mace), Nandaka (sword), and Śārṅga (bow). Each weapon is invoked for its specific protective power. Recited for protection from enemies and malefic forces.',
    'desc_te': 'విష్ణువు యొక్క ఐదు దివ్యాయుధాలను — సుదర్శన చక్రం, పాంచజన్యం, కౌమోదకి, నందకం, శారంగం — కీర్తించే స్తోత్రం. ప్రతి ఆయుధాన్ని రక్షణ శక్తికి ఆహ్వానించి పారాయణ చేస్తారు.',
    'desc_sa': 'विष्णोः सुदर्शनचक्रपाञ्चजन्यकौमोदकीनन्दकशार्ङ्गाख्यानि पञ्चायुधानि स्तुवत् स्तोत्रम्। शत्रुपीडानिवारणाय रक्षणार्थं पठ्यते।',
  },
  'nirvana-shatkam': {
    'title_te': 'నిర్వాణ షట్కమ్', 'title_sa': 'निर्वाण षट्कम्', 'title_en': 'Nirvāṇa Ṣaṭkam',
    'tags': ['shankaracharya', 'vedanta', 'advaita'], 'theme': 'blue',
    'desc_en': 'Six verses by Ādi Śaṅkarācārya, also known as Ātma Ṣaṭkam or Cit Ānanda Rūpaḥ. Each verse methodically negates what the Self is not — not the mind, not the senses, not the ego, not caste or creed — and closes with the declaration "I am pure consciousness-bliss, I am Śiva." A foundational text of Advaita Vedānta.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన ఆత్మ షట్కం లేదా నిర్వాణ షట్కం. ప్రతి శ్లోకం "నేను మనస్సు కాదు, ఇంద్రియాలు కాదు, అహంకారం కాదు" అని ఖండించి "చిదానంద రూపః శివోఽహం శివోఽహమ్" అని ముగుస్తుంది. అద్వైత వేదాంత మూలగ్రంథం.',
    'desc_sa': 'आदिशङ्करविरचितम् आत्मषट्कम्। प्रत्येकश्लोके मनःबुद्ध्यहङ्काराद्यात्मस्वरूपनिषेधपूर्वकं "चिदानन्दरूपः शिवोऽहं शिवोऽहम्" इति प्रतिपाद्यते। अद्वैतवेदान्तस्य मूलग्रन्थः।',
  },
  'sri-rama-raksha-stotram': {
    'title_te': 'శ్రీ రామ రక్షా స్తోత్రమ్', 'title_sa': 'श्रीरामरक्षास्तोत्रम्', 'title_en': 'Śrī Rāma Rakṣā Stotram',
    'tags': ['rama', 'vaishnava', 'protection'], 'theme': 'green',
    'desc_en': 'A protective hymn on Lord Rāma revealed to the sage Budhakaushika in a dream by Lord Śiva himself. One of the most powerful kavaca (armour) stotrams in the Vaiṣṇava tradition, it covers protection of every limb of the devotee\'s body by Rāma\'s divine names and attributes. Widely recited in Maharashtra and throughout India.',
    'desc_te': 'బుధకౌశిక మహర్షికి స్వప్నంలో శివుడు ఉపదేశించిన రామ రక్షా స్తోత్రం. రాముని నామాలతో భక్తుని శరీరంలోని ప్రతి అంగాన్ని రక్షించే కవచ స్తోత్రం. మహారాష్ట్రలో మరియు భారతదేశమంతటా విశేషంగా పఠిస్తారు.',
    'desc_sa': 'बुधकौशिकमुनये स्वप्ने शिवेन उपदिष्टं रामस्य कवचस्तोत्रम्। रामनामभिः भक्तस्याङ्गप्रत्यङ्गरक्षणं वर्ण्यते। महाराष्ट्रे सर्वभारते च व्यापकं पठ्यते।',
  },
  'subrahmanya-bhujanga-stotram': {
    'title_te': 'సుబ్రహ్మణ్య భుజంగ స్తోత్రమ్', 'title_sa': 'सुब्रह्मण्य भुजङ्ग स्तोत्रम्', 'title_en': 'Subrahmaṇya Bhujaṅga Stotram',
    'tags': ['subrahmanya', 'murugan', 'shankaracharya'], 'theme': 'orange',
    'desc_en': 'A stotram on Lord Subrahmaṇya (Murugan/Kārttikeya) by Ādi Śaṅkarācārya, composed in the Bhujaṅgaprayāta metre. Tradition holds it was composed at Tiruchendur when Śaṅkara was afflicted with an ailment, and reciting it brought him relief. Praises the six-faced warrior son of Śiva as the supreme deity of wisdom and liberation.',
    'desc_te': 'ఆది శంకరాచార్యులు తిరుచెందూర్ లో అనారోగ్యంతో ఉన్నప్పుడు రచించిన సుబ్రహ్మణ్య భుజంగ స్తోత్రం. భుజంగ ప్రయాత వృత్తంలో షణ్ముఖుని కీర్తించే ఈ స్తోత్ర పారాయణంతో నయమైందని ప్రతీతి.',
    'desc_sa': 'आदिशङ्करेण तिरुचेन्दूरे रुग्णावस्थायां विरचितं सुब्रह्मण्यस्य भुजङ्गप्रयातस्तोत्रम्। षण्मुखं ज्ञानमुक्तिप्रदं देवं स्तौति। पारायणेन आरोग्यं लब्धमिति परम्परा।',
  },
  'ashva-dhati-stotram': {
    'title_te': 'అశ్వధాటి స్తోత్రమ్', 'title_sa': 'अश्वधाटी स्तोत्रम्', 'title_en': 'Aśvadhāṭī Stotram',
    'tags': ['vishnu', 'venkateswara', 'kavya'], 'theme': 'indigo',
    'desc_en': 'A celebrated Sanskrit poem by Vedānta Deśika (13th–14th century) on Lord Veṅkaṭeśvara of Tirupati, composed in the Aśvadhāṭī metre — a fast galloping rhythm named after the gait of a horse. One of the most ornate and complex devotional compositions in Sanskrit, showcasing Deśika\'s mastery of alaṅkāra (poetic embellishments).',
    'desc_te': 'వేదాంత దేశికులు రచించిన తిరుపతి వేంకటేశ్వరుని అశ్వధాటి స్తోత్రం. గుర్రం పరుగు వేగాన్ని పోలిన అశ్వధాటి వృత్తంలో రచించిన ఈ స్తోత్రం సంస్కృత అలంకార శాస్త్రంలో ఒక అద్భుత కృతిగా పేరుగాంచింది.',
    'desc_sa': 'वेदान्तदेशिकविरचितं वेङ्कटेश्वरस्य अश्वधाटीस्तोत्रम्। अश्वगतिसदृशस्य अश्वधाटीवृत्तस्य संस्कृतालङ्काराणां च प्रयोगे देशिकस्य अपूर्वं पाण्डित्यं दृश्यते।',
  },
  'shivananda-lahari': {
    'title_te': 'శివానంద లహరీ', 'title_sa': 'शिवानन्द लहरी', 'title_en': 'Śivānanda Laharī',
    'tags': ['shiva', 'shankaracharya'], 'theme': 'blue',
    'desc_en': 'One hundred verses by Ādi Śaṅkarācārya in rapturous praise of Lord Śiva, expressing the waves (laharī) of bliss (ānanda) arising from devotion. Composed as a complement to Soundaryalaharī (which praises Śakti), it covers Śiva\'s cosmic form, his compassion, his dance, and the devotee\'s yearning for union. A masterpiece of Sanskrit bhakti poetry.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన శివ భక్తి లహరి — వంద శ్లోకాలలో శివుని స్తుతి. సౌందర్యలహరి శక్తిని కీర్తిస్తే, శివానంద లహరి శివుని విశ్వరూపాన్ని, కరుణను, నటరాజ తాండవాన్ని మరియు భక్తుని తన్మయత్వాన్ని వర్ణిస్తుంది.',
    'desc_sa': 'आदिशङ्करविरचिताः शिवस्तुतिपराः शतश्लोकाः। सौन्दर्यलहरी शक्तिं स्तौति, शिवानन्दलहरी शिवस्य विश्वरूपं करुणां ताण्डवं च वर्णयति। संस्कृतभक्तिकाव्यस्य अनुपमं रत्नम्।',
  },
  'lalita-pancha-ratnam': {
    'title_te': 'లలితా పంచరత్నమ్', 'title_sa': 'ललिता पञ्चरत्नम्', 'title_en': 'Lalitā Pañcaratnam',
    'tags': ['devi', 'lalita', 'shankaracharya', 'shakta'], 'theme': 'rose',
    'desc_en': 'Five jewel-like verses on Goddess Lalitā by Ādi Śaṅkarācārya. Lalitā ("the playful one") is the supreme form of Śakti, worshipped as the ruler of the universe and mother of all creation. Each verse glorifies her beauty, her compassion for devotees, and her identity with the ultimate reality. A compact and luminous companion to the longer Lalitā Sahasranāma.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన లలితాదేవి స్తుతిలో ఐదు రత్నాల వంటి శ్లోకాలు. విశ్వాన్ని పాలించే శక్తి స్వరూపిణి అయిన లలితాదేవి యొక్క సౌందర్యాన్ని, కరుణను మరియు పరతత్త్వంతో ఏకత్వాన్ని ప్రతి శ్లోకం కీర్తిస్తుంది.',
    'desc_sa': 'आदिशङ्करविरचितानि ललितादेव्याः पञ्चरत्नात्मकानि स्तोत्राणि। विश्वपालिकां शक्तिस्वरूपिणीं ललितादेवीं सौन्दर्यकरुणापरतत्त्वैक्यैः स्तुवन्ति। ललितासहस्रनाम्नः लघु सहोदरम्।',
  },
  'devi-aparadha-kshama-stotram': {
    'title_te': 'దేవీ అపరాధ క్షమాపణ స్తోత్రమ్', 'title_sa': 'देवी अपराध क्षमापण स्तोत्रम्', 'title_en': 'Devī Aparādha Kṣamāpaṇa Stotram',
    'tags': ['devi', 'shankaracharya', 'shakta'], 'theme': 'rose',
    'desc_en': 'A humble prayer by Ādi Śaṅkarācārya seeking the Goddess\'s forgiveness for all lapses, knowingly or unknowingly committed, in her worship — errors in mantra, ritual, posture, or devotion. Closes with the profound verse: "You are the mother; I am the son; you are the ocean of compassion — who but a mother forgives a wayward child?" One of the most emotionally resonant stotrams in the Śākta tradition.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన దేవీ అపరాధ క్షమాపణ స్తోత్రం. మంత్రంలో, పూజలో, ఆసనంలో, భక్తిలో తెలిసో తెలియకో చేసిన తప్పులకు క్షమించమని దేవిని వేడుకుంటారు. "నీవు తల్లివి, నేను పుత్రుడిని — తప్పు చేసిన బిడ్డను తల్లి కాదా క్షమించేది?" అనే హృదయస్పర్శి ఈ స్తోత్రంలో ఉంది.',
    'desc_sa': 'आदिशङ्करेण मन्त्रपूजासनभक्त्यादिषु ज्ञानाज्ञानकृतापराधान् क्षमयितुं विरचितं देव्याः क्षमाप्रार्थनास्तोत्रम्। "त्वमेव माता च पिता त्वमेव" इत्यादिना देव्याः करुणासागरतां वर्णयति। शाक्तपरम्परायाः अतिहृदयग्राहि स्तोत्रम्।',
  },
  'ganga-dhyanam': {
    'title_te': 'గంగా ధ్యానమ్', 'title_sa': 'गङ्गा ध्यानम्', 'title_en': 'Gaṅgā Dhyānam',
    'tags': ['ganga', 'tirtha', 'devi'], 'theme': 'blue',
    'desc_en': 'A meditative hymn invoking the sacred River Gaṅgā as a goddess — the celestial stream that descended from heaven, flows through Śiva\'s matted locks, and purifies all who bathe in or even think of her. Recited before bathing or beginning ritual worship, as a prayer for inner and outer purification.',
    'desc_te': 'స్వర్గం నుండి అవతరించి శివుని జటాజూటంలో ప్రవహించి లోకాన్ని పవిత్రం చేసే గంగాదేవిని ధ్యానించే స్తోత్రం. స్నానానికి లేదా పూజకు ముందు అంతర్బాహ్య శుద్ధి కోసం పారాయణ చేస్తారు.',
    'desc_sa': 'स्वर्गादवतीर्णां शिवजटाप्रवाहिनीं लोकपावनीं गङ्गादेवीं ध्यायत् स्तोत्रम्। स्नानात् पूर्वं शुद्ध्यर्थं पठ्यते।',
  },
  'hanuman-dvadasha-nama': {
    'title_te': 'హనుమాన్ ద్వాదశ నామ స్తోత్రమ్', 'title_sa': 'हनुमान् द्वादश नाम स्तोत्रम्', 'title_en': 'Hanumān Dvādaśa Nāma Stotram',
    'tags': ['hanuman', 'rama', 'dvadasha-nama'], 'theme': 'saffron',
    'desc_en': 'Twelve sacred names of Lord Hanumān, each encapsulating a facet of his divine glory — his strength, devotion, celibacy, wisdom, and fearlessness. Reciting these twelve names is said to bestow protection, courage, and freedom from fear. A compact yet powerful daily prayer for devotees of Hanumān.',
    'desc_te': 'హనుమంతుని పన్నెండు దివ్య నామాలు — ఆయన బలం, భక్తి, బ్రహ్మచర్యం, జ్ఞానం మరియు నిర్భయత్వాన్ని కీర్తిస్తాయి. ఈ నామాలు పారాయణ చేస్తే రక్షణ, ధైర్యం మరియు భయవిముక్తి కలుగుతాయని విశ్వాసం.',
    'desc_sa': 'हनुमतः द्वादशनामानि — बलभक्तिब्रह्मचर्यज्ञानाभयत्वादीन् स्तुवन्ति। पारायणेन रक्षा धैर्यं भयमुक्तिश्च लभ्यते इति विश्वासः।',
  },
  'ganesha-shodasha-nama': {
    'title_te': 'గణేశ షోడశ నామ స్తోత్రమ్', 'title_sa': 'गणेश षोडश नाम स्तोत्रम्', 'title_en': 'Gaṇeśa Ṣoḍaśa Nāma Stotram',
    'tags': ['ganesha', 'shodasha-nama'], 'theme': 'orange',
    'desc_en': 'Sixteen sacred names of Lord Gaṇeśa, each revealing a distinct aspect of his divine nature — remover of obstacles, lord of wisdom, son of Śiva-Pārvatī, and bestower of auspiciousness. Recited at the start of any undertaking, these sixteen names are considered a complete and protective invocation of Gaṇeśa.',
    'desc_te': 'గణేశుని పదహారు దివ్య నామాలు — విఘ్ననాశకుడు, జ్ఞానేశ్వరుడు, శివపార్వతీ తనయుడు మొదలైన వివిధ స్వరూపాలను కీర్తిస్తాయి. ఏ శుభకార్యమైనా ప్రారంభించేందుకు ముందు ఈ నామాలు పారాయణ చేస్తారు.',
    'desc_sa': 'गणेशस्य षोडशनामानि — विघ्ननाशनज्ञानेश्वरशिवपार्वतीनन्दनादिरूपाणि स्तुवन्ति। शुभकार्यारम्भे सम्पूर्णावाहनरूपेण पठ्यते।',
  },
  'dvadasha-jyotirlinga-stotram': {
    'title_te': 'ద్వాదశ జ్యోతిర్లింగ స్తోత్రమ్', 'title_sa': 'द्वादश ज्योतिर्लिङ्ग स्तोत्रम्', 'title_en': 'Dvādaśa Jyotirliṅga Stotram',
    'tags': ['shiva', 'jyotirlinga', 'tirtha'], 'theme': 'blue',
    'desc_en': 'A stotram naming and glorifying the twelve Jyotirliṅgas — the self-manifested, luminous shrines of Śiva scattered across the Indian subcontinent, from Somnāth in Gujarat to Rāmeśvara in Tamil Nadu. Reciting this stotram is equivalent, by tradition, to visiting all twelve shrines. Essential for Śiva devotees.',
    'desc_te': 'గుజరాత్ లో సోమనాథ్ నుండి తమిళనాడులో రామేశ్వరం వరకు భారతదేశమంతటా వెలసిన పన్నెండు జ్యోతిర్లింగాలను నామోల్లేఖనంతో కీర్తించే స్తోత్రం. ఈ స్తోత్రం పారాయణం పన్నెండు క్షేత్రాల దర్శనానికి సమానమని విశ్వాసం.',
    'desc_sa': 'सौराष्ट्रे सोमनाथात् रामेश्वरपर्यन्तं भारते विद्यमानानां द्वादशज्योतिर्लिङ्गानां नामोल्लेखपूर्वकं स्तोत्रम्। पारायणं द्वादशक्षेत्रदर्शनतुल्यमिति विश्वासः।',
  },
  'shiva-tandava-stotram': {
    'title_te': 'శివ తాండవ స్తోత్రమ్', 'title_sa': 'शिव ताण्डव स्तोत्रम्', 'title_en': 'Śiva Tāṇḍava Stotram',
    'tags': ['shiva', 'ravana', 'kavya'], 'theme': 'blue',
    'desc_en': 'A celebrated hymn composed by the demon-king Rāvaṇa in praise of Lord Śiva\'s cosmic dance (tāṇḍava). Written in a thunderous, galloping metre that mimics the rhythm of Śiva\'s dance, it is a tour de force of Sanskrit phonaesthetics and devotional fervour. Tradition holds that Rāvaṇa composed it while lifting Mount Kailāsa, and Śiva, pleased by his devotion, blessed him with the Candrahāsa sword.',
    'desc_te': 'రావణుడు శివుని తాండవ నృత్యాన్ని స్తుతిస్తూ రచించిన ప్రసిద్ధ స్తోత్రం. శివుని నృత్య లయను పోలే ఉరుమువంటి ఛందస్సులో రచించిన ఈ స్తోత్రం సంస్కృత కవిత్వంలో ఒక అద్భుత సృష్టి. కైలాసాన్ని ఎత్తినప్పుడు రావణుడు ఈ స్తోత్రం పాడాడని, ప్రసన్నుడైన శివుడు చంద్రహాస ఖడ్గాన్ని ప్రసాదించాడని ప్రతీతి.',
    'desc_sa': 'रावणविरचितं शिवस्य ताण्डवनृत्यस्तुतिपरं स्तोत्रम्। नृत्यलयानुकारिणि गर्जितवृत्ते रचितम् इदं संस्कृतकाव्यस्य अद्भुतं रत्नम्। कैलासोद्धरणे रावणेन गीतम्, प्रसन्नः शिवः चन्द्रहासखड्गं प्रादादिति परम्परा।',
  },
  'linga-ashtakam': {
    'title_te': 'లింగాష్టకమ్', 'title_sa': 'लिङ्गाष्टकम्', 'title_en': 'Liṅgāṣṭakam',
    'tags': ['shiva', 'linga'], 'theme': 'blue',
    'desc_en': 'Eight verses in praise of the Śivaliṅga — the aniconic form in which Śiva is most universally worshipped. Each verse glorifies the liṅga as the form of infinite light, the origin and dissolution of the cosmos, and the granter of liberation. Ends with the declaration: "I bow before that Śivaliṅga." Recited during Śiva pūjā and abhiṣekam.',
    'desc_te': 'శివలింగాన్ని కీర్తించే ఎనిమిది శ్లోకాలు. అనంతమైన జ్యోతి స్వరూపమైన, సృష్టి స్థితి లయలకు కారణమైన శివలింగాన్ని స్తుతిస్తాయి. శివపూజ మరియు అభిషేక సమయంలో పఠిస్తారు.',
    'desc_sa': 'शिवलिङ्गस्य अष्टश्लोकात्मकं स्तोत्रम्। अनन्तज्योतिस्वरूपं सृष्टिस्थितिलयकारणं शिवलिङ्गं स्तुवन्ति। शिवपूजायामभिषेके च पठ्यते।',
  },
  'bilva-ashtakam': {
    'title_te': 'బిల్వాష్టకమ్', 'title_sa': 'बिल्वाष्टकम्', 'title_en': 'Bilvāṣṭakam',
    'tags': ['shiva', 'bilva'], 'theme': 'green',
    'desc_en': 'Eight verses glorifying the bilva (bael) leaf as the most sacred offering to Lord Śiva. Each verse describes the divine merits of the bilva tree and the act of offering its three-leafed sprigs to Śiva, equating it to the performance of great austerities and pilgrimages. Recited while offering bilva leaves during Śiva worship, especially on Śivarātri and Mondays.',
    'desc_te': 'శివుడికి అత్యంత ప్రియమైన బిల్వ పత్రాన్ని కీర్తించే ఎనిమిది శ్లోకాలు. బిల్వ వృక్షం యొక్క పవిత్రతను, మూడు దళాల పత్రాన్ని శివుడికి సమర్పించడం వల్ల గొప్ప తపస్సు చేసిన ఫలం వస్తుందని వర్ణిస్తాయి. శివరాత్రి మరియు సోమవారాలలో పూజలో పఠిస్తారు.',
    'desc_sa': 'शिवप्रियस्य बिल्वपत्रस्य माहात्म्यं वर्णयत् अष्टकम्। त्रिदलस्य बिल्वपत्रसमर्पणं महातपःतीर्थफलतुल्यमिति प्रत्येकश्लोके उच्यते। शिवरात्रौ सोमवारेषु च पठ्यते।',
  },
  'shiva-panchakshari-stotram': {
    'title_te': 'శివ పంచాక్షరీ స్తోత్రమ్', 'title_sa': 'शिव पञ्चाक्षरी स्तोत्रम्', 'title_en': 'Śiva Pañcākṣarī Stotram',
    'tags': ['shiva', 'shankaracharya', 'mantra'], 'theme': 'blue',
    'desc_en': 'Five verses by Ādi Śaṅkarācārya, each beginning with one of the five syllables of the Namaḥ Śivāya mantra (Na-Ma-Śi-Vā-Ya). Each verse meditates on Śiva through that syllable\'s associated symbolism. Together they form a complete contemplation of the Pañcākṣara mantra — the most sacred mantra of Śaivism. Ends with a phalaśruti stating the benefits of its recitation.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన శివ పంచాక్షర స్తోత్రం. "నమఃశివాయ" అనే పంచాక్షర మంత్రంలోని ప్రతి అక్షరంతో ఒక్కో శ్లోకం ప్రారంభమవుతుంది. శైవ సంప్రదాయంలో అత్యంత పవిత్రమైన ఈ మంత్రాన్ని ధ్యానించే సంపూర్ణ స్తోత్రం.',
    'desc_sa': 'आदिशङ्करविरचितं पञ्चाक्षरस्तोत्रम्। "नमःशिवाय" इति मन्त्रस्य प्रत्येकाक्षरेण प्रारभ्यमाणैः पञ्चश्लोकैः शिवं ध्यायति। शैवसम्प्रदाये परमपवित्रस्य मन्त्रस्य सम्पूर्णध्यानरूपम्।',
  },
  'sankata-nashana-ganesha-stotram': {
    'title_te': 'సంకటనాశన గణేశ స్తోత్రమ్', 'title_sa': 'सङ्कट नाशन गणेश स्तोत्रम्', 'title_en': 'Saṅkaṭa Nāśana Gaṇeśa Stotram',
    'tags': ['ganesha', 'narada'], 'theme': 'orange',
    'desc_en': 'A stotram attributed to the sage Nārada, listing twelve names of Gaṇeśa that destroy all troubles and hardships (saṅkaṭa). Reciting this on Tuesdays and the fourth lunar day (Chaturthi) is said to remove obstacles, illness, and misfortune. Popular across Maharashtra and South India for crisis prayers.',
    'desc_te': 'నారద మహర్షికి ఆపాదించిన సంకటనాశన గణేశ స్తోత్రం. గణేశుని పన్నెండు నామాలను కీర్తించి కష్టాలు, అడ్డంకులు మరియు వ్యాధులు తొలగిపోతాయని వివరిస్తుంది. మంగళవారాలు మరియు చతుర్థి రోజులలో పఠిస్తారు.',
    'desc_sa': 'नारदमुनिकृतं गणेशस्य द्वादशनामसंकटनाशनस्तोत्रम्। मङ्गलवारे चतुर्थ्यां च पारायणेन विघ्नरोगदुर्भाग्यनाशो भवतीति विश्वासः।',
  },
  'dasha-shloki': {
    'title_te': 'దశ శ్లోకీ', 'title_sa': 'दश श्लोकी', 'title_en': 'Daśa Ślokī',
    'tags': ['shankaracharya', 'vedanta', 'advaita'], 'theme': 'saffron',
    'desc_en': 'Ten verses by Ādi Śaṅkarācārya expressing the essence of Advaita Vedānta in ten compact stanzas. Also known as Daśaślokī or Nijasvabhāvabodha, it progressively establishes the identity of the individual self (jīva) with the supreme Brahman. Each verse closes with "na ca duḥkha-lepaḥ" — "I am untouched by sorrow." A concise distillation of non-dual philosophy.',
    'desc_te': 'ఆది శంకరాచార్యులు రచించిన పది శ్లోకాలలో అద్వైత వేదాంత సారాంశం. జీవుడు మరియు పరబ్రహ్మ ఏకమేనని ధాపించే ఈ శ్లోకాలు "నా చ దుఃఖ లేపః — నాకు దుఃఖం అంటదు" అని ముగుస్తాయి. అద్వైత తత్వ సంగ్రహం.',
    'desc_sa': 'आदिशङ्करविरचिता दशश्लोक्यात्मकं अद्वैतवेदान्तसारम्। जीवपरब्रह्मणोः एकत्वं प्रतिपादयन्तः श्लोकाः "न च दुःखलेपः" इति समाप्यन्ते। अद्वैतदर्शनस्य लघु संग्रहः।',
  },
  'bhartruhari-subhashitani': {
    'title_te': 'భర్తృహరి సుభాషితాని', 'title_sa': 'भर्तृहरि सुभाषितानि', 'title_en': 'Bhartṛhari Subhāṣitāni',
    'tags': ['subhashitam', 'niti', 'philosophy', 'poetry'], 'theme': 'green',
    'desc_en': 'Selected maxims from Bhartṛhari\'s three Śatakas — Nītiśataka (ethics and worldly wisdom), Śṛṅgāraśataka (love), and Vairāgyaśataka (renunciation). Bhartṛhari (5th–7th century CE) was a king turned ascetic; his verses combine keen insight into human nature with philosophical depth. Among the finest subhāṣitams in Sanskrit literature.',
    'desc_te': 'భర్తృహరి రచించిన నీతి, శృంగార, వైరాగ్య శతకాల నుండి ఎంపిక చేసిన సుభాషితాలు. రాజు నుండి సన్న్యాసిగా మారిన భర్తృహరి మానవ స్వభావాన్ని తీవ్రంగా విశ్లేషించారు. సంస్కృత సాహిత్యంలో అత్యుత్తమ సుభాషితాలుగా ప్రసిద్ధి చెందాయి.',
    'desc_sa': 'भर्तृहरिविरचितानां नीतिशृङ्गारवैराग्यशतकानां चयनितानि सुभाषितानि। राजाद्यासन्न्यासं गतस्य भर्तृहरेः श्लोकाः मानवस्वभावविश्लेषणे दार्शनिकगाम्भीर्ये च अद्वितीयाः।',
  },
}

def scaffold(slug):
    meta = CATALOGUE.get(slug)
    if not meta:
        print(f'ERROR: "{slug}" not in catalogue'); return

    folder = Path(f'data/stotram/{slug}')
    folder.mkdir(parents=True, exist_ok=True)

    # txt placeholder
    txt = folder / f'{slug}.txt'
    if not txt.exists():
        txt.write_text('త్వరలో వస్తుంది\n', encoding='utf-8')
        print(f'  created {txt}')
    else:
        print(f'  skipped {txt} (exists)')

    # meta.json
    meta_path = folder / f'{slug}_meta.json'
    if not meta_path.exists():
        obj = {
            'slug': slug,
            'title_te': meta['title_te'],
            'title_sa': meta['title_sa'],
            'title_en': meta['title_en'],
            'description_en': meta['desc_en'],
            'description_te': meta['desc_te'],
            'description_sa': meta['desc_sa'],
            'theme': meta['theme'],
            'tags': meta['tags'],
            'featured': False,
            'sections': [{'id': 'main', 'title_te': meta['title_te'],
                           'title_sa': meta['title_sa'], 'title_en': meta['title_en'],
                           'file': f'{slug}.txt'}]
        }
        meta_path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'  created {meta_path}')
    else:
        print(f'  skipped {meta_path} (exists)')

    # stotrams.json
    d = json.loads(STOTRAMS_JSON.read_text())
    if any(e['slug'] == slug for e in d['stotrams']):
        print(f'  skipped stotrams.json (entry exists)')
    else:
        d['stotrams'].append({
            'slug': slug,
            'title_te': meta['title_te'],
            'title_sa': meta['title_sa'],
            'title_en': meta['title_en'],
            'tags': meta['tags'],
            'theme': meta['theme'],
        })
        STOTRAMS_JSON.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'  added to stotrams.json')

if __name__ == '__main__':
    slugs = sys.argv[1:] or list(CATALOGUE.keys())
    for s in slugs:
        print(f'\n→ {s}')
        scaffold(s)
    print('\nDone.')
