"use client";

import BackToTop from "./BackToTop";
import Toast from "./Toast";
import QuickViewModal from "./QuickViewModal";
import RecentReviewPopup from "./RecentReviewPopup";
import DiscountPopup, { type DiscountPopupProps } from "./DiscountPopup";
import FirstVisitRegionDialog from "./FirstVisitRegionDialog";

export default function FloatingElements({
  promoCode,
  promoDiscount,
}: DiscountPopupProps) {
  return (
    <>
      <BackToTop />
      <Toast />
      <QuickViewModal />
      <DiscountPopup promoCode={promoCode} promoDiscount={promoDiscount} />
      <RecentReviewPopup />
      <FirstVisitRegionDialog />
    </>
  );
}
