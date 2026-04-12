import { create } from "zustand";

export interface ShippingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country_code: string;
}

interface CheckoutState {
  sessionToken: string | null;
  sessionExpiresAt: string | null;
  currentStep: 1 | 2 | 3;
  shippingAddress: ShippingAddress;
  selectedShippingMethodId: string | null;
  email: string;
  stripePaymentMethodToken: string | null;
  // Actions
  setSessionToken: (token: string, expiresAt: string) => void;
  setShippingAddress: (address: Partial<ShippingAddress>) => void;
  setShippingMethodId: (id: string) => void;
  setEmail: (email: string) => void;
  setStripePaymentMethodToken: (token: string) => void;
  setCurrentStep: (step: 1 | 2 | 3) => void;
  resetCheckout: () => void;
}

const initialAddress: ShippingAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country_code: "",
};

export const useCheckoutStore = create<CheckoutState>()((set) => ({
  sessionToken: null,
  sessionExpiresAt: null,
  currentStep: 1,
  shippingAddress: { ...initialAddress },
  selectedShippingMethodId: null,
  email: "",
  stripePaymentMethodToken: null,

  setSessionToken: (token, expiresAt) => set({ sessionToken: token, sessionExpiresAt: expiresAt }),

  setShippingAddress: (address) =>
    set((state) => ({
      shippingAddress: { ...state.shippingAddress, ...address },
    })),

  setShippingMethodId: (id) => set({ selectedShippingMethodId: id }),

  setEmail: (email) => set({ email }),

  setStripePaymentMethodToken: (token) => set({ stripePaymentMethodToken: token }),

  setCurrentStep: (step) => set({ currentStep: step }),

  resetCheckout: () =>
    set({
      sessionToken: null,
      sessionExpiresAt: null,
      currentStep: 1,
      shippingAddress: { ...initialAddress },
      selectedShippingMethodId: null,
      email: "",
      stripePaymentMethodToken: null,
    }),
}));
