import type { Metadata } from "next";
import NewArrivalsView from "@/components/NewArrivalsView";

export const metadata: Metadata = {
  title: "New Arrivals | Rung E Bahar — Luxury Designer-Inspired Dresses",
  description:
    "Browse 204 new arrivals. Filter by availability, sort by price or date, and switch between comfortable and compact grid views.",
};

export default function NewArrivalsPage() {
  return <NewArrivalsView />;
}
