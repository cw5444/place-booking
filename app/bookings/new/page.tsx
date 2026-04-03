// app/bookings/new/page.tsx
import { Suspense } from "react";
import BookingNewClient from "./BookingNewClient";

export default function BookingNewPage() {
  return (
    <Suspense fallback={<main style={{ padding: 24, maxWidth: 1120, margin: "0 auto" }}>Loading...</main>}>
      <BookingNewClient />
    </Suspense>
  );
}
