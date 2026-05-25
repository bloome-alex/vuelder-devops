function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character]);
}

function renderImageRow(image, deletingImage) {
  const imageKey = `${image.repository}:${image.tag}`;
  const isDeleting = deletingImage === imageKey;

  return `
    <tr>
      <td>
        <div class="image-name">
          <span class="image-chip">⬢</span>
          ${escapeHtml(image.name)}
        </div>
      </td>
      <td>${escapeHtml(image.repository)}</td>
      <td><span class="tag">${escapeHtml(image.tag)}</span></td>
      <td>${escapeHtml(image.size)}</td>
      <td>${escapeHtml(image.updated)}</td>
      <td class="digest">${escapeHtml(image.digest)}</td>
      <td>
        <button type="button" class="button danger delete-image" data-repository="${escapeHtml(image.repository)}" data-tag="${escapeHtml(image.tag)}" ${isDeleting ? "disabled" : ""}>
          ${isDeleting ? "Eliminando..." : "Eliminar"}
        </button>
      </td>
    </tr>
  `;
}

export function createImageTableComponent() {
  const wrapper = document.createElement("div");
  wrapper.className = "table-wrap";
  wrapper.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Imagen</th>
          <th>Repositorio</th>
          <th>Tag</th>
          <th>Tamaño</th>
          <th>Actualizada</th>
          <th>Digest</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const tableBody = wrapper.querySelector("tbody");

  return {
    element: wrapper,
    render(images, deletingImage = "") {
      tableBody.innerHTML = images.map(image => renderImageRow(image, deletingImage)).join("");
    }
  };
}
