import { create } from 'zustand';
import {
  fetchCustomFields,
  createCustomField,
  updateCustomField,
  deleteCustomField,
  fetchOrderCustomFields,
  setOrderCustomFieldValue,
  type CustomFieldDefinition,
  type CustomFieldValue,
  type CustomFieldWithValue,
  type CreateCustomFieldInput,
  type UpdateCustomFieldInput,
} from '@/lib/api';

interface CustomFieldState {
  // Data
  fieldDefinitions: CustomFieldDefinition[];
  orderFieldValues: Record<string, CustomFieldWithValue[]>; // keyed by orderId
  
  // UI State
  loading: boolean;
  error: string | null;
  savingFieldId: string | null;
  
  // Actions - Field Definitions
  fetchFieldDefinitions: () => Promise<void>;
  createFieldDefinition: (input: CreateCustomFieldInput) => Promise<CustomFieldDefinition>;
  updateFieldDefinition: (id: string, input: UpdateCustomFieldInput) => Promise<CustomFieldDefinition>;
  deleteFieldDefinition: (id: string) => Promise<void>;
  
  // Actions - Field Values
  fetchOrderFields: (orderId: string) => Promise<void>;
  setFieldValue: (orderId: string, fieldId: string, value: string) => Promise<CustomFieldValue>;
  clearOrderFields: (orderId: string) => void;
}

export const useCustomFieldStore = create<CustomFieldState>((set, get) => ({
  // Initial state
  fieldDefinitions: [],
  orderFieldValues: {},
  loading: false,
  error: null,
  savingFieldId: null,

  fetchFieldDefinitions: async () => {
    set({ loading: true, error: null });
    try {
      const fieldDefinitions = await fetchCustomFields();
      set({ fieldDefinitions, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить кастомные поля',
        loading: false,
      });
    }
  },


  createFieldDefinition: async (input: CreateCustomFieldInput) => {
    const newField = await createCustomField(input);
    set((state) => ({
      fieldDefinitions: [...state.fieldDefinitions, newField].sort(
        (a, b) => a.position - b.position
      ),
    }));
    return newField;
  },

  updateFieldDefinition: async (id: string, input: UpdateCustomFieldInput) => {
    const updatedField = await updateCustomField(id, input);
    set((state) => ({
      fieldDefinitions: state.fieldDefinitions
        .map((field) => (field.id === id ? updatedField : field))
        .sort((a, b) => a.position - b.position),
    }));
    return updatedField;
  },

  deleteFieldDefinition: async (id: string) => {
    await deleteCustomField(id);
    set((state) => ({
      fieldDefinitions: state.fieldDefinitions.filter((field) => field.id !== id),
    }));
  },

  fetchOrderFields: async (orderId: string) => {
    set({ loading: true, error: null });
    try {
      const fields = await fetchOrderCustomFields(orderId);
      set((state) => ({
        orderFieldValues: {
          ...state.orderFieldValues,
          [orderId]: fields,
        },
        loading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Не удалось загрузить значения полей',
        loading: false,
      });
    }
  },

  setFieldValue: async (orderId: string, fieldId: string, value: string) => {
    set({ savingFieldId: fieldId });
    try {
      const savedValue = await setOrderCustomFieldValue(orderId, fieldId, value);
      
      // Update local state
      set((state) => {
        const currentFields = state.orderFieldValues[orderId] || [];
        const updatedFields = currentFields.map((item) =>
          item.field.id === fieldId
            ? { ...item, value: savedValue }
            : item
        );
        
        return {
          orderFieldValues: {
            ...state.orderFieldValues,
            [orderId]: updatedFields,
          },
          savingFieldId: null,
        };
      });
      
      return savedValue;
    } catch (err) {
      set({ savingFieldId: null });
      throw err;
    }
  },

  clearOrderFields: (orderId: string) => {
    set((state) => {
      const { [orderId]: _, ...rest } = state.orderFieldValues;
      return { orderFieldValues: rest };
    });
  },
}));

// Selectors
export const selectFieldDefinitionsByType = (type: string) => (state: CustomFieldState) =>
  state.fieldDefinitions.filter((field) => field.type === type);

export const selectRequiredFields = (state: CustomFieldState) =>
  state.fieldDefinitions.filter((field) => field.isRequired);

export const selectOrderFieldValues = (orderId: string) => (state: CustomFieldState) =>
  state.orderFieldValues[orderId] || [];

export const selectFieldValue = (orderId: string, fieldId: string) => (state: CustomFieldState) => {
  const fields = state.orderFieldValues[orderId] || [];
  const field = fields.find((f) => f.field.id === fieldId);
  return field?.value?.value || '';
};

export const selectFieldsCount = (state: CustomFieldState) => state.fieldDefinitions.length;

export default useCustomFieldStore;
