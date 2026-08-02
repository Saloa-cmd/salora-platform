import {
  withPrismaAuthContextTx,
  type PrismaAuthContext
} from "../../database/rls-context";
import { incrementMetric } from "../../runtime/metrics";

export interface MenuCollectionRepository {
  run<T>(operation: (database: any) => Promise<T>): Promise<T>;
}

export function createMenuCollectionRepository(
  authContext: PrismaAuthContext
): MenuCollectionRepository {
  return {
    run: <T>(operation: (database: any) => Promise<T>) =>
      withPrismaAuthContextTx(authContext, async (database) => {
        incrementMetric("salora_menu_collections_domain_transaction");
        return operation(database as any);
      })
  };
}
