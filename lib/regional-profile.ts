// Global regional profile helpers. Currency, language and locale defaults are
// derived from the selected country instead of assuming Sri Lanka.
export type RegionalProfile = { countryCode: string; currency: string; language: string; locale?: string };

const COUNTRY_META: Record<string, RegionalProfile> = {
  "Afghanistan": {
    "countryCode": "AF",
    "currency": "AFN",
    "language": "fa"
  },
  "Albania": {
    "countryCode": "AL",
    "currency": "ALL",
    "language": "sq"
  },
  "Algeria": {
    "countryCode": "DZ",
    "currency": "DZD",
    "language": "ar"
  },
  "Andorra": {
    "countryCode": "AD",
    "currency": "EUR",
    "language": "ca"
  },
  "Angola": {
    "countryCode": "AO",
    "currency": "AOA",
    "language": "pt"
  },
  "Antigua and Barbuda": {
    "countryCode": "AG",
    "currency": "XCD",
    "language": "en"
  },
  "Argentina": {
    "countryCode": "AR",
    "currency": "ARS",
    "language": "es"
  },
  "Armenia": {
    "countryCode": "AM",
    "currency": "AMD",
    "language": "hy"
  },
  "Australia": {
    "countryCode": "AU",
    "currency": "AUD",
    "language": "en"
  },
  "Austria": {
    "countryCode": "AT",
    "currency": "EUR",
    "language": "de"
  },
  "Azerbaijan": {
    "countryCode": "AZ",
    "currency": "AZN",
    "language": "az"
  },
  "Bahamas": {
    "countryCode": "BS",
    "currency": "BSD",
    "language": "en"
  },
  "Bahrain": {
    "countryCode": "BH",
    "currency": "BHD",
    "language": "ar"
  },
  "Bangladesh": {
    "countryCode": "BD",
    "currency": "BDT",
    "language": "bn"
  },
  "Barbados": {
    "countryCode": "BB",
    "currency": "BBD",
    "language": "en"
  },
  "Belarus": {
    "countryCode": "BY",
    "currency": "BYN",
    "language": "be"
  },
  "Belgium": {
    "countryCode": "BE",
    "currency": "EUR",
    "language": "nl"
  },
  "Belize": {
    "countryCode": "BZ",
    "currency": "BZD",
    "language": "en"
  },
  "Benin": {
    "countryCode": "BJ",
    "currency": "XOF",
    "language": "fr"
  },
  "Bhutan": {
    "countryCode": "BT",
    "currency": "INR",
    "language": "dz"
  },
  "Bolivia": {
    "countryCode": "BO",
    "currency": "BOB",
    "language": "es"
  },
  "Bosnia and Herzegovina": {
    "countryCode": "BA",
    "currency": "BAM",
    "language": "bs"
  },
  "Botswana": {
    "countryCode": "BW",
    "currency": "BWP",
    "language": "en"
  },
  "Brazil": {
    "countryCode": "BR",
    "currency": "BRL",
    "language": "pt"
  },
  "Brunei": {
    "countryCode": "BN",
    "currency": "BND",
    "language": "ms"
  },
  "Bulgaria": {
    "countryCode": "BG",
    "currency": "BGN",
    "language": "bg"
  },
  "Burkina Faso": {
    "countryCode": "BF",
    "currency": "XOF",
    "language": "fr"
  },
  "Burundi": {
    "countryCode": "BI",
    "currency": "BIF",
    "language": "rn"
  },
  "Cabo Verde": {
    "countryCode": "CV",
    "currency": "CVE",
    "language": "pt"
  },
  "Cambodia": {
    "countryCode": "KH",
    "currency": "KHR",
    "language": "km"
  },
  "Cameroon": {
    "countryCode": "CM",
    "currency": "XAF",
    "language": "fr"
  },
  "Canada": {
    "countryCode": "CA",
    "currency": "CAD",
    "language": "en"
  },
  "Central African Republic": {
    "countryCode": "CF",
    "currency": "XAF",
    "language": "sg"
  },
  "Chad": {
    "countryCode": "TD",
    "currency": "XAF",
    "language": "ar"
  },
  "Chile": {
    "countryCode": "CL",
    "currency": "CLP",
    "language": "es"
  },
  "China": {
    "countryCode": "CN",
    "currency": "CNY",
    "language": "zh"
  },
  "Colombia": {
    "countryCode": "CO",
    "currency": "COP",
    "language": "es"
  },
  "Comoros": {
    "countryCode": "KM",
    "currency": "KMF",
    "language": "ar"
  },
  "Congo (Republic of the)": {
    "countryCode": "CG",
    "currency": "XAF",
    "language": "fr"
  },
  "Costa Rica": {
    "countryCode": "CR",
    "currency": "CRC",
    "language": "es"
  },
  "Croatia": {
    "countryCode": "HR",
    "currency": "EUR",
    "language": "hr"
  },
  "Cuba": {
    "countryCode": "CU",
    "currency": "CUP",
    "language": "es"
  },
  "Cyprus": {
    "countryCode": "CY",
    "currency": "EUR",
    "language": "el"
  },
  "Czech Republic": {
    "countryCode": "CZ",
    "currency": "CZK",
    "language": "cs"
  },
  "Democratic Republic of the Congo": {
    "countryCode": "CD",
    "currency": "CDF",
    "language": "fr"
  },
  "Denmark": {
    "countryCode": "DK",
    "currency": "DKK",
    "language": "da"
  },
  "Djibouti": {
    "countryCode": "DJ",
    "currency": "DJF",
    "language": "fr"
  },
  "Dominica": {
    "countryCode": "DM",
    "currency": "XCD",
    "language": "en"
  },
  "Dominican Republic": {
    "countryCode": "DO",
    "currency": "DOP",
    "language": "es"
  },
  "East Timor (Timor-Leste)": {
    "countryCode": "TL",
    "currency": "USD",
    "language": "pt"
  },
  "Ecuador": {
    "countryCode": "EC",
    "currency": "USD",
    "language": "es"
  },
  "Egypt": {
    "countryCode": "EG",
    "currency": "EGP",
    "language": "ar"
  },
  "El Salvador": {
    "countryCode": "SV",
    "currency": "USD",
    "language": "es"
  },
  "Equatorial Guinea": {
    "countryCode": "GQ",
    "currency": "XAF",
    "language": "es"
  },
  "Eritrea": {
    "countryCode": "ER",
    "currency": "ERN",
    "language": "ti"
  },
  "Estonia": {
    "countryCode": "EE",
    "currency": "EUR",
    "language": "et"
  },
  "Eswatini": {
    "countryCode": "SZ",
    "currency": "SZL",
    "language": "en"
  },
  "Ethiopia": {
    "countryCode": "ET",
    "currency": "ETB",
    "language": "am"
  },
  "Fiji": {
    "countryCode": "FJ",
    "currency": "FJD",
    "language": "en"
  },
  "Finland": {
    "countryCode": "FI",
    "currency": "EUR",
    "language": "fi"
  },
  "France": {
    "countryCode": "FR",
    "currency": "EUR",
    "language": "fr"
  },
  "Gabon": {
    "countryCode": "GA",
    "currency": "XAF",
    "language": "fr"
  },
  "Gambia": {
    "countryCode": "GM",
    "currency": "GMD",
    "language": "en"
  },
  "Georgia": {
    "countryCode": "GE",
    "currency": "GEL",
    "language": "ka"
  },
  "Germany": {
    "countryCode": "DE",
    "currency": "EUR",
    "language": "de"
  },
  "Ghana": {
    "countryCode": "GH",
    "currency": "GHS",
    "language": "en"
  },
  "Greece": {
    "countryCode": "GR",
    "currency": "EUR",
    "language": "el"
  },
  "Grenada": {
    "countryCode": "GD",
    "currency": "XCD",
    "language": "en"
  },
  "Guatemala": {
    "countryCode": "GT",
    "currency": "GTQ",
    "language": "es"
  },
  "Guinea": {
    "countryCode": "GN",
    "currency": "GNF",
    "language": "fr"
  },
  "Guinea-Bissau": {
    "countryCode": "GW",
    "currency": "XOF",
    "language": "pt"
  },
  "Guyana": {
    "countryCode": "GY",
    "currency": "GYD",
    "language": "en"
  },
  "Haiti": {
    "countryCode": "HT",
    "currency": "HTG",
    "language": "ht"
  },
  "Honduras": {
    "countryCode": "HN",
    "currency": "HNL",
    "language": "es"
  },
  "Hong Kong": {
    "countryCode": "HK",
    "currency": "HKD",
    "language": "zh"
  },
  "Hungary": {
    "countryCode": "HU",
    "currency": "HUF",
    "language": "hu"
  },
  "Iceland": {
    "countryCode": "IS",
    "currency": "ISK",
    "language": "is"
  },
  "India": {
    "countryCode": "IN",
    "currency": "INR",
    "language": "hi"
  },
  "Indonesia": {
    "countryCode": "ID",
    "currency": "IDR",
    "language": "id"
  },
  "Iran": {
    "countryCode": "IR",
    "currency": "IRR",
    "language": "fa"
  },
  "Iraq": {
    "countryCode": "IQ",
    "currency": "IQD",
    "language": "ar"
  },
  "Ireland": {
    "countryCode": "IE",
    "currency": "EUR",
    "language": "en"
  },
  "Israel": {
    "countryCode": "IL",
    "currency": "ILS",
    "language": "he"
  },
  "Italy": {
    "countryCode": "IT",
    "currency": "EUR",
    "language": "it"
  },
  "Ivory Coast (Côte d'Ivoire)": {
    "countryCode": "CI",
    "currency": "XOF",
    "language": "fr"
  },
  "Jamaica": {
    "countryCode": "JM",
    "currency": "JMD",
    "language": "en"
  },
  "Japan": {
    "countryCode": "JP",
    "currency": "JPY",
    "language": "ja"
  },
  "Jordan": {
    "countryCode": "JO",
    "currency": "JOD",
    "language": "ar"
  },
  "Kazakhstan": {
    "countryCode": "KZ",
    "currency": "KZT",
    "language": "ru"
  },
  "Kenya": {
    "countryCode": "KE",
    "currency": "KES",
    "language": "sw"
  },
  "Kiribati": {
    "countryCode": "KI",
    "currency": "AUD",
    "language": "en"
  },
  "Kosovo": {
    "countryCode": "XK",
    "currency": "EUR",
    "language": "sq"
  },
  "Kuwait": {
    "countryCode": "KW",
    "currency": "KWD",
    "language": "ar"
  },
  "Laos": {
    "countryCode": "LA",
    "currency": "LAK",
    "language": "lo"
  },
  "Latvia": {
    "countryCode": "LV",
    "currency": "EUR",
    "language": "lv"
  },
  "Lebanon": {
    "countryCode": "LB",
    "currency": "LBP",
    "language": "ar"
  },
  "Lesotho": {
    "countryCode": "LS",
    "currency": "ZAR",
    "language": "st"
  },
  "Liberia": {
    "countryCode": "LR",
    "currency": "LRD",
    "language": "en"
  },
  "Libya": {
    "countryCode": "LY",
    "currency": "LYD",
    "language": "ar"
  },
  "Liechtenstein": {
    "countryCode": "LI",
    "currency": "CHF",
    "language": "de"
  },
  "Lithuania": {
    "countryCode": "LT",
    "currency": "EUR",
    "language": "lt"
  },
  "Luxembourg": {
    "countryCode": "LU",
    "currency": "EUR",
    "language": "fr"
  },
  "Macau": {
    "countryCode": "MO",
    "currency": "MOP",
    "language": "zh"
  },
  "Madagascar": {
    "countryCode": "MG",
    "currency": "MGA",
    "language": "mg"
  },
  "Malawi": {
    "countryCode": "MW",
    "currency": "MWK",
    "language": "en"
  },
  "Malaysia": {
    "countryCode": "MY",
    "currency": "MYR",
    "language": "ms"
  },
  "Maldives": {
    "countryCode": "MV",
    "currency": "MVR",
    "language": "dv"
  },
  "Mali": {
    "countryCode": "ML",
    "currency": "XOF",
    "language": "fr"
  },
  "Malta": {
    "countryCode": "MT",
    "currency": "EUR",
    "language": "mt"
  },
  "Marshall Islands": {
    "countryCode": "MH",
    "currency": "USD",
    "language": "en"
  },
  "Mauritania": {
    "countryCode": "MR",
    "currency": "MRU",
    "language": "ar"
  },
  "Mauritius": {
    "countryCode": "MU",
    "currency": "MUR",
    "language": "fr"
  },
  "Mexico": {
    "countryCode": "MX",
    "currency": "MXN",
    "language": "es"
  },
  "Micronesia": {
    "countryCode": "FM",
    "currency": "USD",
    "language": "en"
  },
  "Moldova": {
    "countryCode": "MD",
    "currency": "MDL",
    "language": "ro"
  },
  "Monaco": {
    "countryCode": "MC",
    "currency": "EUR",
    "language": "fr"
  },
  "Mongolia": {
    "countryCode": "MN",
    "currency": "MNT",
    "language": "mn"
  },
  "Montenegro": {
    "countryCode": "ME",
    "currency": "EUR",
    "language": "sr"
  },
  "Morocco": {
    "countryCode": "MA",
    "currency": "MAD",
    "language": "ar"
  },
  "Mozambique": {
    "countryCode": "MZ",
    "currency": "MZN",
    "language": "pt"
  },
  "Myanmar (Burma)": {
    "countryCode": "MM",
    "currency": "MMK",
    "language": "my"
  },
  "Namibia": {
    "countryCode": "NA",
    "currency": "ZAR",
    "language": "en"
  },
  "Nauru": {
    "countryCode": "NR",
    "currency": "AUD",
    "language": "en"
  },
  "Nepal": {
    "countryCode": "NP",
    "currency": "NPR",
    "language": "ne"
  },
  "Netherlands": {
    "countryCode": "NL",
    "currency": "EUR",
    "language": "nl"
  },
  "New Zealand": {
    "countryCode": "NZ",
    "currency": "NZD",
    "language": "en"
  },
  "Nicaragua": {
    "countryCode": "NI",
    "currency": "NIO",
    "language": "es"
  },
  "Niger": {
    "countryCode": "NE",
    "currency": "XOF",
    "language": "fr"
  },
  "Nigeria": {
    "countryCode": "NG",
    "currency": "NGN",
    "language": "en"
  },
  "North Korea": {
    "countryCode": "KP",
    "currency": "KPW",
    "language": "ko"
  },
  "North Macedonia": {
    "countryCode": "MK",
    "currency": "MKD",
    "language": "mk"
  },
  "Norway": {
    "countryCode": "NO",
    "currency": "NOK",
    "language": "no"
  },
  "Oman": {
    "countryCode": "OM",
    "currency": "OMR",
    "language": "ar"
  },
  "Pakistan": {
    "countryCode": "PK",
    "currency": "PKR",
    "language": "ur"
  },
  "Palau": {
    "countryCode": "PW",
    "currency": "USD",
    "language": "pau"
  },
  "Palestine": {
    "countryCode": "PS",
    "currency": "ILS",
    "language": "ar"
  },
  "Panama": {
    "countryCode": "PA",
    "currency": "PAB",
    "language": "es"
  },
  "Papua New Guinea": {
    "countryCode": "PG",
    "currency": "PGK",
    "language": "tpi"
  },
  "Paraguay": {
    "countryCode": "PY",
    "currency": "PYG",
    "language": "gn"
  },
  "Peru": {
    "countryCode": "PE",
    "currency": "PEN",
    "language": "es"
  },
  "Philippines": {
    "countryCode": "PH",
    "currency": "PHP",
    "language": "tl"
  },
  "Poland": {
    "countryCode": "PL",
    "currency": "PLN",
    "language": "pl"
  },
  "Portugal": {
    "countryCode": "PT",
    "currency": "EUR",
    "language": "pt"
  },
  "Puerto Rico": {
    "countryCode": "PR",
    "currency": "USD",
    "language": "es"
  },
  "Qatar": {
    "countryCode": "QA",
    "currency": "QAR",
    "language": "ar"
  },
  "Romania": {
    "countryCode": "RO",
    "currency": "RON",
    "language": "ro"
  },
  "Russia": {
    "countryCode": "RU",
    "currency": "RUB",
    "language": "ru"
  },
  "Rwanda": {
    "countryCode": "RW",
    "currency": "RWF",
    "language": "rw"
  },
  "Saint Kitts and Nevis": {
    "countryCode": "KN",
    "currency": "XCD",
    "language": "en"
  },
  "Saint Lucia": {
    "countryCode": "LC",
    "currency": "XCD",
    "language": "en"
  },
  "Saint Vincent and the Grenadines": {
    "countryCode": "VC",
    "currency": "XCD",
    "language": "en"
  },
  "Samoa": {
    "countryCode": "WS",
    "currency": "WST",
    "language": "sm"
  },
  "San Marino": {
    "countryCode": "SM",
    "currency": "EUR",
    "language": "it"
  },
  "Sao Tome and Principe": {
    "countryCode": "ST",
    "currency": "STN",
    "language": "pt"
  },
  "Saudi Arabia": {
    "countryCode": "SA",
    "currency": "SAR",
    "language": "ar"
  },
  "Senegal": {
    "countryCode": "SN",
    "currency": "XOF",
    "language": "wo"
  },
  "Serbia": {
    "countryCode": "RS",
    "currency": "RSD",
    "language": "sr"
  },
  "Seychelles": {
    "countryCode": "SC",
    "currency": "SCR",
    "language": "fr"
  },
  "Sierra Leone": {
    "countryCode": "SL",
    "currency": "SLE",
    "language": "en"
  },
  "Singapore": {
    "countryCode": "SG",
    "currency": "SGD",
    "language": "en"
  },
  "Slovakia": {
    "countryCode": "SK",
    "currency": "EUR",
    "language": "sk"
  },
  "Slovenia": {
    "countryCode": "SI",
    "currency": "EUR",
    "language": "sl"
  },
  "Solomon Islands": {
    "countryCode": "SB",
    "currency": "SBD",
    "language": "en"
  },
  "Somalia": {
    "countryCode": "SO",
    "currency": "SOS",
    "language": "so"
  },
  "South Africa": {
    "countryCode": "ZA",
    "currency": "ZAR",
    "language": "en"
  },
  "South Korea": {
    "countryCode": "KR",
    "currency": "KRW",
    "language": "ko"
  },
  "South Sudan": {
    "countryCode": "SS",
    "currency": "SSP",
    "language": "en"
  },
  "Spain": {
    "countryCode": "ES",
    "currency": "EUR",
    "language": "es"
  },
  "Sri Lanka": {
    "countryCode": "LK",
    "currency": "LKR",
    "language": "si"
  },
  "Sudan": {
    "countryCode": "SD",
    "currency": "SDG",
    "language": "ar"
  },
  "Suriname": {
    "countryCode": "SR",
    "currency": "SRD",
    "language": "nl"
  },
  "Sweden": {
    "countryCode": "SE",
    "currency": "SEK",
    "language": "sv"
  },
  "Switzerland": {
    "countryCode": "CH",
    "currency": "CHF",
    "language": "de"
  },
  "Syria": {
    "countryCode": "SY",
    "currency": "SYP",
    "language": "ar"
  },
  "Taiwan": {
    "countryCode": "TW",
    "currency": "TWD",
    "language": "zh"
  },
  "Tajikistan": {
    "countryCode": "TJ",
    "currency": "TJS",
    "language": "tg"
  },
  "Tanzania": {
    "countryCode": "TZ",
    "currency": "TZS",
    "language": "sw"
  },
  "Thailand": {
    "countryCode": "TH",
    "currency": "THB",
    "language": "th"
  },
  "Togo": {
    "countryCode": "TG",
    "currency": "XOF",
    "language": "fr"
  },
  "Tonga": {
    "countryCode": "TO",
    "currency": "TOP",
    "language": "to"
  },
  "Trinidad and Tobago": {
    "countryCode": "TT",
    "currency": "TTD",
    "language": "en"
  },
  "Tunisia": {
    "countryCode": "TN",
    "currency": "TND",
    "language": "ar"
  },
  "Turkey": {
    "countryCode": "TR",
    "currency": "TRY",
    "language": "tr"
  },
  "Turkmenistan": {
    "countryCode": "TM",
    "currency": "TMT",
    "language": "tk"
  },
  "Tuvalu": {
    "countryCode": "TV",
    "currency": "AUD",
    "language": "tvl"
  },
  "Uganda": {
    "countryCode": "UG",
    "currency": "UGX",
    "language": "sw"
  },
  "Ukraine": {
    "countryCode": "UA",
    "currency": "UAH",
    "language": "uk"
  },
  "United Arab Emirates": {
    "countryCode": "AE",
    "currency": "AED",
    "language": "ar"
  },
  "United Kingdom": {
    "countryCode": "GB",
    "currency": "GBP",
    "language": "en"
  },
  "United States": {
    "countryCode": "US",
    "currency": "USD",
    "language": "en"
  },
  "Uruguay": {
    "countryCode": "UY",
    "currency": "UYU",
    "language": "es"
  },
  "Uzbekistan": {
    "countryCode": "UZ",
    "currency": "UZS",
    "language": "uz"
  },
  "Vanuatu": {
    "countryCode": "VU",
    "currency": "VUV",
    "language": "bi"
  },
  "Vatican City": {
    "countryCode": "VA",
    "currency": "EUR",
    "language": "it"
  },
  "Venezuela": {
    "countryCode": "VE",
    "currency": "VES",
    "language": "es"
  },
  "Vietnam": {
    "countryCode": "VN",
    "currency": "VND",
    "language": "vi"
  },
  "Yemen": {
    "countryCode": "YE",
    "currency": "YER",
    "language": "ar"
  },
  "Zambia": {
    "countryCode": "ZM",
    "currency": "ZMW",
    "language": "en"
  },
  "Zimbabwe": {
    "countryCode": "ZW",
    "currency": "USD",
    "language": "sn"
  }
};

