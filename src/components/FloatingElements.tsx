"use client";

import BackToTop from "./BackToTop";
import Toast from "./Toast";
import QuickViewModal from "./QuickViewModal";
import RecentReviewPopup from "./RecentReviewPopup";

export default function FloatingElements() {
  return (
    <>
      <BackToTop />
      <Toast />
      <QuickViewModal />
      <RecentReviewPopup />
    </>
  );
}
