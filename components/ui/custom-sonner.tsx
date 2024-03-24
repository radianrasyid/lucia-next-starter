import { ReactNode } from "react";
import { toast } from "sonner";

export const toastPromise = <T,>(
  apiCall: Promise<{ data: T; isSuccess: boolean; status: number }>,
  {
    error,
    loading,
    success,
  }: {
    success: (data: T) => ReactNode;
    error: (data: T) => ReactNode;
    loading: ReactNode;
  }
) => {
  toast.loading(loading, {
    id: "loading-sonner-customized",
  });

  apiCall.then((d) => {
    toast.dismiss("loading-sonner-customized");
    if (d.isSuccess) {
      const result = success(d.data);
      toast.success(result, {});
      return;
    } else {
      const result = error(d.data);
      toast.error(result, {});
      return;
    }
  });
};
