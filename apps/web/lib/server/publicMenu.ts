import type { MenuAuthoritySnapshot, Product } from "@salora/types";
import { getMenuAuthoritySnapshot } from "./menuAuthority";

export type PublicMenuSnapshot = MenuAuthoritySnapshot;
export type PublicMenuSource = MenuAuthoritySnapshot["source"];

export async function getPublicMenuSnapshot(): Promise<PublicMenuSnapshot> {
  return getMenuAuthoritySnapshot();
}

export async function getPublicMenuProducts(): Promise<Product[]> {
  return (await getPublicMenuSnapshot()).products;
}
