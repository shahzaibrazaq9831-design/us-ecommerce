export interface Country {
  name: string;
  code: string; // country code
  currency: string;
  iso2: string;
  label?: string;
}

export const countries: Country[] = [
  { name: "Pakistan", code: "PK", currency: "PKR", iso2: "pk", label: "Pakistan (PKR)" },
  { name: "United States", code: "US", currency: "USD", iso2: "us", label: "United States (USD)" },
  { name: "United Kingdom", code: "GB", currency: "GBP", iso2: "gb", label: "United Kingdom (GBP)" },
  { name: "Canada", code: "CA", currency: "CAD", iso2: "ca", label: "Canada (CAD)" },
  { name: "Australia", code: "AU", currency: "AUD", iso2: "au", label: "Australia (AUD)" },
  { name: "Europe", code: "EU", currency: "EUR", iso2: "eu", label: "Europe (EUR)" },
  { name: "United Arab Emirates", code: "AE", currency: "AED", iso2: "ae", label: "United Arab Emirates (AED)" },
  { name: "Saudi Arabia", code: "SA", currency: "SAR", iso2: "sa", label: "Saudi Arabia (SAR)" },
  { name: "Qatar", code: "QA", currency: "QAR", iso2: "qa", label: "Qatar (QAR)" },
  { name: "Kuwait", code: "KW", currency: "USD", iso2: "kw", label: "Kuwait (USD)" },
  { name: "Oman", code: "OM", currency: "USD", iso2: "om", label: "Oman (USD)" },
  { name: "Bahrain", code: "BH", currency: "BHD", iso2: "bh", label: "Bahrain (BHD)" },
  { name: "New Zealand", code: "NZ", currency: "NZD", iso2: "nz", label: "New Zealand (NZD)" },
  { name: "Malaysia", code: "MY", currency: "MYR", iso2: "my", label: "Malaysia (MYR)" },
  { name: "Singapore", code: "SG", currency: "SGD", iso2: "sg", label: "Singapore (SGD)" },
  { name: "South Africa", code: "ZA", currency: "ZAR", iso2: "za", label: "South Africa (ZAR)" },
  { name: "Mauritius", code: "MU", currency: "MUR", iso2: "mu", label: "Mauritius (MUR)" },
  { name: "Japan", code: "JP", currency: "JPY", iso2: "jp", label: "Japan (JPY)" },
  { name: "India", code: "IN", currency: "INR", iso2: "in", label: "India (INR)" },
  { name: "Türkiye", code: "TR", currency: "TRY", iso2: "tr", label: "Türkiye (TRY)" },
];
