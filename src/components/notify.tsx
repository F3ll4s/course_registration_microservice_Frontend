import { type ExternalToast, toast } from "sonner";
import { PortalToast, type ToastTone } from "./PortalToast";

const show = (tone: ToastTone) => (title: string, description?: string, options?: ExternalToast) =>
  toast.custom((id) => <PortalToast id={id} tone={tone} title={title} description={description} />, options);

// notify.success("Enrollment successful", "Registered for CS301 Sec 1 (3 Credits).")
export const notify = {
  success: show("success"),
  error: show("error"),
  waitlist: show("waitlist"),
};
