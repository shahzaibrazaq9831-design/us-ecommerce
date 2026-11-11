"use client";

import BackToTop from "./BackToTop";
import Toast from "./Toast";
import QuickViewModal from "./QuickViewModal";
import RecentReviewPopup from "./RecentReviewPopup";
import DiscountPopup from "./DiscountPopup";
import FirstVisitRegionDialog from "./FirstVisitRegionDialog";

export default function FloatingElements() {
  return (
    <>
      <BackToTop />
      <Toast />
      <QuickViewModal />
      <DiscountPopup />
      <RecentReviewPopup />
      <FirstVisitRegionDialog />
    </>
  );
}
