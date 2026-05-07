import { GraphQLClient } from "graphql-request";

const endpoint = process.env.NEXT_PUBLIC_HYGRAPH_ENDPOINT ?? "";
const token = process.env.NEXT_PUBLIC_HYGRAPH_TOKEN ?? "";

export const hygraph = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
