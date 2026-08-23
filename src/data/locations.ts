import type { LocationCountry, AreaOption } from '../services/locationService';

export const FALLBACK_LOCATION_CATALOG: LocationCountry[] = [
  {
    name: 'Pakistan',
    states: [
      {
        name: 'Sindh',
        cities: [
          'Karachi',
          'Hyderabad',
          'Sukkur',
          'Larkana',
          'Nawabshah',
          'Mirpur Khas',
          'Jacobabad',
          'Shikarpur',
          'Khairpur',
          'Dadu',
          'Tando Allahyar',
          'Kotri',
          'Thatta',
          'Badin',
          'Ghotki',
          'Sanghar',
          'Umerkot',
          'Jamshoro',
        ],
      },
      {
        name: 'Punjab',
        cities: [
          'Lahore',
          'Faisalabad',
          'Rawalpindi',
          'Multan',
          'Gujranwala',
          'Sialkot',
          'Bahawalpur',
          'Sargodha',
          'Sheikhupura',
          'Rahim Yar Khan',
          'Gujrat',
          'Sahiwal',
          'Wah Cantonment',
          'Kasur',
          'Okara',
          'Jhelum',
          'Dera Ghazi Khan',
          'Vehari',
          'Attock',
          'Chakwal',
          'Mianwali',
          'Chiniot',
          'Hafizabad',
          'Khanewal',
          'Jhang',
        ],
      },
      {
        name: 'Khyber Pakhtunkhwa',
        cities: [
          'Peshawar',
          'Mardan',
          'Mingora',
          'Kohat',
          'Abbottabad',
          'Dera Ismail Khan',
          'Nowshera',
          'Swabi',
          'Charsadda',
          'Mansehra',
          'Bannu',
          'Haripur',
          'Chitral',
        ],
      },
      {
        name: 'Balochistan',
        cities: [
          'Quetta',
          'Turbat',
          'Khuzdar',
          'Hub',
          'Chaman',
          'Gwadar',
          'Sibi',
          'Zhob',
          'Loralai',
        ],
      },
      {
        name: 'Islamabad Capital Territory',
        cities: ['Islamabad'],
      },
      {
        name: 'Azad Jammu and Kashmir',
        cities: ['Muzaffarabad', 'Mirpur', 'Kotli', 'Rawalakot', 'Bhimber', 'Bagh'],
      },
      {
        name: 'Gilgit-Baltistan',
        cities: ['Gilgit', 'Skardu', 'Chilas', 'Hunza', 'Ghanche'],
      },
    ],
  },
];

const FALLBACK_AREAS: Record<string, Record<string, Record<string, string[]>>> = {
  Pakistan: {
    Sindh: {
      Karachi: [
        'Clifton',
        'DHA',
        'PECHS',
        'Saddar',
        'Gulshan-e-Iqbal',
        'Gulistan-e-Jauhar',
        'North Nazimabad',
        'Nazimabad',
        'Federal B Area',
        'Malir',
        'Korangi',
        'Landhi',
        'Shah Faisal Colony',
        'Liaquatabad',
        'Orangi Town',
        'Keamari',
        'Lyari',
        'Bahadurabad',
        'North Karachi',
        'New Karachi',
        'Gulberg',
        'Shahrah-e-Faisal',
        'Buffer Zone',
        'Scheme 33',
        'Surjani Town',
        'Garden',
      ],
    },
    Punjab: {
      Lahore: [
        'DHA',
        'Gulberg',
        'Model Town',
        'Johar Town',
        'Allama Iqbal Town',
        'Garden Town',
        'Cantt',
        'Wapda Town',
        'Township',
        'Bahria Town',
        'Faisal Town',
        'Muslim Town',
        'Ichhra',
        'Samanabad',
      ],
    },
  },
};

function mergeCityLists(primary: string[] = [], extra: string[] = []): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  [...primary, ...extra].forEach((city) => {
    const key = city.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(city);
    }
  });
  return merged.sort((a, b) => a.localeCompare(b));
}

export function mergeLocationCatalogs(
  fallback: LocationCountry[],
  incoming: LocationCountry[]
): LocationCountry[] {
  const catalog = JSON.parse(JSON.stringify(fallback)) as LocationCountry[];

  incoming.forEach((country) => {
    let catalogCountry = catalog.find(
      (item) => item.name.toLowerCase() === country.name.toLowerCase()
    );
    if (!catalogCountry) {
      catalogCountry = { name: country.name, states: [] };
      catalog.push(catalogCountry);
    }

    (country.states || []).forEach((state) => {
      let catalogState = catalogCountry?.states.find(
        (item) => item.name.toLowerCase() === state.name.toLowerCase()
      );
      if (!catalogState) {
        catalogState = { name: state.name, cities: [] };
        catalogCountry?.states.push(catalogState);
      }
      catalogState.cities = mergeCityLists(catalogState.cities, state.cities);
    });
  });

  return catalog;
}

export function getFallbackAreas(country: string, state: string, city: string): AreaOption[] {
  const names = FALLBACK_AREAS[country]?.[state]?.[city] || [];
  return names.map((name) => ({
    id: null,
    name,
    city,
    state,
    country,
  }));
}

export function mergeAreaOptions(primary: AreaOption[], extra: AreaOption[]): AreaOption[] {
  const seen = new Set<string>();
  const merged: AreaOption[] = [];
  [...primary, ...extra].forEach((area) => {
    const key = area.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(area);
    }
  });
  return merged.sort((a, b) => a.name.localeCompare(b.name));
}
