"use server";

import { cookies } from "next/headers";

export const enableCredential = () => {
  cookies().set(
    "creator",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdG9yIjoiTXVoYW1tYWQgUmFkaWFuIFJhc3lpZCIsImdpdGh1YiI6Imh0dHBzOi8vZ2l0aHViLmNvbS9yYWRpYW5yYXN5aWQiLCJsaW5rZWRpbiI6Imh0dHBzOi8vd3d3LmxpbmtlZGluLmNvbS9pbi9tdWhhbW1hZHJhZGlhbnJhc3lpZC8ifQ.BU4EgjOiq5rcG5NPFshcQBYNCX2t8rWEdNrAeJ0KDvI",
    {
      httpOnly: true,
      secure: true,
    }
  );
};