// Common calling codes. Users in countries not listed are still supported;
// they simply must enter an E.164 number beginning with +countrycode.
const CALLING_CODES: Record<string, string> = {
  US:"1", CA:"1", GB:"44", AU:"61", NZ:"64", IN:"91", LK:"94", SG:"65", MY:"60", AE:"971", SA:"966",
  DE:"49", FR:"33", IT:"39", ES:"34", PT:"351", NL:"31", BE:"32", CH:"41", AT:"43", IE:"353", SE:"46", NO:"47", DK:"45", FI:"358",
  PL:"48", CZ:"420", HU:"36", RO:"40", BG:"359", GR:"30", RU:"7", UA:"380", TR:"90", IL:"972", JP:"81", CN:"86", HK:"852", MO:"853",
  KR:"82", TH:"66", VN:"84", PH:"63", ID:"62", PK:"92", BD:"880", NP:"977", ZA:"27", NG:"234", GH:"233", KE:"254", TZ:"255", BR:"55", MX:"52",
  AR:"54", CL:"56", CO:"57", PE:"51", UY:"598", PY:"595", BO:"591", EC:"593", CR:"506", PA:"507", DO:"1", JM:"1", TT:"1", BB:"1",
  IS:"354", EE:"372", LV:"371", LT:"370", SI:"386", SK:"421", HR:"385", RS:"381", BA:"387", ME:"382", MK:"389", AL:"355", MT:"356", CY:"357",
  EG:"20", MA:"212", DZ:"213", TN:"216", LY:"218", SD:"249", ET:"251", UG:"256", RW:"250", MU:"230", SC:"248", ZM:"260", ZW:"263",
};


