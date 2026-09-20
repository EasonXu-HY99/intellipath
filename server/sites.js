// Public site directory. Addresses verified against Seatrium's own directory.
// Headquarters and Tuas Boulevard Yard occupy the same address.
export const SITE_SOURCE = "https://www.seatrium.com/contact.php";
export const SITES = [
  {
    id: "SG-ADM",
    name: "Admiralty Yard",
    address: "Admiralty Road West, Singapore 759956",
    category: "Shipyard",
    phone: "+65 6752 2222",
  },
  {
    id: "SG-BEN",
    name: "Benoi Yard",
    address: "15 Benoi Road, Singapore 629888",
    category: "Shipyard",
    phone: "+65 6861 6622",
  },
  {
    id: "SG-PIO",
    name: "Pioneer Yard",
    address: "50 Gul Road, Singapore 629351",
    category: "Shipyard / Offshore Technology office",
    phone: "+65 6863 7200",
  },
  {
    id: "SG-TUA",
    name: "Tuas Yard",
    address: "51 Pioneer Sector 1, Singapore 628437",
    category: "Shipyard",
    phone: "+65 6861 4141",
  },
  {
    id: "SG-TBY",
    name: "Tuas Boulevard Yard / Corporate Headquarters",
    address: "80 Tuas South Boulevard, Singapore 637051",
    category: "Headquarters / Shipyard",
    phone: "+65 6265 1766",
  },
].map((s) => ({
  ...s,
  required_level: 1,
  source: SITE_SOURCE,
  verified: "2026-09-20",
  country: "Singapore",
}));
