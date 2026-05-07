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
      identification
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
      applications {
        id
        ref
        firstname
        lastname
        identification
        screeningpass
        createdAt
        cv {
          id
          url
          fileName
        }
        supportingdocs {
          id
          url
          fileName
        }
      }
    }
  }
`;

// ─── Applications ────────────────────────────────────────────────────────────

export const CREATE_APPLICATION = gql`
  mutation CreateApplication($data: ApplicationCreateInput!) {
    createApplication(data: $data) {
      id
    }
  }
`;

export const PUBLISH_APPLICATION = gql`
  mutation PublishApplication($id: ID!) {
    publishApplication(where: { id: $id }) {
      id
    }
  }
`;

export const GET_APPLICATIONS = gql`
  query GetApplications {
    applications(orderBy: createdAt_DESC) {
      id
      ref
      firstname
      lastname
      identification
      screeningpass
      createdAt
      cv {
        id
        url
        fileName
      }
      supportingdocs {
        id
        url
        fileName
      }
    }
  }
`;

export const UPDATE_POSTING_ADD_APPLICATION = gql`
  mutation UpdatePostingAddApplication($postingId: ID!, $applicationId: ID!) {
    updatePosting(
      where: { id: $postingId }
      data: { applications: { connect: { where: { id: $applicationId } } } }
    ) {
      id
    }
  }
`;

export const PUBLISH_POSTING = gql`
  mutation PublishPosting($id: ID!) {
    publishPosting(where: { id: $id }) {
      id
    }
  }
`;

export const PUBLISH_ASSET = gql`
  mutation PublishAsset($id: ID!) {
    publishAsset(where: { id: $id }) {
      id
    }
  }
`;

export const CREATE_POSTING = gql`
  mutation CreatePosting($data: PostingCreateInput!) {
    createPosting(data: $data) {
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
    }
  }
`;

export const UPDATE_POSTING = gql`
  mutation UpdatePosting($id: ID!, $data: PostingUpdateInput!) {
    updatePosting(where: { id: $id }, data: $data) {
      id
    }
  }
`;

export const UNPUBLISH_POSTING = gql`
  mutation UnpublishPosting($id: ID!) {
    unpublishPosting(where: { id: $id }) {
      id
    }
  }
`;

export const DELETE_POSTING = gql`
  mutation DeletePosting($id: ID!) {
    deletePosting(where: { id: $id }) {
      id
    }
  }
`;
