// Territory pricing structure for music licensing
// Percentages represent the portion of base rate for each territory

export interface Territory {
  id: string;
  name: string;
  percentage: number; // Percentage of base rate (0-100)
  tier: 1 | 2 | 3 | 4 | 5;
  children?: Territory[];
}

export const TERRITORIES: Territory[] = [
  {
    id: 'worldwide',
    name: 'Worldwide (All Territories)',
    percentage: 100,
    tier: 1,
  },
  {
    id: 'north-america',
    name: 'North America',
    percentage: 35,
    tier: 1,
    children: [
      { 
        id: 'usa', 
        name: 'United States', 
        percentage: 30, 
        tier: 1,
        children: [
          { id: 'us-ca', name: 'California', percentage: 7.28, tier: 1 },
          { id: 'us-ny', name: 'New York', percentage: 3.53, tier: 1 },
          { id: 'us-fl', name: 'Florida', percentage: 1.32, tier: 1 },
          { id: 'us-tx', name: 'Texas', percentage: 1.16, tier: 1 },
          { id: 'us-tn', name: 'Tennessee', percentage: 1.06, tier: 1 },
          { id: 'us-pa', name: 'Pennsylvania', percentage: 0.91, tier: 1 },
          { id: 'us-il', name: 'Illinois', percentage: 0.75, tier: 1 },
          { id: 'us-ga', name: 'Georgia', percentage: 0.68, tier: 1 },
          { id: 'us-oh', name: 'Ohio', percentage: 0.54, tier: 1 },
          { id: 'us-nc', name: 'North Carolina', percentage: 0.51, tier: 1 },
          { id: 'us-nj', name: 'New Jersey', percentage: 0.48, tier: 1 },
          { id: 'us-va', name: 'Virginia', percentage: 0.45, tier: 1 },
          { id: 'us-wa', name: 'Washington', percentage: 0.42, tier: 1 },
          { id: 'us-ma', name: 'Massachusetts', percentage: 0.39, tier: 1 },
          { id: 'us-mi', name: 'Michigan', percentage: 0.36, tier: 1 },
          { id: 'us-co', name: 'Colorado', percentage: 0.33, tier: 1 },
          { id: 'us-az', name: 'Arizona', percentage: 0.30, tier: 1 },
          { id: 'us-md', name: 'Maryland', percentage: 0.27, tier: 1 },
          { id: 'us-in', name: 'Indiana', percentage: 0.24, tier: 1 },
          { id: 'us-mo', name: 'Missouri', percentage: 0.21, tier: 1 },
          { id: 'us-wi', name: 'Wisconsin', percentage: 0.18, tier: 1 },
          { id: 'us-mn', name: 'Minnesota', percentage: 0.17, tier: 1 },
          { id: 'us-or', name: 'Oregon', percentage: 0.15, tier: 1 },
          { id: 'us-sc', name: 'South Carolina', percentage: 0.14, tier: 1 },
          { id: 'us-al', name: 'Alabama', percentage: 0.12, tier: 1 },
          { id: 'us-la', name: 'Louisiana', percentage: 0.11, tier: 1 },
          { id: 'us-ky', name: 'Kentucky', percentage: 0.11, tier: 1 },
          { id: 'us-ct', name: 'Connecticut', percentage: 0.10, tier: 1 },
          { id: 'us-ok', name: 'Oklahoma', percentage: 0.09, tier: 1 },
          { id: 'us-ia', name: 'Iowa', percentage: 0.08, tier: 1 },
          { id: 'us-ut', name: 'Utah', percentage: 0.08, tier: 1 },
          { id: 'us-nv', name: 'Nevada', percentage: 0.08, tier: 1 },
          { id: 'us-ks', name: 'Kansas', percentage: 0.07, tier: 1 },
          { id: 'us-ar', name: 'Arkansas', percentage: 0.06, tier: 1 },
          { id: 'us-ms', name: 'Mississippi', percentage: 0.06, tier: 1 },
          { id: 'us-ne', name: 'Nebraska', percentage: 0.05, tier: 1 },
          { id: 'us-nm', name: 'New Mexico', percentage: 0.05, tier: 1 },
          { id: 'us-hi', name: 'Hawaii', percentage: 0.05, tier: 1 },
          { id: 'us-wv', name: 'West Virginia', percentage: 0.04, tier: 1 },
          { id: 'us-id', name: 'Idaho', percentage: 0.04, tier: 1 },
          { id: 'us-nh', name: 'New Hampshire', percentage: 0.04, tier: 1 },
          { id: 'us-me', name: 'Maine', percentage: 0.03, tier: 1 },
          { id: 'us-de', name: 'Delaware', percentage: 0.03, tier: 1 },
          { id: 'us-ri', name: 'Rhode Island', percentage: 0.03, tier: 1 },
          { id: 'us-mt', name: 'Montana', percentage: 0.02, tier: 1 },
          { id: 'us-sd', name: 'South Dakota', percentage: 0.02, tier: 1 },
          { id: 'us-nd', name: 'North Dakota', percentage: 0.02, tier: 1 },
          { id: 'us-ak', name: 'Alaska', percentage: 0.02, tier: 1 },
          { id: 'us-vt', name: 'Vermont', percentage: 0.01, tier: 1 },
          { id: 'us-wy', name: 'Wyoming', percentage: 0.01, tier: 1 },
        ]
      },
      { id: 'canada', name: 'Canada', percentage: 5, tier: 1 },
    ],
  },
  {
    id: 'western-europe',
    name: 'Western Europe',
    percentage: 25,
    tier: 2,
    children: [
      { id: 'uk', name: 'United Kingdom', percentage: 8, tier: 2 },
      { id: 'germany', name: 'Germany', percentage: 6, tier: 2 },
      { id: 'france', name: 'France', percentage: 5, tier: 2 },
      { id: 'spain', name: 'Spain', percentage: 3, tier: 2 },
      { id: 'italy', name: 'Italy', percentage: 3, tier: 2 },
    ],
  },
  {
    id: 'asia-pacific-developed',
    name: 'Asia-Pacific (Developed)',
    percentage: 20,
    tier: 3,
    children: [
      { id: 'japan', name: 'Japan', percentage: 8, tier: 3 },
      { id: 'australia', name: 'Australia', percentage: 5, tier: 3 },
      { id: 'south-korea', name: 'South Korea', percentage: 4, tier: 3 },
      { id: 'singapore', name: 'Singapore', percentage: 2, tier: 3 },
      { id: 'new-zealand', name: 'New Zealand', percentage: 1, tier: 3 },
    ],
  },
  {
    id: 'latin-america',
    name: 'Latin America',
    percentage: 10,
    tier: 4,
    children: [
      { id: 'brazil', name: 'Brazil', percentage: 4, tier: 4 },
      { id: 'mexico', name: 'Mexico', percentage: 3, tier: 4 },
      { id: 'argentina', name: 'Argentina', percentage: 1.5, tier: 4 },
      { id: 'colombia', name: 'Colombia', percentage: 0.75, tier: 4 },
      { id: 'chile', name: 'Chile', percentage: 0.5, tier: 4 },
      { id: 'latam-other', name: 'Rest of Latin America', percentage: 0.25, tier: 4 },
    ],
  },
  {
    id: 'asia-pacific-emerging',
    name: 'Asia-Pacific (Emerging)',
    percentage: 6,
    tier: 4,
    children: [
      { id: 'china', name: 'China', percentage: 3, tier: 4 },
      { id: 'india', name: 'India', percentage: 2, tier: 4 },
      { id: 'indonesia', name: 'Indonesia', percentage: 0.5, tier: 4 },
      { id: 'philippines', name: 'Philippines', percentage: 0.25, tier: 4 },
      { id: 'thailand', name: 'Thailand', percentage: 0.25, tier: 4 },
    ],
  },
  {
    id: 'middle-east-north-africa',
    name: 'Middle East & North Africa',
    percentage: 2,
    tier: 5,
    children: [
      { id: 'uae-saudi', name: 'UAE & Saudi Arabia', percentage: 1, tier: 5 },
      { id: 'turkey', name: 'Turkey', percentage: 0.5, tier: 5 },
      { id: 'mena-other', name: 'Rest of MENA', percentage: 0.5, tier: 5 },
    ],
  },
  {
    id: 'eastern-europe',
    name: 'Eastern Europe',
    percentage: 1,
    tier: 5,
    children: [
      { id: 'poland', name: 'Poland', percentage: 0.5, tier: 5 },
      { id: 'russia', name: 'Russia', percentage: 0.25, tier: 5 },
      { id: 'eastern-europe-other', name: 'Rest of Eastern Europe', percentage: 0.25, tier: 5 },
    ],
  },
  {
    id: 'africa',
    name: 'Africa',
    percentage: 1,
    tier: 5,
    children: [
      { id: 'south-africa', name: 'South Africa', percentage: 0.5, tier: 5 },
      { id: 'nigeria', name: 'Nigeria', percentage: 0.25, tier: 5 },
      { id: 'africa-other', name: 'Rest of Africa', percentage: 0.25, tier: 5 },
    ],
  },
];

