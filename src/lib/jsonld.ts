export const PRACTICE = {
  name: 'Rodrigo Silva — CBT & CAT Psychotherapy',
  legalName: 'Rodrigo Silva',
  url: 'https://jerseycbt.com',
  email: 'hello@jerseycbt.com',
  // Live number — matches BABCP register, Psychology Today, and cbttherapist.com
  // (all three switched to/confirmed as 07829 999963 on 2026-08-22).
  telephone: '+44-7829-999963',
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
  openingHours: 'Mo-Fr 10:00-19:00',
  languages: ['English', 'Portuguese'],
  founderCredentials: [
    'BABCP Accredited #101239',
    'ACAT Accredited',
    'Licenciatura in Clinical Psychology; PgDip CBT',
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
  honorificSuffix: 'MBABCP',
  // Stable URL served from public/ — JSON-LD/og references need a permanent
  // address, while <img> elements on pages use astro:assets srcset variants.
  // Do not remove the file from public/images/.
  image: 'https://jerseycbt.com/images/profile.jpg',
  sameAs: [
    // BABCP Find a Therapist profile — server-rendered public page with a
    // dofollow link back to jerseycbt.com; strongest register corroboration.
    'https://portal.babcp.com/therapist/view/3710065',
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
      name: 'ACAT Accredited Cognitive Analytic Therapy Practitioner (M146123)',
      organisation: 'Association for Cognitive Analytic Therapy',
      organisationUrl: 'https://www.acat.org.uk/',
    },
    {
      name: 'Clinical Psychologist, Ordem dos Psicólogos Portugueses (Reg. 20307)',
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
  // LocalBusiness and MedicalClinic stacked on ONE @id'd node. MedicalClinic (a
  // MedicalBusiness subtype) supplies `medicalSpecialty` and `availableService`,
  // which LocalBusiness lacks; sharing the @id means search engines see a single
  // connected entity carrying the address, geo, and founder — not two orphan blocks.
  const practice = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'MedicalClinic'],
    '@id': PRACTICE_ID,
    name: PRACTICE.name,
    legalName: PRACTICE.legalName,
    url: PRACTICE.url,
    email: PRACTICE.email,
    telephone: PRACTICE.telephone,
    image: PERSON.image,
    priceRange: PRACTICE.priceRange,
    medicalSpecialty: 'Psychiatric',
    availableService: [
      { '@type': 'MedicalTherapy', name: 'Cognitive Behavioural Therapy (CBT)' },
      { '@type': 'MedicalTherapy', name: 'Cognitive Analytic Therapy (CAT)' },
    ],
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

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: PRACTICE.url,
    name: PRACTICE.name,
    inLanguage: 'en-GB',
    publisher: { '@id': PRACTICE_ID },
  };

  return [practice, buildPersonJsonLd(), website];
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

/**
 * Extract the Q&A pairs from a condition page's `## Common questions` markdown
 * section. Questions there are written as `**Question?** Answer…` paragraphs.
 * Returns [] when the section is missing or malformed.
 */
export function parseCommonQuestions(body: string): Array<{ q: string; a: string }> {
  const afterHeading = body.split(/^## Common questions\s*$/m)[1];
  if (!afterHeading) return [];
  const nextHeading = afterHeading.search(/^## /m);
  const section = nextHeading >= 0 ? afterHeading.slice(0, nextHeading) : afterHeading;

  const qas: Array<{ q: string; a: string }> = [];
  for (const para of section.split(/\n\s*\n/)) {
    const m = para.trim().match(/^\*\*(.+?)\*\*\s*([\s\S]+)$/);
    if (m) qas.push({ q: m[1].trim(), a: m[2].trim().replace(/\s*\n\s*/g, ' ') });
  }
  return qas;
}

/** FAQPage schema built from those same on-page questions — machine-readable mirror of visible content. */
export function buildFaqJsonLd(url: string, qas: Array<{ q: string; a: string }>) {
  if (!qas.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: qas.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
