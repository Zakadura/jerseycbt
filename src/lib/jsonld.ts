export const PRACTICE = {
  name: 'Rodrigo Silva — CBT & CAT Psychotherapy',
  legalName: 'Rodrigo Silva Psychotherapy',
  url: 'https://jerseycbt.com',
  email: 'hello@jerseycbt.com',
  telephone: '+44-7458-153479',
  address: {
    streetAddress: 'House 3, 8 Lewis St',
    addressLocality: 'St Helier',
    addressRegion: 'Jersey',
    postalCode: 'JE2 3PB',
    addressCountry: 'JE',
  },
  geo: {
    latitude: 49.1888196,
    longitude: -2.1129293,
  },
  openingHours: 'Mo-Fr 10:00-18:00',
  languages: ['English', 'Portuguese'],
  founderCredentials: [
    'BABCP Accredited #101239',
    'ACAT Accredited',
    'MSc, PgDip CBT',
    '21+ years in NHS and private practice',
  ],
  insuranceAccepted: ['AXA', 'Aviva', 'Vitality', 'Aetna'],
  priceRange: '££',
  sessionPrice: 100,
  currency: 'GBP',
} as const;

/** Rodrigo as a named professional entity — carries the E-E-A-T signals. */
export const PERSON = {
  name: 'Rodrigo Silva',
  jobTitle: 'Cognitive Behavioural & Cognitive Analytic Psychotherapist',
  honorificSuffix: 'MSc, MBABCP',
  image: 'https://jerseycbt.com/images/profile.jpg',
  sameAs: [
    'https://www.psychologytoday.com/gb/counselling/rodrigo-silva-saint-helier/1009468',
    'https://thinkcbt.com/team/rodrigo-silva',
  ],
  credentials: [
    {
      name: 'BABCP Accredited Cognitive Behavioural Psychotherapist (#101239)',
      organisation: 'British Association for Behavioural & Cognitive Psychotherapies',
      organisationUrl: 'https://www.babcp.com/',
    },
    {
      name: 'ACAT Accredited Cognitive Analytic Therapy Practitioner (#15172)',
      organisation: 'Association for Cognitive Analytic Therapy',
      organisationUrl: 'https://www.acat.org.uk/',
    },
    {
      name: 'Clinical Psychologist, Ordem dos Psicólogos Portugueses (Reg. 26160)',
      organisation: 'Ordem dos Psicólogos Portugueses',
      organisationUrl: 'https://www.ordemdospsicologos.pt/',
    },
  ],
} as const;

// Stable @id anchors so the entities reference one another rather than
// floating as unconnected blocks.
const PRACTICE_ID = `${PRACTICE.url}/#practice`;
const PERSON_ID = `${PRACTICE.url}/#rodrigo`;
const WEBSITE_ID = `${PRACTICE.url}/#website`;

export function buildPersonJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: PERSON.name,
    jobTitle: PERSON.jobTitle,
    honorificSuffix: PERSON.honorificSuffix,
    image: PERSON.image,
    url: PRACTICE.url,
    email: PRACTICE.email,
    telephone: PRACTICE.telephone,
    knowsLanguage: PRACTICE.languages,
    sameAs: PERSON.sameAs,
    worksFor: { '@id': PRACTICE_ID },
    address: { '@type': 'PostalAddress', ...PRACTICE.address },
    hasCredential: PERSON.credentials.map((c) => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Professional accreditation',
      name: c.name,
      recognizedBy: {
        '@type': 'Organization',
        name: c.organisation,
        url: c.organisationUrl,
      },
    })),
    memberOf: PERSON.credentials.map((c) => ({
      '@type': 'Organization',
      name: c.organisation,
      url: c.organisationUrl,
    })),
  };
}

