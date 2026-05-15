export const PRACTICE = {
  name: 'Rodrigo Silva — CBT & CAT Psychotherapy',
  legalName: 'Rodrigo Silva Psychotherapy',
  url: 'https://jerseycbt.com',
  email: 'rod.gui.sil@gmail.com',
  telephone: '+44-1534-XXXXXX', // TODO_RODRIGO: confirm public phone
  address: {
    streetAddress: 'House 3, 8 Lewis St',
    addressLocality: 'St Helier',
    addressRegion: 'Jersey',
    postalCode: 'JE2 3PB',
    addressCountry: 'JE',
  },
  geo: {
    latitude: 49.1830,   // TODO_RODRIGO: confirm via Google Maps coordinates
    longitude: -2.1095,
  },
  openingHours: 'Mo-Fr 09:00-18:00', // TODO_RODRIGO: confirm
  languages: ['English', 'Portuguese'],
  founderCredentials: [
    'BABCP Accredited #101239',
    'ACAT Accredited',
    'MSc, PgDip CBT',
    '21+ years in NHS and private practice',
  ],
  insuranceAccepted: ['AXA', 'Aviva', 'Vitality', 'Aetna'], // TODO_RODRIGO: confirm/update
} as const;

export function buildJsonLd() {
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: PRACTICE.name,
    legalName: PRACTICE.legalName,
    url: PRACTICE.url,
    email: PRACTICE.email,
    telephone: PRACTICE.telephone,
    address: { '@type': 'PostalAddress', ...PRACTICE.address },
    geo: { '@type': 'GeoCoordinates', ...PRACTICE.geo },
    openingHours: PRACTICE.openingHours,
    knowsLanguage: PRACTICE.languages,
  };

  const medicalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: PRACTICE.name,
    url: PRACTICE.url,
    medicalSpecialty: 'Psychiatric',
    availableService: [
      { '@type': 'MedicalTherapy', name: 'Cognitive Behavioural Therapy (CBT)' },
      { '@type': 'MedicalTherapy', name: 'Cognitive Analytic Therapy (CAT)' },
    ],
  };

  return [localBusiness, medicalBusiness];
}
