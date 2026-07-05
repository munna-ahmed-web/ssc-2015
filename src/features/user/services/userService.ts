import type { User } from "../types";

export async function getUserById(id: string): Promise<User | null> {
  // TODO: implement API call
  return id === "1" ? { id: "1", name: "John Doe", email: "john.doe@example.com" } : null;
}
