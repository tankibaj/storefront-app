import { useMutation } from "@tanstack/react-query";
import { createGuestSession } from "../api/order-client";
import { useCheckoutStore } from "../stores/checkout-store";

export function useCreateGuestSession() {
  const setSessionToken = useCheckoutStore((state) => state.setSessionToken);

  return useMutation({
    mutationFn: createGuestSession,
    onSuccess: (session) => {
      setSessionToken(session.token, session.expires_at);
    },
  });
}
