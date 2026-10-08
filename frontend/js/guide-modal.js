(() => {
  const guides = {
    "coursebook.html": { file: "coursebooks.md", title: "Coursebook guide" },
    "speaking.html": { file: "speaking.md", title: "Speaking guide" },
    "writing-journal.html": { file: "writing-guide.md", title: "Writing guide" }
  };

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function inlineMarkdown(value) {
    const normalized = value
      .replace(/<a\s+href="(https?:\/\/[^\"]+)"[^>]*>(.*?)<\/a>/gi, (_, url, label) => `[${label.replace(/<[^>]*>/g, "")}](${url})`)
      .replace(/<\/?strong>/gi, "");
    let html = escapeHtml(normalized);
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    return html;
  }

  function renderMarkdown(markdown) {
    const lines = markdown.replace(/\r/g, "").split("\n");
    const output = [];
    let listType = null;
    let paragraph = [];

    const closeList = () => {
      if (listType) output.push(`</${listType}>`);
      listType = null;
    };
    const flushParagraph = () => {
      if (paragraph.length) output.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    };
    const cell = (value) => inlineMarkdown(value.trim().replace(/^\*\*(.*)\*\*$/, "$1"));

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const trimmed = line.trim();
      if (!trimmed) { flushParagraph(); closeList(); continue; }

      if (trimmed.startsWith("|") && index + 1 < lines.length && /^\s*\|?\s*:?-{3,}/.test(lines[index + 1])) {
        flushParagraph(); closeList();
        const rows = [line];
        index += 2;
        while (index < lines.length && lines[index].trim().startsWith("|")) rows.push(lines[index++]);
        index -= 1;
        const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
        const headers = cells(rows[0]);
        output.push(`<div class="guide-table-wrap"><table><thead><tr>${headers.map((item) => `<th>${cell(item)}</th>`).join("")}</tr></thead><tbody>`);
        rows.slice(1).forEach((row) => output.push(`<tr>${cells(row).map((item) => `<td>${cell(item)}</td>`).join("")}</tr>`));
        output.push("</tbody></table></div>");
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        flushParagraph(); closeList();
        const level = heading[1].length;
        output.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        continue;
      }
      if (/^(---+|\*\*\*+)$/.test(trimmed)) { flushParagraph(); closeList(); output.push("<hr>"); continue; }
      const listItem = trimmed.match(/^([-*+]\s+|\d+\.\s+)(.*)$/);
      if (listItem) {
        flushParagraph();
        const nextType = /^\d/.test(listItem[1]) ? "ol" : "ul";
        if (listType !== nextType) { closeList(); output.push(`<${nextType}>`); listType = nextType; }
        output.push(`<li>${inlineMarkdown(listItem[2])}</li>`);
        continue;
      }
      if (trimmed.startsWith(">")) {
        flushParagraph(); closeList();
        output.push(`<blockquote>${inlineMarkdown(trimmed.replace(/^>\s?/, ""))}</blockquote>`);
        continue;
      }

      // Preserve the repository's simple HTML links and images in the guides.
      const rawLink = trimmed.match(/^<a\s+href="(https?:\/\/[^\"]+)"[^>]*>(.*?)<\/a>$/i);
      const rawImage = trimmed.match(/^<img\s+src="(https?:\/\/[^\"]+)"\s+alt="([^\"]*)"[^>]*>$/i);
      if (rawLink || rawImage) {
        flushParagraph(); closeList();
        output.push(rawLink
          ? `<p><a href="${rawLink[1]}" target="_blank" rel="noopener noreferrer">${rawLink[2]}</a></p>`
          : `<p><img src="${rawImage[1]}" alt="${escapeHtml(rawImage[2])}" loading="lazy"></p>`);
        continue;
      }
      paragraph.push(trimmed);
    }
    flushParagraph(); closeList();
    return output.join("\n");
  }

  function closeModal(modal) {
    modal.hidden = true;
    document.body.classList.remove("guide-modal-open");
    modal.opener?.focus();
  }

  window.showPageGuide = async function showPageGuide(pageName) {
    const guide = guides[pageName];
    if (!guide) return;

    let modal = document.getElementById("page-guide-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "page-guide-modal";
      modal.className = "guide-modal";
      modal.hidden = true;
      modal.innerHTML = `<section class="guide-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="guide-modal-title"><header class="guide-modal-header"><h2 id="guide-modal-title"></h2><button type="button" class="guide-modal-close" aria-label="Close guide">×</button></header><div class="guide-modal-content" tabindex="0"><p role="status">Loading guide…</p></div></section>`;
      document.body.appendChild(modal);
      modal.querySelector(".guide-modal-close").addEventListener("click", () => closeModal(modal));
      modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(modal); });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal.hidden) closeModal(modal);
      });
    }

    modal.opener = document.activeElement;
    modal.querySelector("#guide-modal-title").textContent = guide.title;
    modal.querySelector(".guide-modal-content").innerHTML = "<p role=\"status\">Loading guide…</p>";
    modal.hidden = false;
    document.body.classList.add("guide-modal-open");
    modal.querySelector(".guide-modal-content").focus();

    try {
      const response = await fetch(`../please-read/${guide.file}`);
      if (!response.ok) throw new Error(`Guide request failed: ${response.status}`);
      modal.querySelector(".guide-modal-content").innerHTML = renderMarkdown(await response.text());
    } catch (error) {
      console.error("Could not load page guide:", error);
      modal.querySelector(".guide-modal-content").innerHTML = "<p role=\"alert\">Could not load this guide. Please try again.</p>";
    }
  };
})();