// Flatten all territories for easy lookup (including nested children)
export const ALL_TERRITORIES_FLAT: Territory[] = TERRITORIES.reduce((acc, territory) => {
  acc.push(territory);
  if (territory.children) {
    territory.children.forEach(child => {
      acc.push(child);
      if (child.children) {
        acc.push(...child.children);
      }
    });
  }
  return acc;
}, [] as Territory[]);

// Get territory by ID
export function getTerritoryById(id: string): Territory | undefined {
  return ALL_TERRITORIES_FLAT.find(t => t.id === id);
}

// Calculate total percentage for multiple selected territories
export function calculateTerritoryPercentage(selectedIds: string[]): number {
  if (selectedIds.length === 0) return 100; // Default to worldwide if none selected
  
  // If "worldwide" is selected, return 100%
  if (selectedIds.includes('worldwide')) return 100;
  
  // Check if parent and child are both selected (avoid double counting)
  const cleanedIds = selectedIds.filter(id => {
    const territory = getTerritoryById(id);
    if (!territory?.children) return true;
    
    // If this territory has children, check if any child is also selected
    const childIds = territory.children.map(c => c.id);
    const hasChildSelected = childIds.some(childId => selectedIds.includes(childId));
    
    // If children are selected, don't count the parent
    return !hasChildSelected;
  });
  
  // Sum up percentages for selected territories
  const total = cleanedIds.reduce((sum, id) => {
    const territory = getTerritoryById(id);
    return sum + (territory?.percentage || 0);
  }, 0);
  
  // Cap at 100%
  return Math.min(total, 100);
}

// Get territory display name for multiple selections
export function getTerritoryDisplayName(selectedIds: string[]): string {
  if (selectedIds.length === 0 || selectedIds.includes('worldwide')) {
    return 'Worldwide';
  }
  
  if (selectedIds.length === 1) {
    const territory = getTerritoryById(selectedIds[0]);
    return territory?.name || 'Unknown Territory';
  }
  
  if (selectedIds.length === 2) {
    const names = selectedIds.map(id => getTerritoryById(id)?.name).filter(Boolean);
    return names.join(' + ');
  }
  
  return `${selectedIds.length} Territories`;
}