export function buildJsonLd() {
  const localBusiness = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': PRACTICE_ID,
    name: PRACTICE.name,
    legalName: PRACTICE.legalName,
    url: PRACTICE.url,
    email: PRACTICE.email,
    telephone: PRACTICE.telephone,
    image: PERSON.image,
    priceRange: PRACTICE.priceRange,
    address: { '@type': 'PostalAddress', ...PRACTICE.address },
    geo: { '@type': 'GeoCoordinates', ...PRACTICE.geo },
    openingHours: PRACTICE.openingHours,
    knowsLanguage: PRACTICE.languages,
    sameAs: PERSON.sameAs,
    founder: { '@id': PERSON_ID },
    employee: { '@id': PERSON_ID },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Jersey' },
      { '@type': 'AdministrativeArea', name: 'United Kingdom' },
    ],
  };

  // MedicalClinic (a subtype of both MedicalBusiness and MedicalOrganization) is the
  // correct type here: it defines `medicalSpecialty` and `availableService`, which the
  // parent MedicalBusiness type does not.
  const medicalBusiness = {
    '@context': 'https://schema.org',
    '@type': 'MedicalClinic',
    name: PRACTICE.name,
    url: PRACTICE.url,
    medicalSpecialty: 'Psychiatric',
    availableService: [
      { '@type': 'MedicalTherapy', name: 'Cognitive Behavioural Therapy (CBT)' },
      { '@type': 'MedicalTherapy', name: 'Cognitive Analytic Therapy (CAT)' },
    ],
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: PRACTICE.url,
    name: PRACTICE.name,
    inLanguage: 'en-GB',
    publisher: { '@id': PRACTICE_ID },
  };

  return [localBusiness, medicalBusiness, buildPersonJsonLd(), website];
}

/** Article schema — attributes the writing to Rodrigo, not to an anonymous page. */
export function buildArticleJsonLd(opts: {
  title: string;
  description: string;
  date: Date;
  url: string;
  image?: string;
}) {
  const published = opts.date instanceof Date ? opts.date.toISOString() : String(opts.date);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${opts.url}#article`,
    headline: opts.title,
    description: opts.description,
    datePublished: published,
    dateModified: published,
    inLanguage: 'en-GB',
    mainEntityOfPage: { '@type': 'WebPage', '@id': opts.url },
    url: opts.url,
    ...(opts.image ? { image: new URL(opts.image, PRACTICE.url).toString() } : {}),
    author: { '@id': PERSON_ID },
    publisher: { '@id': PRACTICE_ID },
    isPartOf: { '@id': WEBSITE_ID },
  };
}

/** Condition pages — medical context, reviewed by a named clinician. */
export function buildConditionJsonLd(opts: {
  condition: string;
  description: string;
  url: string;
  symptoms?: readonly string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    '@id': `${opts.url}#medicalwebpage`,
    name: opts.condition,
    description: opts.description,
    url: opts.url,
    inLanguage: 'en-GB',
    isPartOf: { '@id': WEBSITE_ID },
    reviewedBy: { '@id': PERSON_ID },
    about: {
      '@type': 'MedicalCondition',
      name: opts.condition,
      ...(opts.symptoms?.length
        ? {
            signOrSymptom: opts.symptoms.map((s) => ({
              '@type': 'MedicalSignOrSymptom',
              name: s,
            })),
          }
        : {}),
      possibleTreatment: [
        { '@type': 'MedicalTherapy', name: 'Cognitive Behavioural Therapy (CBT)' },
        { '@type': 'MedicalTherapy', name: 'Cognitive Analytic Therapy (CAT)' },
      ],
    },
  };
}

/** Fees page — makes the rate machine-readable. */
export function buildOfferJsonLd(url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name: 'Psychotherapy session (CBT or CAT)',
    serviceType: 'Psychotherapy',
    url,
    provider: { '@id': PRACTICE_ID },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Jersey' },
      { '@type': 'AdministrativeArea', name: 'United Kingdom' },
    ],
    availableChannel: [
      { '@type': 'ServiceChannel', name: 'In person — St Helier, Jersey' },
      { '@type': 'ServiceChannel', name: 'Online video' },
    ],
    offers: {
      '@type': 'Offer',
      price: PRACTICE.sessionPrice,
      priceCurrency: PRACTICE.currency,
      description: '50-minute session, in person in St Helier or online',
      availability: 'https://schema.org/InStock',
      url,
    },
  };
}
