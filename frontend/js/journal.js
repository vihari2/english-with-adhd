
/* Writing Journal — Supabase */

let journalNotes = [];
let currentJournalNoteId = null;
let journalUserId = null;
let journalInitialized = false;
let journalLoading = false;
let journalSaving = false;
let journalDirty = false;

function getJournalElements() {
  return {
    title: document.querySelector("#journal-title"),
    content: document.querySelector("#journal-content"),
    status: document.querySelector("#journal-save-status"),
    modal: document.querySelector("#my-notes-modal"),
    list: document.querySelector("#journal-notes-list"),
    search: document.querySelector("#journal-notes-search")
  };
}

function setJournalStatus(message) {
  const { status } = getJournalElements();
  if (status) status.textContent = message;
}

function escapeJournalText(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderizarWritingJournal(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="journal-page">
      <section class="journal-paper" aria-label="Write a journal entry">
        <label class="sr-only" for="journal-title">Note title</label>
        <input
          class="journal-title"
          id="journal-title"
          type="text"
          maxlength="120"
          placeholder="Give your note a title..."
        >

        <label class="sr-only" for="journal-content">Your note</label>
        <textarea
          class="journal-content"
          id="journal-content"
          placeholder="Dear diary... What would you like to write today?"
          rows="10"
        ></textarea>
      </section>

      <div class="journal-toolbar" aria-label="Journal actions">
        <button type="button" class="journal-save-button" id="save-note-btn">
          Save Note
        </button>
        <button type="button" class="journal-notes-button" id="my-notes-btn">
          My Notes
        </button>
      </div>

      <div class="journal-footer">
        <p id="journal-save-status" class="journal-save-status"
           role="status" aria-live="polite">
          Loading your journal...
        </p>
        <button type="button" class="journal-new-button" id="new-note-btn">
          + New Note
        </button>
      </div>

      <div class="journal-modal" id="my-notes-modal" hidden>
        <div class="journal-modal-backdrop" data-close-modal></div>

        <section class="journal-modal-dialog"
          role="dialog" aria-modal="true" aria-labelledby="my-notes-title">

          <header class="journal-modal-header">
            <h3 id="my-notes-title">My Notes</h3>
            <button type="button" class="journal-modal-close"
              id="close-notes-btn" aria-label="Close My Notes">×</button>
          </header>

          <label class="sr-only" for="journal-notes-search">Search notes</label>
          <input
            id="journal-notes-search"
            class="journal-notes-search"
            type="search"
            placeholder="Search your notes..."
          >

          <div id="journal-notes-list" class="journal-notes-list"></div>
        </section>
      </div>
    </div>
  `;

  journalInitialized = false;
  journalDirty = false;

  if (!container.dataset.journalInitialized) {
    container.addEventListener("input", event => {
      if (event.target.matches("#journal-title, #journal-content")) {
        if (!journalLoading) journalDirty = true;

        if (event.target.matches("#journal-content")) {
          resizeJournalContent(event.target);
        }
      }

      if (event.target.matches("#journal-notes-search")) {
        renderJournalNotes();
      }
    });

    container.addEventListener("click", handleJournalClick);
    container.dataset.journalInitialized = "true";
  }

  initializeJournal();
}

async function initializeJournal() {
  if (journalInitialized) return;
  journalInitialized = true;

  try {
    const client = getSupabaseClient();

    if (!client) {
      throw new Error("Supabase client is unavailable.");
    }

    const { data: authData, error: authError } =
      await client.auth.getUser();

    if (authError) throw authError;

    const user = authData?.user;
    if (!user) {
      setJournalStatus("Please sign in to access your journal.");
      return;
    }

    journalUserId = user.id;
    await fetchJournalNotes();

    const firstNote = journalNotes[0] ?? null;
    currentJournalNoteId = firstNote?.id ?? null;
    loadJournalNote(firstNote);
    renderJournalNotes();
    setJournalStatus(
      journalNotes.length
        ? "Your journal is ready."
        : "Your journal is ready. Write your first note."
    );
  } catch (error) {
    console.error("Could not initialize journal:", error);
    setJournalStatus("Could not load your notes. Please try again.");
    journalInitialized = false;
  }
}

async function fetchJournalNotes() {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from("journal_entries")
    .select("id, user_id, title, content, created_at, updated_at")
    .eq("user_id", journalUserId)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  journalNotes = data ?? [];
}

function resizeJournalContent(textarea) {
  if (!textarea) return;

  textarea.style.height = "auto";

  const maxHeight =
    Number.parseFloat(getComputedStyle(textarea).maxHeight) || 480;

  const desiredHeight = textarea.scrollHeight;
  textarea.style.height = `${Math.min(desiredHeight, maxHeight)}px`;
  textarea.style.overflowY = desiredHeight > maxHeight ? "auto" : "hidden";
}

function loadJournalNote(note) {
  const { title, content } = getJournalElements();
  if (!title || !content) return;

  journalLoading = true;
  title.value = note?.title ?? "";
  content.value = note?.content ?? "";
  currentJournalNoteId = note?.id ?? null;
  journalDirty = false;
  resizeJournalContent(content);
  journalLoading = false;
}

function renderJournalNotes() {
  const { list, search } = getJournalElements();
  if (!list) return;

  list.replaceChildren();

  const query = (search?.value ?? "").trim().toLowerCase();

  const filteredNotes = [...journalNotes]
    .sort((a, b) =>
      new Date(b.updated_at).getTime() -
      new Date(a.updated_at).getTime()
    )
    .filter(note =>
      `${note.title ?? ""} ${note.content ?? ""}`
        .toLowerCase()
        .includes(query)
    );

  if (!filteredNotes.length) {
    const empty = document.createElement("p");
    empty.className = "journal-empty-message";
    empty.textContent = journalNotes.length
      ? "No notes match your search."
      : "No saved notes yet.";
    list.appendChild(empty);
    return;
  }

  filteredNotes.forEach(note => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "journal-note-item";
    if (note.id === currentJournalNoteId) button.classList.add("active");
    button.dataset.noteId = note.id;

    const title = document.createElement("strong");
    title.textContent = note.title || "Untitled note";

    const preview = document.createElement("span");
    preview.textContent =
      (note.content ?? "").trim().slice(0, 120) || "No writing yet";

    const date = document.createElement("small");
    date.textContent = new Date(note.updated_at).toLocaleDateString();

    button.append(title, preview, date);
    list.appendChild(button);
  });
}

function confirmDiscardChanges() {
  if (!journalDirty) return true;

  return window.confirm(
    "You have unsaved changes. Discard them and continue?"
  );
}

async function saveCurrentJournalNote() {
  if (journalSaving) return;

  if (!journalUserId) {
    setJournalStatus("Please sign in before saving your note.");
    return;
  }

  const { title, content } = getJournalElements();
  const noteTitle = title?.value.trim() ?? "";
  const noteContent = content?.value ?? "";

  if (!noteTitle && !noteContent.trim()) {
    setJournalStatus("Write something before saving your note.");
    return;
  }

  journalSaving = true;

  const saveButton = document.querySelector("#save-note-btn");
  if (saveButton) saveButton.disabled = true;

  try {
    const client = getSupabaseClient();
    const now = new Date().toISOString();

    const values = {
      user_id: journalUserId,
      title: noteTitle || "Untitled note",
      content: noteContent,
      updated_at: now
    };

    let result;

    if (currentJournalNoteId) {
      result = await client
        .from("journal_entries")
        .update(values)
        .eq("id", currentJournalNoteId)
        .eq("user_id", journalUserId)
        .select("id, user_id, title, content, created_at, updated_at")
        .single();
    } else {
      result = await client
        .from("journal_entries")
        .insert(values)
        .select("id, user_id, title, content, created_at, updated_at")
        .single();
    }

    if (result.error) throw result.error;

    const savedNote = result.data;
    currentJournalNoteId = savedNote.id;

    journalNotes = [
      savedNote,
      ...journalNotes.filter(note => note.id !== savedNote.id)
    ];

    journalDirty = false;
    renderJournalNotes();
    setJournalStatus("Your note has been saved to your account.");
  } catch (error) {
    console.error("Could not save journal note:", error);
    setJournalStatus("Could not save your note. Please try again.");
  } finally {
    journalSaving = false;
    if (saveButton) saveButton.disabled = false;
  }
}

function openJournalModal() {
  const { modal, search } = getJournalElements();
  if (!modal) return;

  if (search) search.value = "";
  renderJournalNotes();
  modal.hidden = false;
  document.body.classList.add("journal-modal-open");
  modal.querySelector("#close-notes-btn")?.focus();
}

function closeJournalModal() {
  const { modal } = getJournalElements();
  if (!modal) return;

  modal.hidden = true;
  document.body.classList.remove("journal-modal-open");
  document.querySelector("#my-notes-btn")?.focus();
}

function handleJournalClick(event) {
  const target = event.target;

  if (target.closest("#save-note-btn")) {
    saveCurrentJournalNote();
    return;
  }

  if (target.closest("#my-notes-btn")) {
    openJournalModal();
    return;
  }

  if (
    target.closest("#close-notes-btn") ||
    target.closest("[data-close-modal]")
  ) {
    closeJournalModal();
    return;
  }

  if (target.closest("#new-note-btn")) {
    if (!confirmDiscardChanges()) return;

    loadJournalNote(null);
    setJournalStatus("Start writing a new note.");
    return;
  }

  const noteButton = target.closest("[data-note-id]");
  if (noteButton) {
    if (!confirmDiscardChanges()) return;

    const note = journalNotes.find(
      item => item.id === noteButton.dataset.noteId
    );

    if (!note) return;

    loadJournalNote(note);
    renderJournalNotes();
    closeJournalModal();
    setJournalStatus("Note opened.");
  }
}

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    const modal = document.querySelector("#my-notes-modal");
    if (modal && !modal.hidden) closeJournalModal();
  }
});
