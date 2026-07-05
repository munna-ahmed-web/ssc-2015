import { parseAsInteger, parseAsString } from "nuqs";

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(10),
};

export const searchParsers = {
  q: parseAsString.withDefault(""),
};
