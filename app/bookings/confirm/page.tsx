// app/bookings/confirm/page.tsx
import { Suspense } from "react";
import BookingConfirmClient from "./BookingConfirmClient";

export default function BookingConfirmPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24, maxWidth: 860, margin: "0 auto" }}>Loading...</main>}>
      <BookingConfirmClient />
    </Suspense>
  );
}
