export function createConfirmModal({ title, message, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm }) {
  if (document.body.querySelector(".modal-backdrop")) {
    return null;
  }

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `
    <div class="modal confirm-modal">
      <div class="modal-header">
        <div>
          <h3>${title}</h3>
          <p>${message}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="button ghost cancel-confirm">${cancelText}</button>
        <button type="button" class="button danger accept-confirm">${confirmText}</button>
      </div>
    </div>
  `;

  modal.addEventListener("click", async event => {
    if (event.target === modal || event.target.closest(".cancel-confirm")) {
      modal.remove();
      return;
    }

    if (event.target.closest(".accept-confirm")) {
      const button = event.target.closest(".accept-confirm");
      button.disabled = true;
      button.textContent = "Procesando...";

      try {
        await onConfirm();
        modal.remove();
      } catch (error) {
        button.disabled = false;
        button.textContent = confirmText;
      }
    }
  });

  document.body.append(modal);
  return modal;
}