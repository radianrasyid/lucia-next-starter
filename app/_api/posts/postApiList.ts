import { useFetch } from "../apiInstance";

export const GETPostsList = async () => {
  const fetching = await useFetch({
    url: "/posts",
    method: "GET",
  });

  return fetching;
};
