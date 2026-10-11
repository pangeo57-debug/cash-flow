// Guess an expense category from a merchant name. Learned rules (from the user's own
// corrections) win over the built-in keywords. Matching is accent- and case-insensitive
// and works on word prefixes, so "ΕΚΟ ΚΑΛΑΜΑΤΑ" matches "ΕΚΟ".
export const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-ZΑ-Ω0-9& ]+/g, ' ').replace(/\s+/g, ' ').trim()

const RULES: [string, string[]][] = [
  ['Αυτοκίνητο', ['ΡΟΥΛΕΜΑΝ', 'ΣΥΝΕΡΓΕΙΟ', 'ΛΑΣΤΙΧ', 'ΦΡΕΝΑ', 'ΛΑΔΙΑ', 'ΚΤΕΟ', 'SERVICE', 'ΜΠΑΤΑΡΙΑ', 'ΑΝΤΑΛΛΑΚΤΙΚ', 'ΕΛΑΙΟ', 'ΕΞΑΤΜΙΣΗ', 'ΣΥΜΠΛΕΚΤΗ', 'ΓΚΑΡΑΖ', 'ΑΜΟΡΤΙΣΕΡ', 'ΑΥΤΟΚΙΝΗΤ', 'ΤΕΛΗ ΚΥΚΛΟΦΟΡΙΑΣ', 'MECHANIC', 'GARAGE', 'TYRE', 'TIRE', 'BRAKE', 'OIL CHANGE', 'WERKSTATT', 'REIFEN', 'BREMSE', 'PNEU', 'FREIN', 'VIDANGE', 'MECCANICO', 'GOMME', 'FRENI', 'OFFICINA', 'REVISIONE']],
  ['Τα απαραίτητα', ['ΕΝΟΙΚΙΟ', 'ΛΟΓΑΡΙΑΣΜ', 'ΕΥΔΑΠ', 'ΤΗΛΕΦΩΝΟ', 'RENT', 'MIETE', 'LOYER', 'AFFITTO', 'ΚΟΙΝΟΧΡΗΣΤΑ']],
  ['Βενζίνη', ['EKO', 'ΕΚΟ', 'SHELL', 'BP', 'AVIN', 'ΑΒΙΝ', 'CORAL', 'CYCLON', 'REVOIL', 'ELIN', 'ΕΛΙΝ', 'JETOIL', 'JET OIL', 'ΚΑΥΣΙΜ', 'ΒΕΝΖΙΝ', 'ΠΡΑΤΗΡΙΟ', 'FUEL', 'PETROL', 'BENZIN', 'TANKEN', 'CARBURANT', 'BENZINA', 'ΒΕΝΖΙΝΑ']],
  ['Διόδια', ['ΕΓΝΑΤΙΑ', 'ΟΛΥΜΠΙΑ ΟΔΟΣ', 'ΑΤΤΙΚΗ ΟΔΟΣ', 'ΜΟΡΕΑΣ', 'ΔΙΟΔΙ', 'ΝΕΑ ΟΔΟΣ', 'ΓΕΦΥΡΑ', 'GEFYRA', 'ΑΥΤΟΚΙΝΗΤΟΔΡΟΜ', 'ΚΕΝΤΡΙΚΗ ΟΔΟΣ', 'ΑΠΟΛΛΩΝ']],
  ['Σούπερ Μάρκετ', ['ΒΑΣΙΛΟΠΟΥΛΟΣ', 'ΣΚΛΑΒΕΝΙΤΗΣ', 'ΜΑΣΟΥΤΗΣ', 'LIDL', 'MY MARKET', 'ΜΥ MARKET', 'ΓΑΛΑΞΙΑΣ', 'ΘΑΝΟΠΟΥΛΟΣ', 'ΣΟΥΠΕΡ ΜΑΡΚΕΤ', 'SUPER MARKET', 'SUPERMARKET', 'ΚΡΗΤΙΚΟΣ', 'ΜΑΡΚΕΤ', 'MARKET', 'ΧΑΛΚΙΑΔΑΚΗΣ', 'ΑΒ ', 'ΨΩΝΙΑ', 'ΣΟΥΠΕΡ', 'GROCERIES', 'LEBENSMITTEL', 'COURSES']],
  ['Καφές', ['COFFEE', 'ΚΑΦΕ', 'ΚΑΦΕΤΕΡΙ', 'ΚΑΦΕΝΕΙ', 'STARBUCKS', 'FLOCAFE', 'ESPRESSO', 'GREGORYS', 'CAFE', 'KAFFEE', 'CAFFE']],
  ['Φαγητό', ['EFOOD', 'WOLT', 'MCDONALD', 'GOODY', 'PIZZA', 'ΠΙΤΣΑ', 'GYROS', 'ΓΥΡΟ', 'ΨΗΤΟΠΩΛ', 'ΤΑΒΕΡΝ', 'RESTAURANT', 'ΕΣΤΙΑΤΟΡ', 'ΟΥΖΕΡΙ', 'ΣΟΥΒΛΑΚ', 'BURGER', 'ΜΠΟΥΡΓΚΕΡ', 'KFC', 'DOMINO', 'ΦΟΥΡΝ', 'ΑΡΤΟΠΟΙΕΙ', 'EVEREST', 'BOX', 'LUNCH', 'DINNER', 'BREAKFAST', 'ΜΕΣΗΜΕΡΙΑΝΟ', 'ΒΡΑΔΙΝΟ', 'ΠΡΩΙΝΟ', 'ΦΑΓΗΤΟ', 'ΦΑΓΗΤΑ', 'MITTAGESSEN', 'ABENDESSEN', 'DEJEUNER', 'DINER', 'PRANZO', 'CENA', 'REPAS']],
  ['Υγεία', ['ΦΑΡΜΑΚΕΙ', 'PHARMACY', 'ΙΑΤΡ', 'ΟΦΘΑΛΜ', 'ΔΙΑΓΝΩΣΤΙΚ', 'ΝΟΣΟΚΟΜ', 'ΦΑΡΜΑΚ', 'APOTHEKE', 'PHARMACIE', 'FARMACIA', 'MEDICINE', 'ΓΙΑΤΡΟΣ']],
  ['Ρεύμα', ['ΔΕΗ', 'PPC', 'ΗΡΩΝ', 'ΜΥΤΙΛΗΝΑΙΟΣ', 'METLEN', 'NRG', 'ΗΛΕΚΤΡ']],
  ['Μετακινήσεις', ['ΟΑΣΑ', 'OASA', 'TAXI', 'ΤΑΞΙ', 'BEAT', 'UBER', 'ΚΤΕΛ', 'ΤΡΑΙΝΟ', 'HELLENIC TRAIN', 'ΜΕΤΡΟ', 'ΛΕΩΦΟΡ', 'PARKING', 'ΠΑΡΚΙΝΓΚ', 'ΣΤΑΘΜΕΥΣ', 'ΣΤΑΣΗ']],
  ['Ταξίδια', ['AEGEAN', 'RYANAIR', 'BOOKING', 'AIRBNB', 'SKY EXPRESS', 'TRIVAGO', 'EXPEDIA', 'ΞΕΝΟΔΟΧ', 'HOTEL', 'FERRY', 'BLUE STAR', 'ΑΝΕΚ', 'MINOAN', 'SEAJETS', 'SEAWAYS']],
  ['Διασκέδαση', ['CINEMA', 'ΣΙΝΕΜΑ', 'ΟΠΑΠ', 'OPAP', 'STOIXIMAN', 'NETFLIX', 'SPOTIFY', 'STEAM', 'PLAYSTATION', 'ΘΕΑΤΡΟ', 'DISNEY']],
  ['Αγορές', ['AMAZON', 'ALIEXPRESS', 'IKEA', 'PUBLIC', 'PLAISIO', 'ΠΛΑΙΣΙΟ', 'ZARA', 'H&M', 'SKROUTZ', 'TEMU', 'ΚΩΤΣΟΒΟΛΟΣ']],
]

export function guessCategory(merchant: string, learned: Record<string, string> = {}): string {
  const m = norm(merchant)
  if (learned[m]) return learned[m]
  const padded = ` ${m} `
  for (const [cat, words] of RULES) if (words.some((w) => padded.includes(` ${w}`) || (w.endsWith(' ') && padded.includes(` ${w}`)))) return cat
  return 'Κουλουλού'
}
