import { createSlice, PayloadAction } from '@reduxjs/toolkit';


interface CBTFormState {
  currentStep: number; // Legacy numeric step for backward compatibility
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}

const initialState: CBTFormState = {
  currentStep: 1,
  isSubmitting: false,
  validationErrors: {},
};

const cbtFormSlice = createSlice({
  name: 'cbtForm',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },

    setSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },

    setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.validationErrors = action.payload;
    },

    clearValidationErrors: (state) => {
      state.validationErrors = {};
    },

    addValidationError: (state, action: PayloadAction<{ field: string; message: string }>) => {
      state.validationErrors[action.payload.field] = action.payload.message;
    },

    removeValidationError: (state, action: PayloadAction<string>) => {
      delete state.validationErrors[action.payload];
    },
  },
});

export const {
  setCurrentStep,
  setSubmitting,
  setValidationErrors,
  clearValidationErrors,
  addValidationError,
  removeValidationError,
} = cbtFormSlice.actions;

export default cbtFormSlice.reducer;
