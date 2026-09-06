import { DEFAULT_PAGINATION } from '@/common/constants';

export const normalizePagination = ({
  page,
  limit,
}: {
  page: number;
  limit: number;
}): {
  page: number;
  limit: number;
  skip: number;
} => {
  if (isNaN(page) || page < 1) page = DEFAULT_PAGINATION.PAGE;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_PAGINATION.LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
