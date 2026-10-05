# Design Deviation Log

This document records instances where the implementation deliberately deviated from the provided Figma mockups for UX or technical enhancements.

1. **Toast Notifications:** 
   - **Figma:** Did not specify generic success messaging after actions.
   - **Deviation:** We introduced a global `Toast` context (located in the bottom right corner) for success/error handling for actions like creating orders, confirming deliveries, and releasing trips. This improves accessibility and immediate user feedback.

2. **Offline Mode Visuals:**
   - **Figma:** Provided general screens but lacked a persistent visual indicator when network connectivity was entirely lost across the app.
   - **Deviation:** Introduced a sticky global yellow `OfflineBanner` at the top of the screen. This ensures Drivers have continuous system status feedback, enhancing usability during degradation scenarios without interrupting their workflow.

3. **Loading States (Skeletons):**
   - **Figma:** Raw blank screens or basic spinners during data fetches.
   - **Deviation:** Implemented custom gradient-shimmer `Skeleton` components in place of raw blank screens. This reduces perceived latency and provides a modern, premium feel.

4. **Empty States:**
   - **Figma:** Assumed data is always present.
   - **Deviation:** Added distinct "No Orders Found" and "No Trips Available" empty state graphics and text to guide users when queues are clear.
