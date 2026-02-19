import { useState, useMemo, useCallback, useEffect } from 'react';

/**
 * Hook reutilizável para paginação client-side
 * @param items - Array completo de items a paginar
 * @param itemsPerPage - Quantidade de items por página
 */
export function usePagination<T>(items: T[], itemsPerPage: number) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(items.length / itemsPerPage)),
        [items.length, itemsPerPage]
    );

    // Reset para página 1 quando items ou itemsPerPage mudam
    useEffect(() => {
        setCurrentPage(1);
    }, [items.length, itemsPerPage]);

    // Garante que a página atual nunca ultrapasse totalPages
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return items.slice(startIndex, startIndex + itemsPerPage);
    }, [items, currentPage, itemsPerPage]);

    const goToNextPage = useCallback(() => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    }, [totalPages]);

    const goToPreviousPage = useCallback(() => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    }, []);

    return {
        currentPage,
        setCurrentPage,
        totalPages,
        paginatedItems,
        goToNextPage,
        goToPreviousPage,
        totalItems: items.length,
    };
}