export function countryFromRegion(region?: string | null): string | null {
  if (!region) return null;
  const upper = region.toUpperCase();
  for (const [country, meta] of Object.entries(COUNTRY_META)) {
    if (meta.countryCode === upper) return country;
  }
  return null;
}

export function getRegionalProfile(country?: string | null, overrides?: Partial<Pick<RegionalProfile,"currency"|"language">>): RegionalProfile {
  const base = (country && COUNTRY_META[country]) || { countryCode:"", currency:"USD", language:"en", locale:"en-US" };
  const currency = overrides?.currency || base.currency || "USD";
  const requestedLanguage = overrides?.language || base.language || "en";
  const supportedLanguages = new Set([
    "ar","bn","bg","ca","cs","da","de","el","en","es","et","fi","fr","he","hi","hu","id","is","it","ja","ka","kn","ko","ku","kk","km","lo","lt","lv","ms","ne","nl","no","pl","pt","ro","ru","si","sk","sl","sr","sv","sw","ta","te","th","tl","tr","uk","ur","vi","zh"
  ]);
  const language = supportedLanguages.has(requestedLanguage) ? requestedLanguage : "en";
  const locale = base.countryCode ? `${language}-${base.countryCode}` : "en-US";
  return { ...base, currency, language, locale };
}

export function getCallingCode(country?: string | null): string | null {
  const code = country && COUNTRY_META[country]?.countryCode;
  return code ? CALLING_CODES[code] || null : null;
}

export function normalizePhoneForCountry(raw: string, country?: string | null): string {
  let cleaned = (raw || "").trim().replace(/[^0-9+]/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  const calling = getCallingCode(country);
  if (!calling) return `+${cleaned}`;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  return `+${calling}${cleaned.replace(/^0+/, "")}`;
}

export function formatMoney(amount: number, currency: string, locale = "en-US"): string {
  try { return new Intl.NumberFormat(locale, { style:"currency", currency, maximumFractionDigits:2 }).format(Number(amount) || 0); }
  catch { return `${currency} ${Number(amount || 0).toFixed(2)}`; }
}

export function formatNumber(amount: number, locale = "en-US"): string {
  try { return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(Number(amount) || 0); }
  catch { return Number(amount || 0).toLocaleString(); }
}
