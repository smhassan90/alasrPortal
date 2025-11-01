import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Masjid } from '../services/masjidService';

interface MasjidsState {
  masajids: Masjid[];
  selectedMasjid: Masjid | null;
  loading: boolean;
  error: string | null;
}

const initialState: MasjidsState = {
  masajids: [],
  selectedMasjid: null,
  loading: false,
  error: null,
};

const masjidsSlice = createSlice({
  name: 'masajids',
  initialState,
  reducers: {
    setMasajids: (state, action: PayloadAction<Masjid[]>) => {
      state.masajids = action.payload;
      state.loading = false;
      state.error = null;
    },
    setSelectedMasjid: (state, action: PayloadAction<Masjid | null>) => {
      state.selectedMasjid = action.payload;
    },
    addMasjid: (state, action: PayloadAction<Masjid>) => {
      state.masajids.push(action.payload);
    },
    updateMasjid: (state, action: PayloadAction<Masjid>) => {
      const index = state.masajids.findIndex((m) => m.id === action.payload.id);
      if (index !== -1) {
        state.masajids[index] = action.payload;
      }
    },
    removeMasjid: (state, action: PayloadAction<string>) => {
      state.masajids = state.masajids.filter((m) => m.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setMasajids,
  setSelectedMasjid,
  addMasjid,
  updateMasjid,
  removeMasjid,
  setLoading,
  setError,
} = masjidsSlice.actions;
export default masjidsSlice.reducer;

