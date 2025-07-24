const translateText = async (text: string, lang: string): Promise<string> => {
  // Call Google Translate API
  const response = await fetch(
    `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=${lang}&q=${encodeURIComponent(
      text,
    )}`,
  );
  if (response.ok === false) {
    throw new Error("Failed to translate text");
  }

  // Parse response
  try {
    const data = await response.json();
    const chunks = data[0];
    return chunks.map((chunk: string[]) => chunk[0]).join("");
  } catch (error) {
    throw new Error("Failed to parse translate response");
  }
};

// Function overloads for different input types
function translate(input: string, lang: string): Promise<string>;
function translate<T extends Record<string, unknown>>(
  input: T,
  lang: string,
): Promise<T>;
function translate<T>(input: T[], lang: string): Promise<T[]>;

async function translate<T>(input: T, lang: string): Promise<T> {
  // Handle string type
  if (typeof input === "string") {
    return translateText(input, lang) as Promise<T>;
  }

  // Handle array type
  if (Array.isArray(input)) {
    const translatedArray = await Promise.all(
      input.map(async (item) => {
        if (typeof item === "string") {
          return translateText(item, lang);
        }
        return translate(item, lang);
      }),
    );
    return translatedArray as T;
  }

  // Handle object type
  if (input !== null && typeof input === "object") {
    const translatedObject: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        translatedObject[key] = await translateText(value, lang);
      } else if (
        Array.isArray(value) ||
        (value !== null && typeof value === "object")
      ) {
        translatedObject[key] = await translate(value, lang);
      } else {
        translatedObject[key] = value;
      }
    }

    return translatedObject as T;
  }

  // Return as-is for other types (numbers, booleans, null, etc.)
  return input;
}

