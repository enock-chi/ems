import { gql } from "graphql-request";

// ─── Queries ────────────────────────────────────────────────────────────────

export const GET_AUTH_BY_EMAIL = gql`
  query GetAuthByEmail($email: String!) {
    auths(where: { email: $email }, first: 1) {
      id
      firstname
      lastname
      email
      passwordHash
      hr
      applicant
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_AUTH = gql`
  mutation CreateAuth(
    $firstname: String!
    $lastname: String!
    $email: String!
    $passwordHash: String!
    $contact: String!
    $empid: String
    $identification: String
    $hr: Boolean!
    $applicant: Boolean!
  ) {
    createAuth(
      data: {
        firstname: $firstname
        lastname: $lastname
        email: $email
        passwordHash: $passwordHash
        contact: $contact
        empid: $empid
        identification: $identification
        hr: $hr
        applicant: $applicant
      }
    ) {
      id
      firstname
      lastname
      email
    }
  }
`;

export const PUBLISH_AUTH = gql`
  mutation PublishAuth($id: ID!) {
    publishAuth(where: { id: $id }) {
      id
    }
  }
`;

// ─── Postings ────────────────────────────────────────────────────────────────

export const GET_POSTINGS = gql`
  query GetPostings {
    postings {
      id
      ref
      title
      department
      positions
      description
      notes
      closingdate
      location
      enquiries
      compensation
      requirements {
        id
        criteria
      }
    }
  }
`;
