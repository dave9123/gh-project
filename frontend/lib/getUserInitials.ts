/**
 * Get user initials from a name string
 * @param name - The user's full name
 * @returns The user's initials (e.g., "John Doe" -> "JD")
 */
export const getUserInitials = (name: string): string => {
  if (!name) return "";

  // Split the name into words and filter out empty strings
  const words = name.split(" ").filter((word) => word.length > 0);

  if (words.length === 0) return "";

  // If there's only one word, return its first letter
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  // Return first letter of first and last name
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
};
