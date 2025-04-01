"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, signInWithCustomToken } from "firebase/auth";
import Loading from "@/components/Loading";
import { functions } from "@/firebaseConfig/firebase";
import { httpsCallable } from "firebase/functions";

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exchangeToken = httpsCallable(functions, "exchangeToken");

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      exchangeToken({ code })
        .then(async (res: any) => {
          if (res.data.firebaseToken) {
            const auth = getAuth();
            await signInWithCustomToken(auth, res.data.firebaseToken);
            router.push("/");
          }
        })
        .catch((err) => {
          console.error("Error exchanging token", err);
          router.push("/");
        });
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loading message="Connecting to Spotify" />
    </div>
  );
}
