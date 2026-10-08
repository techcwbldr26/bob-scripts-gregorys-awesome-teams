# Public source and evidence platform

Retrieved 2026-10-07 with Firecrawl. Each row is an official entry point, not a full copy of every dataset behind it. Page text is saved under `references/sources/`. Search hits are in `references/source-search.json` and `references/source-search-retry.json`.

Firecrawl reported **52 credits** for the searches. Scrape responses did not include a credit count. At the published rate of 1 credit per page, the 26 saved pages are about 26 more credits.

## Rules and referral sources

| Source | Official page | Saved as | What it is |
| --- | --- | --- | --- |
| USA.gov | https://www.usa.gov/benefits | `sources/usa-benefits.md` | Federal benefits finder: food, health, housing, utilities |
| USDA SNAP | https://www.fna.usda.gov/snap/supplemental-nutrition-assistance-program | `sources/usda-snap.md` | SNAP program page. Live host on this date is `fna.usda.gov` |
| Medicaid.gov | https://www.medicaid.gov/ | `sources/medicaid.md` | Federal Medicaid and CHIP site |
| HealthCare.gov | https://www.healthcare.gov/ | `sources/healthcare.md` | Health Insurance Marketplace |
| State Medicaid sites and plans | https://www.medicaid.gov/state-overviews/state-profiles | `sources/medicaid-state-profiles.md` | Map and dropdown for each state's Medicaid and CHIP profile |
| HHS / ACF | https://acf.gov/ | `sources/acf.md` | Administration for Children and Families |
| State manuals | https://www.emedny.org/providermanuals/ | `sources/ny-medicaid-manuals.md` | Example only: New York Medicaid provider manuals. Search also found Michigan, Texas, and Utah manuals. Each state publishes its own |
| HUD / PHA | https://www.hud.gov/helping-americans/public-housing | `sources/hud-public-housing.md` | Public Housing program rules |
| HUD PHA contacts | https://www.hud.gov/contactus/public-housing-contacts | `sources/hud-pha-contacts.md` | PHA contact information. PHAs maintain their own records |
| 211 directories | https://www.211.org/ | `sources/united-way-211.md` | National 211 site, including "Find your local 211" |
| State codes and legislatures | https://www.ncsl.org/ | `sources/ncsl.md` | National Conference of State Legislatures. Statute text lives on each legislature's own site |

## Aggregate statistical sources

| Source | Official page | Saved as | What it is |
| --- | --- | --- | --- |
| ACS | https://www.census.gov/programs-surveys/acs.html | `sources/acs.md` | Census Bureau American Community Survey. Data access is linked from this page, including data.census.gov |
| USDA participation | https://www.fna.usda.gov/pd/supplemental-nutrition-assistance-program-snap | `sources/snap-participation.md` | SNAP persons, households, and benefits. Latest month named on the page: June 2026. PDF and Excel |
| CMS enrollment | https://www.medicaid.gov/medicaid/national-medicaid-chip-program-information/medicaid-chip-enrollment-data | `sources/cms-enrollment.md` | Medicaid and CHIP enrollment reports, including monthly reports and MBES |
| HUD PIT | https://www.hudexchange.info/programs/hdx/pit-hic/ | `sources/hud-pit.md` | Point-in-Time count and Housing Inventory Count, submitted through HDX |
| Picture of Subsidized Households | https://www.huduser.gov/portal/datasets/assthsg.html | `sources/hud-subsidized-households.md` | HUD-assisted housing dataset |
| LIHEAP | https://acf.gov/ocs/programs/liheap | `sources/liheap.md` | Low Income Home Energy Assistance Program. Apply through Energyhelp.us, not this page |
| State open data | https://data.gov/ | `sources/data-gov.md` | Federal open-data catalog. The page said 590,064 datasets on this date. Catalog search is https://catalog.data.gov/ |
| 211 aggregates | https://www.unitedway.org/the-facts-about-211-2025-impact-snapshot | `sources/211-impact-2025.md` | Public 2025 impact snapshot: 19 million referrals. A reusable open-data file was not found, so this stays a citation, not a dataset to ingest |

## Public technical and institutional sources

| Source | Official page | Saved as | What it is |
| --- | --- | --- | --- |
| MITA | https://www.medicaid.gov/medicaid/data-systems/medicaid-information-technology-architecture | `sources/mita.md` | Medicaid Information Technology Architecture, the national Medicaid IT framework |
| State IT plans | https://www.medicaid.gov/medicaid/data-systems/medicaid-enterprise-certification-toolkit | `sources/medicaid-enterprise-certification.md` | Medicaid Enterprise Certification Toolkit. Individual state IT plans are state documents |
| Procurement | https://sam.gov/contracting | `sources/sam-contracting.md` | Federal contract opportunities, awards, and contract-data APIs. State procurement sites are separate |
| GAO | https://www.gao.gov/reports-testimonies | `sources/gao-reports.md` | GAO reports and testimonies |
| State auditors | https://www.nasact.org/ | `sources/nasact.md` | NASACT member directory of state auditors, comptrollers, and treasurers, plus a performance-audit database |
| Budgets | https://www.nasbo.org/reports-data/state-expenditure-report | `sources/nasbo-expenditure.md` | NASBO State Expenditure Report |
| Proposed and enacted budgets | https://www.nasbo.org/resources/proposed-enacted-budgets | `sources/nasbo-budgets.md` | State-by-state proposed and enacted budget links |
| Fiscal notes | Not one national file | — | Fiscal notes are issued by legislative fiscal offices. NASBO covers budgets and spending. A single national fiscal-note dataset was not retrieved |

## Rhode Island SNAP application questions

Retrieved 2026-10-07 from the Rhode Island Department of Human Services.

| What | Page | Saved as |
| --- | --- | --- |
| Eligibility rules and October 2026 income limits | https://dhs.ri.gov/programs-and-services/supplemental-nutrition-assistance-program-snap/supplemental-nutrition-0 | `sources/ri-snap-eligibility.md` |
| How to apply, including the DHS-2 form link | https://dhs.ri.gov/apply-now | `sources/ri-snap-apply.md` |
| The questions on the form | https://dhs.ri.gov/media/11996/download?language=en | `sources/ri-dhs2-application.md` |
| Documents to bring | https://dhs.ri.gov/programs-and-services/nutrition-assistance/documents-you-may-need | `sources/ri-snap-documents.md` |

The form text was read through Firecrawl. A direct download of the PDF returned HTTP 403, so the PDF file is not in `data/`.

## Not retrieved on purpose

- Every state's Medicaid manual, code, IT plan, auditor report, and procurement portal. The national indexes above are the way into those. Crawling all of them would burn the free credit allowance.
- 211 call-level or aggregate data files. The published snapshot is public. A reuse license was not found.
