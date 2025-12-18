import './Modal.css';

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="modal__backdrop" onClick={onClose} role="presentation">
      <div className="modal__body" onClick={(e) => e.stopPropagation()} role="presentation">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="modal__close" onClick={onClose} aria-label="关闭弹窗">
            ×
          </button>
        </div>
        <div className="modal__content">{children}</div>
      </div>
    </div>
  );
}

export default Modal;

