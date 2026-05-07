import { GraphQLClient } from "graphql-request";

const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT;

if (!endpoint) {
  throw new Error("NEXT_PUBLIC_HYGRAPH_ENDPOINT is not defined");
}

export const hygraph = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_HYGRAPH_TOKEN ?? ""}`,
  },
});
