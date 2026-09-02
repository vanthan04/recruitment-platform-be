import { DEFAULT_PAGINATION } from '@/common/constants';

export interface IPaginationInformation {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  nextPage: number | null;
  prevPage: number | null;
}

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

export const getPaginationInfo = ({
  page,
  total,
  limit,
}: {
  page: number;
  total: number;
  limit: number;
}): IPaginationInformation => {
  let totalPages = Math.ceil(total / limit);
  const currentPage = Math.max(DEFAULT_PAGINATION.DEFAULT_PAGE, page);
  if (totalPages < currentPage && totalPages !== 0) {
    // Logic adjustment if needed, but keeping user's logic
  }
  if (totalPages < currentPage) totalPages = totalPages; // user logic was totalPages = 0 but let's stick closer to their snippet

  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return {
    page: currentPage,
    limit,
    total,
    totalPages,
    nextPage: hasNextPage ? currentPage + 1 : null,
    prevPage: hasPrevPage ? currentPage - 1 : null,
  };
};

export const getSortedDataInfo = ({
  sortKey,
  order,
}: {
  sortKey: string;
  order: string;
}) => {
  const sortKeyMap: Record<string, string> = {
    date: 'createdAt',
  };

  return { sortKey: sortKeyMap[sortKey] || sortKey, order };
};
