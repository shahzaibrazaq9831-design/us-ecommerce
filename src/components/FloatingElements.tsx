"use client";

import WhatsAppFloat from "./WhatsAppFloat";
import BackToTop from "./BackToTop";
import Toast from "./Toast";
import QuickViewModal from "./QuickViewModal";
import RecentReviewPopup from "./RecentReviewPopup";

export default function FloatingElements() {
  return (
    <>
      <WhatsAppFloat />
      <BackToTop />
      <Toast />
      <QuickViewModal />
      <RecentReviewPopup />
    </>
  );
}
