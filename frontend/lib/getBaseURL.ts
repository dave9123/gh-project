export default function getBaseURL() {
  // console.log(process.env.NODE_ENV);
  const baseUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXTAUTH_URL
      : process.env.NODE_ENV === "production"
      ? `${process.env.NEXTAUTH_URL}`
      : `${process.env.NEXTAUTH_URL_INTERNAL}`; // or your actual domain

  return baseUrl;
}
