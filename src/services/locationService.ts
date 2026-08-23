import api from './api';

export interface LocationState {
  name: string;
  cities: string[];
}

export interface LocationCountry {
  name: string;
  states: LocationState[];
}

export interface AreaOption {
  id: string | null;
  name: string;
  city: string;
  state: string;
  country: string;
}

function unwrap<T>(payload: any): T {
  if (payload?.data !== undefined) {
    return payload.data as T;
  }
  return payload as T;
}

class LocationService {
  async getCatalog(): Promise<LocationCountry[]> {
    const response = await api.get('/locations/catalog');
    const data = unwrap<{ countries?: LocationCountry[] }>(response.data);
    return data?.countries || [];
  }

  async getAreas(country: string, state: string, city: string): Promise<AreaOption[]> {
    if (!country || !state || !city) {
      return [];
    }
    const response = await api.get('/locations/areas', {
      params: { country, state, city },
    });
    const data = unwrap<AreaOption[]>(response.data);
    return Array.isArray(data) ? data : [];
  }

  async createArea(payload: {
    name: string;
    city: string;
    state: string;
    country: string;
  }): Promise<AreaOption> {
    const response = await api.post('/locations/areas', payload);
    return unwrap<AreaOption>(response.data);
  }
}

export const withCurrentValue = (
  options: { value: string; label: string }[],
  current?: string
) => {
  if (!current) {
    return options;
  }
  if (options.some((option) => option.value === current)) {
    return options;
  }
  return [{ value: current, label: current }, ...options];
};

export default new LocationService();
