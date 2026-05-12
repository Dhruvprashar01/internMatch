import React from "react";
import "./Pagination.css";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1);
  return (
    <div className="pagination">
      <button className="pg-btn" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>‹</button>
      {visible.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && visible[i-1] !== p - 1 && <span className="pg-ellipsis">…</span>}
          <button className={`pg-btn ${p === currentPage ? "active" : ""}`} onClick={() => onPageChange(p)}>{p}</button>
        </React.Fragment>
      ))}
      <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>›</button>
    </div>
  );
};

export default Pagination;
