import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const nationalAuthorities = [
  { countryCode: "AT", countryName: "Austria", authorityName: "Österreichische Datenschutzbehörde (DSB)", contactEmail: "dsb@dsb.gv.at", submissionUrl: "https://www.dsb.gv.at" },
  { countryCode: "BE", countryName: "Belgium", authorityName: "Autorité de protection des données (APD)", contactEmail: "contact@apd-gba.be", submissionUrl: "https://www.dataprotectionauthority.be" },
  { countryCode: "BG", countryName: "Bulgaria", authorityName: "Commission for Personal Data Protection (CPDP)", contactEmail: "kzld@cpdp.bg", submissionUrl: "https://www.cpdp.bg" },
  { countryCode: "HR", countryName: "Croatia", authorityName: "Agencija za zaštitu osobnih podataka (AZOP)", contactEmail: "azop@azop.hr", submissionUrl: "https://azop.hr" },
  { countryCode: "CY", countryName: "Cyprus", authorityName: "Commissioner for Personal Data Protection", contactEmail: "commissioner@dataprotection.gov.cy", submissionUrl: "http://www.dataprotection.gov.cy" },
  { countryCode: "CZ", countryName: "Czech Republic", authorityName: "Úřad pro ochranu osobních údajů (ÚOOÚ)", contactEmail: "posta@uoou.cz", submissionUrl: "https://www.uoou.cz" },
  { countryCode: "DK", countryName: "Denmark", authorityName: "Datatilsynet", contactEmail: "dt@datatilsynet.dk", submissionUrl: "https://www.datatilsynet.dk" },
  { countryCode: "EE", countryName: "Estonia", authorityName: "Andmekaitse Inspektsioon (AKI)", contactEmail: "info@aki.ee", submissionUrl: "https://www.aki.ee" },
  { countryCode: "FI", countryName: "Finland", authorityName: "Office of the Data Protection Ombudsman (Tietosuojavaltuutetun toimisto)", contactEmail: "tietosuoja@om.fi", submissionUrl: "https://tietosuoja.fi" },
  { countryCode: "FR", countryName: "France", authorityName: "Commission Nationale de l'Informatique et des Libertés (CNIL)", contactEmail: null, submissionUrl: "https://www.cnil.fr", notes: "Also ARCEP for telecom AI systems" },
  { countryCode: "DE", countryName: "Germany", authorityName: "Bundesbeauftragte für den Datenschutz und die Informationsfreiheit (BfDI)", contactEmail: "poststelle@bfdi.bund.de", submissionUrl: "https://www.bfdi.bund.de", notes: "BfDI for federal; state-level DPAs also exist. BNetzA for telecom sector." },
  { countryCode: "GR", countryName: "Greece", authorityName: "Hellenic Data Protection Authority (HDPA)", contactEmail: "contact@dpa.gr", submissionUrl: "https://www.dpa.gr" },
  { countryCode: "HU", countryName: "Hungary", authorityName: "Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)", contactEmail: "ugyfelszolgalat@naih.hu", submissionUrl: "https://www.naih.hu" },
  { countryCode: "IE", countryName: "Ireland", authorityName: "Data Protection Commission (DPC)", contactEmail: "info@dataprotection.ie", submissionUrl: "https://www.dataprotection.ie" },
  { countryCode: "IT", countryName: "Italy", authorityName: "Garante per la protezione dei dati personali", contactEmail: "garante@gpdp.it", submissionUrl: "https://www.garanteprivacy.it", notes: "Also AGCOM for communications/media AI systems" },
  { countryCode: "LV", countryName: "Latvia", authorityName: "Datu valsts inspekcija (DVI)", contactEmail: "info@dvi.gov.lv", submissionUrl: "https://www.dvi.gov.lv" },
  { countryCode: "LT", countryName: "Lithuania", authorityName: "Valstybinė duomenų apsaugos inspekcija (VDAI)", contactEmail: "ada@ada.lt", submissionUrl: "https://vdai.lrv.lt" },
  { countryCode: "LU", countryName: "Luxembourg", authorityName: "Commission Nationale pour la Protection des Données (CNPD)", contactEmail: "info@cnpd.lu", submissionUrl: "https://cnpd.public.lu" },
  { countryCode: "MT", countryName: "Malta", authorityName: "Office of the Information and Data Protection Commissioner (IDPC)", contactEmail: "idpc.info@idpc.org.mt", submissionUrl: "https://idpc.org.mt" },
  { countryCode: "NL", countryName: "Netherlands", authorityName: "Autoriteit Persoonsgegevens (AP)", contactEmail: null, submissionUrl: "https://autoriteitpersoonsgegevens.nl" },
  { countryCode: "PL", countryName: "Poland", authorityName: "Urząd Ochrony Danych Osobowych (UODO)", contactEmail: "kancelaria@uodo.gov.pl", submissionUrl: "https://uodo.gov.pl" },
  { countryCode: "PT", countryName: "Portugal", authorityName: "Comissão Nacional de Protecção de Dados (CNPD)", contactEmail: "geral@cnpd.pt", submissionUrl: "https://www.cnpd.pt" },
  { countryCode: "RO", countryName: "Romania", authorityName: "Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP)", contactEmail: "anspdcp@dataprotection.ro", submissionUrl: "https://www.dataprotection.ro" },
  { countryCode: "SK", countryName: "Slovakia", authorityName: "Úrad na ochranu osobných údajov (ÚOOÚ SR)", contactEmail: "statny.dozor@pdp.gov.sk", submissionUrl: "https://dataprotection.gov.sk" },
  { countryCode: "SI", countryName: "Slovenia", authorityName: "Informacijski pooblaščenec (IP)", contactEmail: "gp.ip@ip-rs.si", submissionUrl: "https://www.ip-rs.si" },
  { countryCode: "ES", countryName: "Spain", authorityName: "Agencia Española de Protección de Datos (AEPD)", contactEmail: null, submissionUrl: "https://www.aepd.es" },
  { countryCode: "SE", countryName: "Sweden", authorityName: "Integritetsskyddsmyndigheten (IMY)", contactEmail: "imy@imy.se", submissionUrl: "https://www.imy.se" },
];

async function main() {
  console.log("Seeding national authorities...");

  for (const authority of nationalAuthorities) {
    await prisma.nationalAuthority.upsert({
      where: {
        id: `seed-${authority.countryCode}`,
      },
      update: authority,
      create: {
        id: `seed-${authority.countryCode}`,
        ...authority,
      },
    });
  }

  console.log(`Seeded ${nationalAuthorities.length} national authorities.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
