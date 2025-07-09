import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Create a new i18n instance
const i18n = i18next.createInstance();

// Define translations inline to avoid import issues
// These would typically be imported from separate files
const enTranslation = {
  // Common
  common: {
    save: "Save",
    cancel: "Cancel",
    search: "Search...",
    delete: "Delete",
    edit: "Edit",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    loading: "Loading...",
    error: "An error occurred",
    success: "Success",
    logout: "Sign out",
    profile: "Profile",
    settings: "Settings",
    filter: "Filter",
    clear: "Clear",
    apply: "Apply",
    pagination: {
      previous: "Previous",
      next: "Next",
      first: "First",
      last: "Last",
      showing: "Showing {{from}} to {{to}} of {{total}}"
    },
    language: "Language",
    english: "English",
    french: "French"
  },
  nav: {
    dashboard: "Dashboard",
    users: "Users",
    clubs: "Clubs",
    teams: "Teams",
    players: "Players",
    staff: "Staff",
    rentals: "Rentals",
    suppliers: "Suppliers",
    financial: "Financial",
    contracts: "Contracts",
    objectives: "Objectives",
    matches: "Matches",
    settings: "Settings"
  },
  associationSettings: {
    title: "Association Settings",
    generalSettings: "General Settings",
    branding: "Branding",
    activityLogs: "Activity Logs",
    name: "Association Name",
    description: "Description",
    contactEmail: "Contact Email",
    contactPhone: "Contact Phone",
    address: "Address",
    logoUpload: "Upload Logo",
    logoRemove: "Remove Logo",
    primaryColor: "Primary Color",
    secondaryColor: "Secondary Color",
    tagline: "Tagline",
    saveSettings: "Save Settings",
    settingsSaved: "Settings saved successfully",
    logoUploaded: "Logo uploaded successfully"
  }
};

const frTranslation = {
  // Common
  common: {
    save: "Enregistrer",
    cancel: "Annuler",
    search: "Rechercher...",
    delete: "Supprimer",
    edit: "Modifier",
    darkMode: "Mode Sombre",
    lightMode: "Mode Clair",
    loading: "Chargement...",
    error: "Une erreur s'est produite",
    success: "Succès",
    logout: "Se déconnecter",
    profile: "Profil",
    settings: "Paramètres",
    filter: "Filtrer",
    clear: "Effacer",
    apply: "Appliquer",
    pagination: {
      previous: "Précédent",
      next: "Suivant",
      first: "Premier",
      last: "Dernier",
      showing: "Affichage de {{from}} à {{to}} sur {{total}}"
    },
    language: "Langue",
    english: "Anglais",
    french: "Français"
  },
  nav: {
    dashboard: "Tableau de bord",
    users: "Utilisateurs",
    clubs: "Clubs",
    teams: "Équipes",
    players: "Joueurs",
    staff: "Personnel",
    rentals: "Locations",
    suppliers: "Fournisseurs",
    financial: "Finances",
    contracts: "Contrats",
    objectives: "Objectifs",
    matches: "Matchs",
    settings: "Paramètres"
  },
  associationSettings: {
    title: "Paramètres de l'Association",
    generalSettings: "Paramètres généraux",
    branding: "Image de marque",
    activityLogs: "Journaux d'activité",
    name: "Nom de l'association",
    description: "Description",
    contactEmail: "Email de contact",
    contactPhone: "Téléphone de contact",
    address: "Adresse",
    logoUpload: "Télécharger un logo",
    logoRemove: "Supprimer le logo",
    primaryColor: "Couleur principale",
    secondaryColor: "Couleur secondaire",
    tagline: "Slogan",
    saveSettings: "Enregistrer les paramètres",
    settingsSaved: "Paramètres enregistrés avec succès",
    logoUploaded: "Logo téléchargé avec succès"
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      fr: {
        translation: frTranslation
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    }
  })
  .then(() => {
    console.log('i18n initialized successfully');
    console.log('i18n.changeLanguage available:', typeof i18n.changeLanguage === 'function');
  })
  .catch(err => {
    console.error('i18n initialization failed:', err);
  });

// Add debugging to check i18n state
console.log('i18n instance created:', !!i18n);
console.log('i18n methods available:', Object.keys(i18n));

export default i18n;
