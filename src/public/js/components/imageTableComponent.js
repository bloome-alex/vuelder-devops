function renderImageRow(image) {
  return `
    <tr>
      <td>
        <div class="image-name">
          <span class="image-chip">⬢</span>
          ${image.name}
        </div>
      </td>
      <td>${image.repository}</td>
      <td><span class="tag">${image.tag}</span></td>
      <td>${image.size}</td>
      <td>${image.updated}</td>
      <td class="digest">${image.digest}</td>
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
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  `;

  const tableBody = wrapper.querySelector("tbody");

  return {
    element: wrapper,
    render(images) {
      tableBody.innerHTML = images.map(renderImageRow).join("");
    }
  };
}
