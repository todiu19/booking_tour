export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null

  return (
    <div className="pagination">
      <button type="button" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
        Previous
      </button>
      <span>
        Page {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </button>
    </div>
  )
}
