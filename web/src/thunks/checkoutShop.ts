import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchNui } from '../utils/fetchNui';

export const checkoutShop = createAsyncThunk(
  'inventory/checkoutShop',
  async (
    data: {
      items: { fromSlot: number; count: number }[];
      payment: 'cash' | 'card' | 'giftcard';
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetchNui<boolean>('checkoutShop', data);
      if (response === false) return rejectWithValue(response);
      return response;
    } catch {
      return rejectWithValue(false);
    }
  }
);
