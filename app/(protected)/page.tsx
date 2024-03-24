"use client";

import { Button } from "@/components/ui/button";
import { toastPromise } from "@/components/ui/custom-sonner";
import { SigningOut } from "@/utils/authFunction";
import { useState } from "react";
import { GETPostsList } from "../_api/posts/postApiList";

const ProtectedPage = () => {
  const [currentData, setCurrentData] = useState<any[]>([]);
  return (
    <div className="flex items-center justify-center flex-col min-h-screen">
      <h1>
        This is protected page, u shouldn't see this if you are unauthorized
      </h1>
      <Button
        variant={"outline"}
        className="mb-3"
        onClick={async () => {
          const fetching = GETPostsList();

          toastPromise(fetching, {
            success: (data) => {
              console.log("ini data", data);
              setCurrentData(data);
              return "Berhasil Hore!";
            },
            error: (data) => {
              console.log("ini data error", data);
              return "Gagal";
            },
            loading: "Fetching...",
          });
        }}
      >
        test api
      </Button>
      <form action={"/api/logout"}>
        <Button
          type="button"
          onClick={() => {
            SigningOut();
          }}
        >
          logout
        </Button>
      </form>
      <div className="mt-3 p-11 bg-slate-200 m-3 rounded-lg">
        {currentData.length == 0 && <span className="text-xs">No Data</span>}
        {currentData.length > 0 && (
          <ul className="max-h-[50vh] overflow-y-auto text-left">
            {currentData.map((i, index) => (
              <li className="[&:not(:last-child)]:mb-3">
                <h6>
                  {index + 1}. {i.title}
                </h6>
                <p>{i.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ProtectedPage;
