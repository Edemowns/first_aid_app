// constants/hotlines.js
// Ghana Emergency Contacts Database

export const EMERGENCY_CONTACTS = [
  // Ambulance Services
  {
    name: 'National Ambulance Service',
    number: '193',
    category: 'ambulance',
    availability: '24/7 Emergency',
    description: 'Free emergency ambulance service across Ghana'
  },
  {
    name: 'NADMO (Emergency Response)',
    number: '112',
    category: 'ambulance',
    availability: '24/7',
    description: 'National Disaster Management Organization'
  },
  
  // Police
  {
    name: 'Ghana Police Service',
    number: '191',
    category: 'police',
    availability: '24/7 Emergency',
    description: 'Emergency police response'
  },
  {
    name: 'Police Headquarters',
    number: '0302779906',
    category: 'police',
    availability: '24/7',
    description: 'Accra Police Headquarters'
  },
  {
    name: 'MTTD (Traffic Police)',
    number: '192',
    category: 'police',
    availability: '24/7',
    description: 'Motor Traffic and Transport Department'
  },
  
  // Fire Service
  {
    name: 'Ghana National Fire Service',
    number: '192',
    category: 'fire',
    availability: '24/7',
    description: 'Emergency fire response'
  },
  {
    name: 'Fire Service HQ',
    number: '0302224666',
    category: 'fire',
    availability: '24/7',
    description: 'Fire Service Headquarters'
  },
  
  // Hospitals - Accra
  {
    name: 'Korle Bu Teaching Hospital',
    number: '0302661000',
    category: 'hospital',
    availability: '24/7 Emergency',
    description: 'Major referral hospital in Accra'
  },
  {
    name: '37 Military Hospital',
    number: '0302511687',
    category: 'hospital',
    availability: '24/7 Emergency',
    description: 'Military hospital with emergency services'
  },
  {
    name: 'University of Ghana Medical Centre',
    number: '0302334266',
    category: 'hospital',
    availability: '24/7',
    description: 'UGMC - Modern medical facility'
  },
  {
    name: 'Ridge Hospital',
    number: '0302426353',
    category: 'hospital',
    availability: '24/7 Emergency',
    description: 'Regional hospital in Accra'
  },
  
  // Hospitals - Kumasi
  {
    name: 'Komfo Anokye Teaching Hospital',
    number: '0322022001',
    category: 'hospital',
    availability: '24/7 Emergency',
    description: 'Major hospital in Kumasi'
  },
  
  // Hospitals - Other Regions
  {
    name: 'Cape Coast Teaching Hospital',
    number: '0332124000',
    category: 'hospital',
    availability: '24/7',
    description: 'Central Region hospital'
  },
  {
    name: 'Tamale Teaching Hospital',
    number: '0372022170',
    category: 'hospital',
    availability: '24/7',
    description: 'Northern Region hospital'
  },
  
  // Poison Control
  {
    name: 'Poison Control Centre',
    number: '0302442253',
    category: 'other',
    availability: '24/7',
    description: 'For poisoning emergencies'
  },
  
  // Mental Health
  {
    name: 'Mental Health Authority',
    number: '0302231555',
    category: 'other',
    availability: '24/7',
    description: 'Psychiatric emergency support'
  },
  
  // Child Protection
  {
    name: 'Child Helpline',
    number: '0800111111',
    category: 'other',
    availability: '24/7',
    description: 'Free child protection hotline'
  },
  
  // Domestic Violence
  {
    name: 'Domestic Violence Helpline',
    number: '0800111222',
    category: 'other',
    availability: '24/7',
    description: 'Support for domestic violence cases'
  }
];

// Category colors for consistent theming
export const CATEGORY_COLORS = {
  ambulance: '#D32F2F',
  police: '#1565C0',
  fire: '#F57C00',
  hospital: '#388E3C',
  other: '#757575'
};

// Category icons
export const CATEGORY_ICONS = {
  ambulance: '🚑',
  police: '👮',
  fire: '🔥',
  hospital: '🏥',
  other: '📞'
};