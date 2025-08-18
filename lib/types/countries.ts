export const countries = [
  // Most common African countries (French names)
  { code: "MA", name: "Maroc" },
  { code: "DZ", name: "Algérie" },
  { code: "TN", name: "Tunisie" },
  { code: "EG", name: "Égypte" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroun" },
  { code: "NG", name: "Nigéria" },
  { code: "ZA", name: "Afrique du Sud" },
  { code: "KE", name: "Kenya" },
  { code: "GH", name: "Ghana" },
  { code: "ML", name: "Mali" },
  
  // European countries
  { code: "FR", name: "France" },
  { code: "ES", name: "Espagne" },
  { code: "PT", name: "Portugal" },
  { code: "IT", name: "Italie" },
  { code: "DE", name: "Allemagne" },
  { code: "BE", name: "Belgique" },
  { code: "NL", name: "Pays-Bas" },
  { code: "GB", name: "Royaume-Uni" },
  { code: "CH", name: "Suisse" },
  
  // North America
  { code: "US", name: "États-Unis" },
  { code: "CA", name: "Canada" },
  
  // Other option
  { code: "OT", name: "Autre" }
];

// Helper function to get country name by code
export const getCountryName = (code: string) => {
  return countries.find(c => c.code === code)?.name || code;
};