const languages = [
  {
    value: "none",
    label: "User input language (No translation)",
  },
  {
    value: "ab",
    label: "Abkhaz",
  },
  {
    value: "ace",
    label: "Acehnese",
  },
  {
    value: "ach",
    label: "Acholi",
  },
  {
    value: "aa",
    label: "Afar",
  },
  {
    value: "af",
    label: "Afrikaans",
  },
  {
    value: "sq",
    label: "Albanian",
  },
  {
    value: "alz",
    label: "Alur",
  },
  {
    value: "am",
    label: "Amharic",
  },
  {
    value: "ar",
    label: "Arabic",
  },
  {
    value: "hy",
    label: "Armenian",
  },
  {
    value: "as",
    label: "Assamese",
  },
  {
    value: "av",
    label: "Avar",
  },
  {
    value: "awa",
    label: "Awadhi",
  },
  {
    value: "ay",
    label: "Aymara",
  },
  {
    value: "az",
    label: "Azerbaijani",
  },
  {
    value: "ban",
    label: "Balinese",
  },
  {
    value: "bal",
    label: "Baluchi",
  },
  {
    value: "bm",
    label: "Bambara",
  },
  {
    value: "bci",
    label: "Baoulé",
  },
  {
    value: "ba",
    label: "Bashkir",
  },
  {
    value: "eu",
    label: "Basque",
  },
  {
    value: "btx",
    label: "Batak Karo",
  },
  {
    value: "bts",
    label: "Batak Simalungun",
  },
  {
    value: "bbc",
    label: "Batak Toba",
  },
  {
    value: "be",
    label: "Belarusian",
  },
  {
    value: "bem",
    label: "Bemba",
  },
  {
    value: "bn",
    label: "Bengali",
  },
  {
    value: "bew",
    label: "Betawi",
  },
  {
    value: "bho",
    label: "Bhojpuri",
  },
  {
    value: "bik",
    label: "Bikol",
  },
  {
    value: "bs",
    label: "Bosnian",
  },
  {
    value: "br",
    label: "Breton",
  },
  {
    value: "bg",
    label: "Bulgarian",
  },
  {
    value: "bua",
    label: "Buryat",
  },
  {
    value: "yue",
    label: "Cantonese",
  },
  {
    value: "ca",
    label: "Catalan",
  },
  {
    value: "ceb",
    label: "Cebuano",
  },
  {
    value: "ch",
    label: "Chamorro",
  },
  {
    value: "ce",
    label: "Chechen",
  },
  {
    value: "ny",
    label: "Chichewa",
  },
  {
    value: "zh-CN",
    label: "Chinese (Simplified)",
  },
  {
    value: "zh-TW",
    label: "Chinese (Traditional)",
  },
  {
    value: "chk",
    label: "Chuukese",
  },
  {
    value: "cv",
    label: "Chuvash",
  },
  {
    value: "co",
    label: "Corsican",
  },
  {
    value: "crh",
    label: "Crimean Tatar (Cyrillic)",
  },
  {
    value: "crh-Latn",
    label: "Crimean Tatar (Latin)",
  },
  {
    value: "hr",
    label: "Croatian",
  },
  {
    value: "cs",
    label: "Czech",
  },
  {
    value: "da",
    label: "Danish",
  },
  {
    value: "fa-AF",
    label: "Dari",
  },
  {
    value: "dv",
    label: "Dhivehi",
  },
  {
    value: "din",
    label: "Dinka",
  },
  {
    value: "doi",
    label: "Dogri",
  },
  {
    value: "dov",
    label: "Dombe",
  },
  {
    value: "nl",
    label: "Dutch",
  },
  {
    value: "dyu",
    label: "Dyula",
  },
  {
    value: "dz",
    label: "Dzongkha",
  },
  {
    value: "en",
    label: "English",
  },
  {
    value: "eo",
    label: "Esperanto",
  },
  {
    value: "et",
    label: "Estonian",
  },
  {
    value: "ee",
    label: "Ewe",
  },
  {
    value: "fo",
    label: "Faroese",
  },
  {
    value: "fj",
    label: "Fijian",
  },
  {
    value: "tl",
    label: "Filipino",
  },
  {
    value: "fi",
    label: "Finnish",
  },
  {
    value: "fon",
    label: "Fon",
  },
  {
    value: "fr",
    label: "French",
  },
  {
    value: "fr-CA",
    label: "French (Canada)",
  },
  {
    value: "fy",
    label: "Frisian",
  },
  {
    value: "fur",
    label: "Friulian",
  },
  {
    value: "ff",
    label: "Fulani",
  },
  {
    value: "gaa",
    label: "Ga",
  },
  {
    value: "gl",
    label: "Galician",
  },
  {
    value: "ka",
    label: "Georgian",
  },
  {
    value: "de",
    label: "German",
  },
  {
    value: "el",
    label: "Greek",
  },
  {
    value: "gn",
    label: "Guarani",
  },
  {
    value: "gu",
    label: "Gujarati",
  },
  {
    value: "ht",
    label: "Haitian Creole",
  },
  {
    value: "cnh",
    label: "Hakha Chin",
  },
  {
    value: "ha",
    label: "Hausa",
  },
  {
    value: "haw",
    label: "Hawaiian",
  },
  {
    value: "iw",
    label: "Hebrew",
  },
  {
    value: "hil",
    label: "Hiligaynon",
  },
  {
    value: "hi",
    label: "Hindi",
  },
  {
    value: "hmn",
    label: "Hmong",
  },
  {
    value: "hu",
    label: "Hungarian",
  },
  {
    value: "hrx",
    label: "Hunsrik",
  },
  {
    value: "iba",
    label: "Iban",
  },
  {
    value: "is",
    label: "Icelandic",
  },
  {
    value: "ig",
    label: "Igbo",
  },
  {
    value: "ilo",
    label: "Ilocano",
  },
  {
    value: "id",
    label: "Indonesian",
  },
  {
    value: "iu-Latn",
    label: "Inuktut (Latin)",
  },
  {
    value: "iu",
    label: "Inuktut (Syllabics)",
  },
  {
    value: "ga",
    label: "Irish",
  },
  {
    value: "it",
    label: "Italian",
  },
  {
    value: "jam",
    label: "Jamaican Patois",
  },
  {
    value: "ja",
    label: "Japanese",
  },
  {
    value: "jw",
    label: "Javanese",
  },
  {
    value: "kac",
    label: "Jingpo",
  },
  {
    value: "kl",
    label: "Kalaallisut",
  },
  {
    value: "kn",
    label: "Kannada",
  },
  {
    value: "kr",
    label: "Kanuri",
  },
  {
    value: "pam",
    label: "Kapampangan",
  },
  {
    value: "kk",
    label: "Kazakh",
  },
  {
    value: "kha",
    label: "Khasi",
  },
  {
    value: "km",
    label: "Khmer",
  },
  {
    value: "cgg",
    label: "Kiga",
  },
  {
    value: "kg",
    label: "Kikongo",
  },
  {
    value: "rw",
    label: "Kinyarwanda",
  },
  {
    value: "ktu",
    label: "Kituba",
  },
  {
    value: "trp",
    label: "Kokborok",
  },
  {
    value: "kv",
    label: "Komi",
  },
  {
    value: "gom",
    label: "Konkani",
  },
  {
    value: "ko",
    label: "Korean",
  },
  {
    value: "kri",
    label: "Krio",
  },
  {
    value: "ku",
    label: "Kurdish (Kurmanji)",
  },
  {
    value: "ckb",
    label: "Kurdish (Sorani)",
  },
  {
    value: "ky",
    label: "Kyrgyz",
  },
  {
    value: "lo",
    label: "Lao",
  },
  {
    value: "ltg",
    label: "Latgalian",
  },
  {
    value: "la",
    label: "Latin",
  },
  {
    value: "lv",
    label: "Latvian",
  },
  {
    value: "lij",
    label: "Ligurian",
  },
  {
    value: "li",
    label: "Limburgish",
  },
  {
    value: "ln",
    label: "Lingala",
  },
  {
    value: "lt",
    label: "Lithuanian",
  },
  {
    value: "lmo",
    label: "Lombard",
  },
  {
    value: "lg",
    label: "Luganda",
  },
  {
    value: "luo",
    label: "Luo",
  },
  {
    value: "lb",
    label: "Luxembourgish",
  },
  {
    value: "mk",
    label: "Macedonian",
  },
  {
    value: "mad",
    label: "Madurese",
  },
  {
    value: "mai",
    label: "Maithili",
  },
  {
    value: "mak",
    label: "Makassar",
  },
  {
    value: "mg",
    label: "Malagasy",
  },
  {
    value: "ms",
    label: "Malay",
  },
  {
    value: "ms-Arab",
    label: "Malay (Jawi)",
  },
  {
    value: "ml",
    label: "Malayalam",
  },
  {
    value: "mt",
    label: "Maltese",
  },
  {
    value: "mam",
    label: "Mam",
  },
  {
    value: "gv",
    label: "Manx",
  },
  {
    value: "mi",
    label: "Maori",
  },
  {
    value: "mr",
    label: "Marathi",
  },
  {
    value: "mh",
    label: "Marshallese",
  },
  {
    value: "mwr",
    label: "Marwadi",
  },
  {
    value: "mfe",
    label: "Mauritian Creole",
  },
  {
    value: "chm",
    label: "Meadow Mari",
  },
  {
    value: "mni-Mtei",
    label: "Meiteilon (Manipuri)",
  },
  {
    value: "min",
    label: "Minang",
  },
  {
    value: "lus",
    label: "Mizo",
  },
  {
    value: "mn",
    label: "Mongolian",
  },
  {
    value: "my",
    label: "Myanmar (Burmese)",
  },
  {
    value: "nhe",
    label: "Nahuatl (Eastern Huasteca)",
  },
  {
    value: "ndc-ZW",
    label: "Ndau",
  },
  {
    value: "nr",
    label: "Ndebele (South)",
  },
  {
    value: "new",
    label: "Nepalbhasa (Newari)",
  },
  {
    value: "ne",
    label: "Nepali",
  },
  {
    value: "bm-Nkoo",
    label: "NKo",
  },
  {
    value: "no",
    label: "Norwegian",
  },
  {
    value: "nus",
    label: "Nuer",
  },
  {
    value: "oc",
    label: "Occitan",
  },
  {
    value: "or",
    label: "Odia (Oriya)",
  },
  {
    value: "om",
    label: "Oromo",
  },
  {
    value: "os",
    label: "Ossetian",
  },
  {
    value: "pag",
    label: "Pangasinan",
  },
  {
    value: "pap",
    label: "Papiamento",
  },
  {
    value: "ps",
    label: "Pashto",
  },
  {
    value: "fa",
    label: "Persian",
  },
  {
    value: "pl",
    label: "Polish",
  },
  {
    value: "pt",
    label: "Portuguese (Brazil)",
  },
  {
    value: "pt-PT",
    label: "Portuguese (Portugal)",
  },
  {
    value: "pa",
    label: "Punjabi (Gurmukhi)",
  },
  {
    value: "pa-Arab",
    label: "Punjabi (Shahmukhi)",
  },
  {
    value: "qu",
    label: "Quechua",
  },
  {
    value: "kek",
    label: "Qʼeqchiʼ",
  },
  {
    value: "rom",
    label: "Romani",
  },
  {
    value: "ro",
    label: "Romanian",
  },
  {
    value: "rn",
    label: "Rundi",
  },
  {
    value: "ru",
    label: "Russian",
  },
  {
    value: "se",
    label: "Sami (North)",
  },
  {
    value: "sm",
    label: "Samoan",
  },
  {
    value: "sg",
    label: "Sango",
  },
  {
    value: "sa",
    label: "Sanskrit",
  },
  {
    value: "sat-Latn",
    label: "Santali (Latin)",
  },
  {
    value: "sat",
    label: "Santali (Ol Chiki)",
  },
  {
    value: "gd",
    label: "Scots Gaelic",
  },
  {
    value: "nso",
    label: "Sepedi",
  },
  {
    value: "sr",
    label: "Serbian",
  },
  {
    value: "st",
    label: "Sesotho",
  },
  {
    value: "crs",
    label: "Seychellois Creole",
  },
  {
    value: "shn",
    label: "Shan",
  },
  {
    value: "sn",
    label: "Shona",
  },
  {
    value: "scn",
    label: "Sicilian",
  },
  {
    value: "szl",
    label: "Silesian",
  },
  {
    value: "sd",
    label: "Sindhi",
  },
  {
    value: "si",
    label: "Sinhala",
  },
  {
    value: "sk",
    label: "Slovak",
  },
  {
    value: "sl",
    label: "Slovenian",
  },
  {
    value: "so",
    label: "Somali",
  },
  {
    value: "es",
    label: "Spanish",
  },
  {
    value: "su",
    label: "Sundanese",
  },
  {
    value: "sus",
    label: "Susu",
  },
  {
    value: "sw",
    label: "Swahili",
  },
  {
    value: "ss",
    label: "Swati",
  },
  {
    value: "sv",
    label: "Swedish",
  },
  {
    value: "ty",
    label: "Tahitian",
  },
  {
    value: "tg",
    label: "Tajik",
  },
  {
    value: "ber-Latn",
    label: "Tamazight",
  },
  {
    value: "ber",
    label: "Tamazight (Tifinagh)",
  },
  {
    value: "ta",
    label: "Tamil",
  },
  {
    value: "tt",
    label: "Tatar",
  },
  {
    value: "te",
    label: "Telugu",
  },
  {
    value: "tet",
    label: "Tetum",
  },
  {
    value: "th",
    label: "Thai",
  },
  {
    value: "bo",
    label: "Tibetan",
  },
  {
    value: "ti",
    label: "Tigrinya",
  },
  {
    value: "tiv",
    label: "Tiv",
  },
  {
    value: "tpi",
    label: "Tok Pisin",
  },
  {
    value: "to",
    label: "Tongan",
  },
  {
    value: "lua",
    label: "Tshiluba",
  },
  {
    value: "ts",
    label: "Tsonga",
  },
  {
    value: "tn",
    label: "Tswana",
  },
  {
    value: "tcy",
    label: "Tulu",
  },
  {
    value: "tum",
    label: "Tumbuka",
  },
  {
    value: "tr",
    label: "Turkish",
  },
  {
    value: "tk",
    label: "Turkmen",
  },
  {
    value: "tyv",
    label: "Tuvan",
  },
  {
    value: "ak",
    label: "Twi",
  },
  {
    value: "udm",
    label: "Udmurt",
  },
  {
    value: "uk",
    label: "Ukrainian",
  },
  {
    value: "ur",
    label: "Urdu",
  },
  {
    value: "ug",
    label: "Uyghur",
  },
  {
    value: "uz",
    label: "Uzbek",
  },
  {
    value: "ve",
    label: "Venda",
  },
  {
    value: "vec",
    label: "Venetian",
  },
  {
    value: "vi",
    label: "Vietnamese",
  },
  {
    value: "war",
    label: "Waray",
  },
  {
    value: "cy",
    label: "Welsh",
  },
  {
    value: "wo",
    label: "Wolof",
  },
  {
    value: "xh",
    label: "Xhosa",
  },
  {
    value: "sah",
    label: "Yakut",
  },
  {
    value: "yi",
    label: "Yiddish",
  },
  {
    value: "yo",
    label: "Yoruba",
  },
  {
    value: "yua",
    label: "Yucatec Maya",
  },
  {
    value: "zap",
    label: "Zapotec",
  },
  {
    value: "zu",
    label: "Zulu",
  },
];
const languagesLabelMap = new Map<string, string>(
  languages.map((lang) => [lang.value, lang.label]),
);

export { languages, languagesLabelMap, translate };
