export interface Country {
  name: string;
  code: string; // country code
  currency: string;
  iso2: string;
}

export const countries: Country[] = [
  { name: "Pakistan", code: "PK", currency: "PKR", iso2: "pk" },
  { name: "United States", code: "US", currency: "USD", iso2: "us" },
  { name: "United Kingdom", code: "GB", currency: "GBP", iso2: "gb" },
  { name: "Canada", code: "CA", currency: "CAD", iso2: "ca" },
  { name: "Australia", code: "AU", currency: "AUD", iso2: "au" },
  { name: "Europe", code: "EU", currency: "EUR", iso2: "eu" },
  { name: "United Arab Emirates", code: "AE", currency: "AED", iso2: "ae" },
  { name: "Saudi Arabia", code: "SA", currency: "SAR", iso2: "sa" },
  { name: "Qatar", code: "QA", currency: "QAR", iso2: "qa" },
  { name: "Kuwait", code: "KW", currency: "USD", iso2: "kw" },
  { name: "Oman", code: "OM", currency: "USD", iso2: "om" },
  { name: "Bahrain", code: "BH", currency: "BHD", iso2: "bh" },
  { name: "New Zealand", code: "NZ", currency: "NZD", iso2: "nz" },
  { name: "Malaysia", code: "MY", currency: "MYR", iso2: "my" },
  { name: "Singapore", code: "SG", currency: "SGD", iso2: "sg" },
  { name: "South Africa", code: "ZA", currency: "ZAR", iso2: "za" },
  { name: "Mauritius", code: "MU", currency: "MUR", iso2: "mu" },
  { name: "Japan", code: "JP", currency: "JPY", iso2: "jp" },
  { name: "India", code: "IN", currency: "INR", iso2: "in" },
  { name: "Türkiye", code: "TR", currency: "TRY", iso2: "tr" },
];
